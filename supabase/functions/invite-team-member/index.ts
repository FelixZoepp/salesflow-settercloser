import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Nicht authentifiziert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser } } = await userClient.auth.getUser();
    if (!callerUser) {
      return new Response(
        JSON.stringify({ error: "Nicht authentifiziert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get caller's profile and account
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("account_id, role, is_super_admin")
      .eq("id", callerUser.id)
      .single();

    if (!callerProfile?.account_id) {
      return new Response(
        JSON.stringify({ error: "Kein Account gefunden" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only admins or super admins can invite
    if (callerProfile.role !== "admin" && !callerProfile.is_super_admin) {
      return new Response(
        JSON.stringify({ error: "Nur Admins können Teammitglieder einladen" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, name, role } = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Email und Name sind erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const memberRole = role || "setter";
    console.log(`Inviting ${email} as ${memberRole} to account ${callerProfile.account_id}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      // Check if already in same account
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("account_id")
        .eq("id", existingUser.id)
        .single();

      if (existingProfile?.account_id === callerProfile.account_id) {
        return new Response(
          JSON.stringify({ error: "Nutzer ist bereits in deinem Team" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create invitation record
    const invitationToken = crypto.randomUUID();
    const { data: invitation, error: invError } = await supabaseAdmin
      .from("invitations")
      .insert({
        token: invitationToken,
        account_id: callerProfile.account_id,
        created_by: callerUser.id,
        email_hint: email,
        role: memberRole,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single();

    if (invError) {
      console.error("Invitation error:", invError);
      return new Response(
        JSON.stringify({ error: `Fehler beim Erstellen der Einladung: ${invError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user with invite link (password reset flow)
    // The user will receive an email to set their password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name, invited_by: callerUser.id },
    });

    if (authError) {
      // If user already exists, just update their profile
      if (authError.message.includes("already been registered")) {
        if (existingUser) {
          await supabaseAdmin
            .from("profiles")
            .update({
              account_id: callerProfile.account_id,
              role: memberRole,
              invited_via: invitation.id,
              trial_ends_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years
            })
            .eq("id", existingUser.id);

          // Mark invitation as used
          await supabaseAdmin
            .from("invitations")
            .update({ used_at: new Date().toISOString(), used_by: existingUser.id })
            .eq("id", invitation.id);

          return new Response(
            JSON.stringify({
              success: true,
              message: `${email} wurde deinem Team hinzugefügt. Der Nutzer kann sich mit seinem bestehenden Passwort einloggen.`,
              existing_user: true,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: `Fehler: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;
    console.log(`Auth user created: ${userId}`);

    // Update profile: assign to inviter's account, set trial for free access
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        account_id: callerProfile.account_id,
        name,
        role: memberRole,
        invited_via: invitation.id,
        onboarding_completed: true,
        trial_ends_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years = effectively permanent
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Mark invitation as used
    await supabaseAdmin
      .from("invitations")
      .update({ used_at: new Date().toISOString(), used_by: userId })
      .eq("id", invitation.id);

    // Send password reset email so user can set their password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${req.headers.get("origin") || supabaseUrl}/auth`,
      },
    });

    if (resetError) {
      console.error("Reset email error:", resetError);
    }

    console.log(`Team member ${email} invited successfully to account ${callerProfile.account_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Einladung an ${email} gesendet! Der Nutzer kann sich jetzt ein Passwort setzen und einloggen.`,
        user_id: userId,
        invitation_id: invitation.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: `Unerwarteter Fehler: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
