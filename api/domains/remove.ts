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

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.account_id !== account_id || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '').replace(/^www\./, '').trim();

    // Remove from Vercel
    const vercelRes = await fetch(
      `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(cleanDomain)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
      }
    );

    if (!vercelRes.ok && vercelRes.status !== 404) {
      const errData = await vercelRes.json();
      console.error('Vercel domain removal error:', errData);
    }

    // Remove from Supabase (RLS enforces admin check)
    await supabase
      .from('custom_domains')
      .delete()
      .eq('account_id', account_id)
      .eq('domain', cleanDomain);

    // Clear legacy field on accounts
    await supabase
      .from('accounts')
      .update({ custom_domain: null })
      .eq('id', account_id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Domain remove error:', error);
    return res.status(500).json({ error: 'Fehler beim Entfernen: ' + (error as Error).message });
  }
}
