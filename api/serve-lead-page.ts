import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;

/**
 * Proxies custom domain requests to the existing Supabase serve-lead-page edge function.
 * Vercel rewrites route custom domain traffic here via vercel.json.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const host = (req.headers['host'] || '').toLowerCase().replace(/^www\./, '');
  const path = req.url || '/';

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/serve-lead-page`, {
      method: 'GET',
      headers: {
        'X-Forwarded-Host': host,
        'X-Original-Path': path,
        'X-Forwarded-For': (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '',
        'User-Agent': (req.headers['user-agent'] as string) || '',
      },
    });

    const html = await response.text();
    const contentType = response.headers.get('content-type') || 'text/html; charset=utf-8';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(response.status).send(html);
  } catch (error) {
    console.error('Lead page proxy error:', error);
    return res.status(500).send(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fehler</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:#94a3b8"><div style="text-align:center"><h1 style="color:#fff">Vorübergehend nicht erreichbar</h1><p>Bitte versuche es in wenigen Minuten erneut.</p></div></body></html>'
    );
  }
}
