import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN!;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Nicht autorisiert' });
    }

    // Supabase client using the user's JWT → RLS enforces all access
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Nicht autorisiert' });
    }

    const { domain, account_id } = req.body;
    if (!domain || !account_id) {
      return res.status(400).json({ error: 'Domain und Account-ID erforderlich' });
    }

    // Verify user is admin of this account (readable via RLS)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.account_id !== account_id || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Keine Berechtigung. Nur Admins können Domains verwalten.' });
    }

    // Clean domain
    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .replace(/^www\./, '')
      .trim();

    if (!cleanDomain || !cleanDomain.includes('.')) {
      return res.status(400).json({ error: 'Ungültige Domain' });
    }

    // Add domain to Vercel project
    const vercelRes = await fetch(
      `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: cleanDomain }),
      }
    );

    const vercelData = await vercelRes.json();

    // Even if Vercel returns an error (e.g. domain already exists), 
    // we still write the DB row below. Only log the Vercel error.
    const vercelError = !vercelRes.ok
      ? vercelData.error?.message || 'Vercel-Fehler'
      : null;
    if (vercelError) {
      console.warn('Vercel domain add warning (continuing with DB write):', vercelError);
    }

    // Upsert in Supabase (RLS enforces admin check via policies)
    const { data: existing } = await supabase
      .from('custom_domains')
      .select('id')
      .eq('account_id', account_id)
      .maybeSingle();

    const domainData: Record<string, any> = {
      account_id,
      domain: cleanDomain,
      status: 'pending_dns',
      verified: false,
      ssl_active: false,
      last_error: null,
      last_checked_at: new Date().toISOString(),
    };

    if (existing) {
      const { error: updateErr } = await supabase
        .from('custom_domains')
        .update(domainData)
        .eq('id', existing.id);
      if (updateErr) {
        return res.status(500).json({ error: 'DB-Fehler: ' + updateErr.message });
      }
    } else {
      const { error: insertErr } = await supabase
        .from('custom_domains')
        .insert(domainData);
      if (insertErr) {
        return res.status(500).json({ error: 'DB-Fehler: ' + insertErr.message });
      }
    }

    return res.status(200).json({
      domain: cleanDomain,
      vercel: vercelData,
      verification: vercelData.verification || [],
      vercel_warning: vercelError || undefined,
    });
  } catch (error) {
    console.error('Domain add error:', error);
    return res.status(500).json({ error: 'Interner Fehler: ' + (error as Error).message });
  }
}
