import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Nicht autorisiert' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Ungültiges Token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('id', user.id)
      .single();

    if (!profile?.account_id) {
      return new Response(JSON.stringify({ error: 'Kein Account gefunden' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'search') {
      return await handleSearch(body, corsHeaders);
    }

    if (action === 'save_list') {
      return await handleSaveList(supabase, body, profile.account_id, user.id, corsHeaders);
    }

    if (action === 'import_to_contacts') {
      return await handleImportToContacts(supabase, body, profile.account_id, user.id, corsHeaders);
    }

    if (action === 'enrich_list') {
      return await handleEnrichList(supabase, body, profile.account_id, user.id, corsHeaders);
    }

    if (action === 'list_stats') {
      return await handleListStats(supabase, body, profile.account_id, corsHeaders);
    }

    return new Response(JSON.stringify({ error: 'Unbekannte Aktion' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Lead search error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Interner Fehler' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleSearch(body: any, corsHeaders: Record<string, string>) {
  const { industry, location, employee_count, count = 10 } = body;

  if (!industry) {
    return new Response(JSON.stringify({ error: 'Branche ist erforderlich' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI-Konfiguration fehlt' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const locationFilter = location ? `in ${location}` : 'im DACH-Raum (Deutschland, Österreich, Schweiz)';
  const employeeFilter = employee_count ? `mit ${employee_count} Mitarbeitern` : '';

  const prompt = `Du bist ein B2B-Lead-Researcher. Erstelle eine Liste von ${count} realistischen Entscheidern (Geschäftsführer, CEOs, Inhaber, Head of, VP, Direktoren) aus der Branche "${industry}" ${locationFilter} ${employeeFilter}.

Für jeden Entscheider gib folgende Felder als JSON-Array zurück:
- first_name (string, typisch deutsche/österreichische/schweizer Vornamen)
- last_name (string)
- position (string, z.B. Geschäftsführer, CEO, Head of Sales)
- company (string, realistischer Firmenname passend zur Branche)
- industry (string, die Branche)
- employee_count (string, z.B. "10-50", "51-200", "201-500")
- city (string)
- country (string, z.B. Deutschland, Österreich, Schweiz)
- website (string, plausible Domain)
- linkedin_url (string, leer lassen als "")

WICHTIG: Antworte NUR mit einem validen JSON-Array, kein anderer Text. Die Daten sollen realistisch und vielfältig sein.`;

  const response = await fetch('https://lovable-api.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Du bist ein B2B-Lead-Researcher. Antworte ausschließlich mit validem JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('AI API error:', errText);
    return new Response(JSON.stringify({ error: 'KI-Recherche fehlgeschlagen' }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content || '';

  // Parse JSON from AI response
  let leads: any[] = [];
  try {
    // Try to extract JSON array from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      leads = JSON.parse(jsonMatch[0]);
    } else {
      leads = JSON.parse(content);
    }
  } catch (parseErr) {
    console.error('Failed to parse AI response:', content);
    return new Response(JSON.stringify({ error: 'KI-Antwort konnte nicht verarbeitet werden', raw: content }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, leads, count: leads.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleSaveList(supabase: any, body: any, accountId: string, userId: string, corsHeaders: Record<string, string>) {
  const { name, description, leads, filters } = body;

  if (!name || !leads?.length) {
    return new Response(JSON.stringify({ error: 'Name und Leads sind erforderlich' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Create the list
  const { data: list, error: listErr } = await supabase
    .from('lead_lists')
    .insert({
      account_id: accountId,
      created_by: userId,
      name,
      description: description || null,
      search_filters: filters || {},
      total_leads: leads.length,
    })
    .select()
    .single();

  if (listErr) {
    console.error('Error creating list:', listErr);
    return new Response(JSON.stringify({ error: 'Fehler beim Erstellen der Liste' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Insert lead items
  const items = leads.map((lead: any) => ({
    list_id: list.id,
    account_id: accountId,
    first_name: lead.first_name,
    last_name: lead.last_name,
    position: lead.position || null,
    company: lead.company || null,
    industry: lead.industry || null,
    employee_count: lead.employee_count || null,
    city: lead.city || null,
    country: lead.country || null,
    website: lead.website || null,
    linkedin_url: lead.linkedin_url || null,
  }));

  const { error: itemsErr } = await supabase
    .from('lead_list_items')
    .insert(items);

  if (itemsErr) {
    console.error('Error inserting items:', itemsErr);
  }

  return new Response(JSON.stringify({ success: true, list_id: list.id, count: leads.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleImportToContacts(supabase: any, body: any, accountId: string, userId: string, corsHeaders: Record<string, string>) {
  const { item_ids } = body;

  if (!item_ids?.length) {
    return new Response(JSON.stringify({ error: 'Keine Items ausgewählt' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch items
  const { data: items, error: fetchErr } = await supabase
    .from('lead_list_items')
    .select('*')
    .in('id', item_ids)
    .eq('account_id', accountId)
    .eq('imported', false);

  if (fetchErr || !items?.length) {
    return new Response(JSON.stringify({ error: 'Keine importierbaren Items gefunden' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let imported = 0;
  for (const item of items) {
    const { data: contact, error: contactErr } = await supabase
      .from('contacts')
      .insert({
        account_id: accountId,
        owner_user_id: userId,
        first_name: item.first_name,
        last_name: item.last_name,
        position: item.position,
        company: item.company,
        city: item.city,
        country: item.country,
        website: item.website,
        linkedin_url: item.linkedin_url,
        email: item.email,
        phone: item.phone,
        source: 'KI-Recherche',
        lead_type: 'inbound',
        tags: [item.industry].filter(Boolean),
      })
      .select('id')
      .single();

    if (!contactErr && contact) {
      await supabase
        .from('lead_list_items')
        .update({ imported: true, contact_id: contact.id })
        .eq('id', item.id);
      imported++;
    }
  }

  return new Response(JSON.stringify({ success: true, imported }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleEnrichList(supabase: any, body: any, accountId: string, userId: string, corsHeaders: Record<string, string>) {
  const { list_id } = body;

  if (!list_id) {
    return new Response(JSON.stringify({ error: 'list_id ist erforderlich' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get webhook URL
  const { data: integration } = await supabase
    .from('account_integrations')
    .select('enrichment_webhook_url')
    .eq('account_id', accountId)
    .single();

  if (!integration?.enrichment_webhook_url) {
    return new Response(JSON.stringify({ error: 'Kein Enrichment-Webhook konfiguriert. Bitte unter Integrationen einrichten.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check credits
  const { data: credits, error: creditsErr } = await supabase
    .rpc('get_enrichment_credits', { p_account_id: accountId });

  if (creditsErr || !credits) {
    return new Response(JSON.stringify({ error: 'Fehler beim Laden der Credits' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const phoneAvailable = (credits.phone_credits_limit || 100) - (credits.phone_credits_used || 0);
  const emailAvailable = (credits.email_credits_limit || 100) - (credits.email_credits_used || 0);

  // Fetch non-enriched items from the list
  const { data: items, error: fetchErr } = await supabase
    .from('lead_list_items')
    .select('*')
    .eq('list_id', list_id)
    .eq('account_id', accountId)
    .eq('enriched', false);

  if (fetchErr || !items?.length) {
    return new Response(JSON.stringify({ error: 'Keine Leads zum Anreichern gefunden' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Limit to available credits
  const maxItems = Math.min(items.length, Math.max(phoneAvailable, emailAvailable));
  if (maxItems <= 0) {
    return new Response(JSON.stringify({ 
      error: 'Kein Credit-Kontingent mehr verfügbar. Bitte Credits aufstocken.',
      credits: { phone_available: phoneAvailable, email_available: emailAvailable }
    }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const itemsToEnrich = items.slice(0, maxItems);
  let enriched = 0;
  let imported = 0;
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const callbackUrl = `${supabaseUrl}/functions/v1/enrich-lead`;

  for (const item of itemsToEnrich) {
    try {
      // Step 1: Import to contacts if not already imported
      let contactId = item.contact_id;
      if (!contactId) {
        const { data: contact, error: contactErr } = await supabase
          .from('contacts')
          .insert({
            account_id: accountId,
            owner_user_id: userId,
            first_name: item.first_name,
            last_name: item.last_name,
            position: item.position,
            company: item.company,
            city: item.city,
            country: item.country,
            website: item.website,
            linkedin_url: item.linkedin_url,
            email: item.email,
            phone: item.phone,
            source: 'KI-Recherche',
            lead_type: 'inbound',
            tags: [item.industry].filter(Boolean),
          })
          .select('id')
          .single();

        if (contactErr || !contact) {
          console.error(`Failed to import item ${item.id}:`, contactErr);
          continue;
        }

        contactId = contact.id;
        await supabase
          .from('lead_list_items')
          .update({ imported: true, contact_id: contactId })
          .eq('id', item.id);
        imported++;
      }

      // Step 2: Trigger enrichment via webhook
      const webhookPayload = {
        contact_id: contactId,
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email,
        phone: item.phone,
        position: item.position,
        company: item.company,
        linkedin_url: item.linkedin_url,
        website: item.website,
        city: item.city,
        country: item.country,
        callback_url: callbackUrl,
        account_id: accountId,
      };

      const webhookResponse = await fetch(integration.enrichment_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });

      if (webhookResponse.ok) {
        // Check for synchronous response
        const contentType = webhookResponse.headers.get('content-type') || '';
        let syncEnriched = false;

        if (contentType.includes('application/json')) {
          const responseData = await webhookResponse.json();
          if (responseData.data && typeof responseData.data === 'object') {
            // Update contact with enriched data
            const updateFields: Record<string, unknown> = {};
            const contactFields = ['first_name', 'last_name', 'email', 'phone', 'mobile', 'position', 'company', 'linkedin_url', 'website', 'street', 'city', 'country'];
            for (const field of contactFields) {
              if (responseData.data[field] !== undefined && responseData.data[field] !== null) {
                updateFields[field] = responseData.data[field];
              }
            }
            if (Object.keys(updateFields).length > 0) {
              updateFields.updated_at = new Date().toISOString();
              await supabase.from('contacts').update(updateFields).eq('id', contactId);

              // Also update the lead_list_item with enriched data
              const itemUpdate: Record<string, unknown> = { enriched: true };
              if (updateFields.email) itemUpdate.email = updateFields.email;
              if (updateFields.phone) itemUpdate.phone = updateFields.phone;
              await supabase.from('lead_list_items').update(itemUpdate).eq('id', item.id);

              syncEnriched = true;
            }
          }
        }

        if (!syncEnriched) {
          // Mark as enriched for async mode (data will come via callback)
          await supabase.from('lead_list_items').update({ enriched: true }).eq('id', item.id);
        }

        enriched++;
      } else {
        console.error(`Webhook error for item ${item.id}: ${webhookResponse.status}`);
      }
    } catch (err) {
      console.error(`Enrich error for item ${item.id}:`, err);
    }
  }

  // Update credits
  const creditUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    phone_credits_used: (credits.phone_credits_used || 0) + enriched,
    email_credits_used: (credits.email_credits_used || 0) + enriched,
  };
  await supabase.from('enrichment_credits').update(creditUpdate).eq('id', credits.id);

  return new Response(JSON.stringify({ 
    success: true, 
    enriched, 
    imported,
    total: itemsToEnrich.length,
    remaining_credits: {
      phone: Math.max(0, phoneAvailable - enriched),
      email: Math.max(0, emailAvailable - enriched),
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleListStats(supabase: any, body: any, accountId: string, corsHeaders: Record<string, string>) {
  const { list_ids } = body;

  if (!list_ids?.length) {
    return new Response(JSON.stringify({ error: 'list_ids erforderlich' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get enrichment stats per list
  const stats: Record<string, { total: number; enriched: number; imported: number }> = {};

  for (const listId of list_ids) {
    const { data: items } = await supabase
      .from('lead_list_items')
      .select('enriched, imported')
      .eq('list_id', listId)
      .eq('account_id', accountId);

    if (items) {
      stats[listId] = {
        total: items.length,
        enriched: items.filter((i: any) => i.enriched).length,
        imported: items.filter((i: any) => i.imported).length,
      };
    }
  }

  return new Response(JSON.stringify({ success: true, stats }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
