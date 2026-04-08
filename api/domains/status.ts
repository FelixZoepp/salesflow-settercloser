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
    // Auth
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

    // Verify user is admin
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.account_id !== account_id || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '').replace(/^www\./, '').trim();

    // Check domain status on Vercel
    const vercelRes = await fetch(
      `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(cleanDomain)}`,
      {
        headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
      }
    );

    if (!vercelRes.ok) {
      const errData = await vercelRes.json();
      return res.status(200).json({
        verified: false,
        status: 'error',
        message: errData.error?.message || 'Domain nicht bei Vercel gefunden. Bitte zuerst hinzufügen.',
      });
    }

    const vercelDomain = await vercelRes.json();

    // Map Vercel status to our status
    const now = new Date().toISOString();
    let status: string;
    let verified = false;
    let sslActive = false;
    let errorMessage: string | null = null;

    if (!vercelDomain.verified) {
      status = 'pending_dns';
      errorMessage = 'Domain-Inhaberschaft noch nicht verifiziert. Bitte setze den TXT-Record wie in der Anleitung beschrieben.';
    } else if (vercelDomain.misconfigured) {
      status = 'dns_verified';
      verified = true;
      errorMessage = 'DNS-Records zeigen noch nicht auf Vercel. Bitte A-Record auf 76.76.21.21 setzen (oder CNAME auf cname.vercel-dns.com für Subdomains).';
    } else {
      status = 'ssl_active';
      verified = true;
      sslActive = true;
    }

    // Update Supabase
    const updateData: Record<string, any> = {
      status,
      verified,
      ssl_active: sslActive,
      last_checked_at: now,
      last_error: errorMessage,
    };
    if (verified) updateData.verified_at = now;
    if (sslActive) updateData.ssl_activated_at = now;

    await supabase
      .from('custom_domains')
      .update(updateData)
      .eq('account_id', account_id)
      .eq('domain', cleanDomain);

    return res.status(200).json({
      verified,
      ssl_active: sslActive,
      status,
      message: sslActive
        ? 'Domain erfolgreich verifiziert! SSL-Zertifikat wird automatisch von Vercel verwaltet.'
        : errorMessage,
      verification: vercelDomain.verification || [],
      misconfigured: vercelDomain.misconfigured || false,
    });
  } catch (error) {
    console.error('Domain status error:', error);
    return res.status(500).json({ error: 'Fehler bei der Domain-Überprüfung' });
  }
}
