import { next, rewrite } from '@vercel/edge';

export const config = {
  // Exclude API routes and Vercel internals
  matcher: '/((?!api/|_vercel/|_next/).*)',
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const hostname = (request.headers.get('host') || '').toLowerCase();

  // Main app hosts (pitchfirst.io main app + Vercel preview URLs)
  const isMainHost =
    hostname === 'pitchfirst.io' ||
    hostname === 'www.pitchfirst.io' ||
    hostname.endsWith('.vercel.app') ||
    hostname === 'localhost' ||
    hostname.startsWith('127.0.0.1') ||
    hostname.startsWith('localhost:');

  if (isMainHost) {
    return next();
  }

  // Custom domain → rewrite everything to lead page proxy
  const rewriteUrl = new URL('/api/serve-lead-page', url);
  return rewrite(rewriteUrl);
}
