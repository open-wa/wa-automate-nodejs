import { createFileRoute } from '@tanstack/react-router';

const cookieName = '__Host-openwa-license-account';
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

export const Route = createFileRoute('/api/license-session')({
  server: { handlers: { GET: async ({ request }) => {
    const url = new URL(request.url);
    const incoming = url.searchParams.get('proof');
    const cookie = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    const proof = incoming ?? cookie;
    let signedIn = false;
    let expires = 0;
    let unavailable = false;
    if (proof && proof.length <= 1024) {
      try {
        const response = await fetch('https://api.openwa.cloud/api/docs-session', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proof }), signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error('Account status unavailable');
        const status = await response.json() as { signedIn?: boolean; expires?: number };
        signedIn = status.signedIn === true;
        expires = typeof status.expires === 'number' ? status.expires : 0;
      } catch { unavailable = true; }
    }
    if (unavailable && !incoming) return Response.json({ signedIn: false }, { status: 503, headers });
    const responseHeaders = new Headers(headers);
    if (!unavailable && (incoming || cookie && !signedIn)) {
      const maxAge = signedIn ? Math.max(0, Math.min(604800, Math.floor((expires - Date.now()) / 1000))) : 0;
      responseHeaders.set('Set-Cookie', `${cookieName}=${signedIn ? proof : ''}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`);
    }
    if (incoming) {
      // Return only to our account app; no arbitrary external redirects.
      const returnTo = url.searchParams.get('returnTo');
      if (returnTo && returnTo.length <= 8192) {
        try {
          const target = new URL(returnTo);
          if (target.origin === 'https://app.openwa.cloud' && !target.username && !target.password) {
            responseHeaders.set('Location', target.href);
            return new Response(null, { status: 303, headers: responseHeaders });
          }
        } catch { /* Use the docs home for an invalid destination. */ }
      }
      responseHeaders.set('Location', '/docs');
      return new Response(null, { status: 303, headers: responseHeaders });
    }
    return Response.json({ signedIn }, { headers: responseHeaders });
  } } },
});
