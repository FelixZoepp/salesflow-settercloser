import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN!;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Auth: verify Supabase JWT
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Nicht autorisiert' });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Nicht autorisiert' });
    }

    const { domain, account_id } = req.body;
    if (!domain || !account_id) {
      return res.status(400).json({ error: 'Domain und Account-ID erforderlich' });
    }

    // Verify user is admin of this account
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.account_id !== account_id || profile.role !== 'admin') {
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

    // Check if domain is taken by another account
    const { data: existingDomain } = await supabase
      .from('custom_domains')
      .select('id, account_id')
      .ilike('domain', cleanDomain)
      .neq('account_id', account_id)
      .maybeSingle();

    if (existingDomain) {
      return res.status(409).json({ error: 'Diese Domain wird bereits von einem anderen Account verwendet.' });
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

    if (!vercelRes.ok) {
      // Domain might already exist on another Vercel project
      const errMsg = vercelData.error?.message || 'Fehler beim Hinzufügen der Domain bei Vercel';
      return res.status(vercelRes.status).json({ error: errMsg });
    }

    // Upsert in Supabase
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
      await supabase.from('custom_domains').update(domainData).eq('id', existing.id);
    } else {
      await supabase.from('custom_domains').insert(domainData);
    }

    return res.status(200).json({
      domain: cleanDomain,
      vercel: vercelData,
      verification: vercelData.verification || [],
    });
  } catch (error) {
    console.error('Domain add error:', error);
    return res.status(500).json({ error: 'Interner Fehler beim Hinzufügen der Domain' });
  }
}
