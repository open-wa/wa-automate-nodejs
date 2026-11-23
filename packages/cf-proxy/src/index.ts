import { SessionTunnel } from './tunnel-do';

export interface Env {
  SESSION_TUNNEL: DurableObjectNamespace;
  /** Self-hosted mode: authenticates a session's connection to /sessions/:id/upstream. */
  UPSTREAM_TOKEN?: string;
  /** Authenticates RPC consumers on /connect. HTTP requests are not checked here; the session authenticates them. */
  CONSUMER_TOKEN?: string;
  /** Sessions are addressed as `<session>.<ROUTER_DOMAIN>` at the root path. */
  ROUTER_DOMAIN?: string;
  /** Licensed mode: keys the hash that turns a license key into a session address. */
  ROUTER_SECRET?: string;
  /** Licensed mode: the open-wa license check. */
  LICENSE_CHECK_URL?: string;
}

const encoder = new TextEncoder();
const LICENSE_CACHE_SECONDS = 6 * 60 * 60;
const REFUSED_CACHE_SECONDS = 10 * 60;
const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';

/** Compares secrets in constant time. */
function sameSecret(provided: string | null | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = encoder.encode(provided);
  const b = encoder.encode(expected);
  return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b);
}

async function sha256(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacBase32(secret: string, message: string, length: number): Promise<string> {
  const hmac = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', hmac, encoder.encode(message)));
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = ((value << 8) | byte) & 0xffff;
    bits += 8;
    while (bits >= 5 && out.length < length) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return out;
}

const SLUG_ID = 12;
const SLUG_TAG = 6;

/**
 * A stable, public address for a license that reveals nothing about the key. The first 12 characters come
 * from HMAC(secret, key); the last 6 are a tag over those, so the Worker can refuse made-up addresses
 * without waking a Durable Object.
 */
async function licenseSlug(secret: string, key: string): Promise<string> {
  const id = await hmacBase32(secret, `address:${key}`, SLUG_ID);
  return id + await hmacBase32(secret, `tag:${id}`, SLUG_TAG);
}

async function slugIsGenuine(secret: string, slug: string): Promise<boolean> {
  if (!new RegExp(`^[a-z2-7]{${SLUG_ID + SLUG_TAG}}$`).test(slug)) return false;
  const id = slug.slice(0, SLUG_ID);
  return sameSecret(slug.slice(SLUG_ID), await hmacBase32(secret, `tag:${id}`, SLUG_TAG));
}

/**
 * Asks the license service whether this key is valid for this WhatsApp number. Answers are cached in this
 * location, valid ones for 6 hours and refused ones for 10 minutes, so retries and junk keys don't reach it.
 */
async function licenseValid(env: Env, key: string, number: string, ctx: ExecutionContext): Promise<boolean> {
  const cacheKey = new Request(`https://license-cache.invalid/${await sha256(`${key}\0${number}`)}`);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return (await cached.text()) === 'ok';
  const remember = (answer: 'ok' | 'refused', seconds: number) =>
    ctx.waitUntil(cache.put(cacheKey, new Response(answer, { headers: { 'cache-control': `max-age=${seconds}` } })));
  const res = await fetch(env.LICENSE_CHECK_URL ?? 'https://funcs.openwa.dev/license-check', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'open-wa-router/1' },
    body: JSON.stringify({ key, number, WA_AUTOMATE_VERSION: 'router' }),
  });
  // A failing license service is not cached, so the session retries once it recovers.
  if (!res.ok) return false;
  const body = (await res.text()).trim();
  // The check answers `false` for a key on another number, and a script that sets launchError for an unknown key.
  if (!body || body === 'false' || body === 'null' || body.includes('launchError')) {
    remember('refused', REFUSED_CACHE_SECONDS);
    return false;
  }
  remember('ok', LICENSE_CACHE_SECONDS);
  return true;
}

/** `role` is set only after the Worker authenticated the connection; the Durable Object trusts nothing else. */
function forward(env: Env, request: Request, sessionId: string, subpath: string, role?: 'upstream' | 'consumer', extra: Record<string, string> = {}) {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  for (const key of [...headers.keys()]) if (key.startsWith('x-owa-')) headers.delete(key);
  headers.set('x-owa-subpath', subpath);
  headers.set('x-owa-public-host', url.host);
  if (role) headers.set('x-owa-role', role);
  for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  const stub = env.SESSION_TUNNEL.get(env.SESSION_TUNNEL.idFromName(sessionId));
  return stub.fetch(new Request(request, { headers }));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const domain = env.ROUTER_DOMAIN?.toLowerCase();
    const host = url.hostname.toLowerCase();
    const bearer = request.headers.get('Authorization');

    // A session's public address: everything goes to that session's own server.
    if (domain && host.endsWith(`.${domain}`)) {
      const sessionId = host.slice(0, -domain.length - 1);
      // Licensed addresses carry a tag only the router can make; anything else ends here, before a Durable Object.
      const genuine = env.ROUTER_SECRET ? await slugIsGenuine(env.ROUTER_SECRET, sessionId) : /^[a-z0-9-]{1,63}$/.test(sessionId);
      if (!genuine) return new Response('Not Found', { status: 404 });
      return forward(env, request, sessionId, `${url.pathname}${url.search}`);
    }

    // Licensed mode: the session connects with its license key and gets an address derived from it.
    if (url.pathname === '/upstream') {
      const key = /^License\s+(.+)$/i.exec(bearer ?? '')?.[1]?.trim();
      const number = request.headers.get('x-owa-number')?.replace(/\D/g, '');
      if (!key || !number || !env.ROUTER_SECRET || !domain) return new Response('Send the license key and WhatsApp number', { status: 401 });
      if (!(await licenseValid(env, key, number, ctx))) return new Response('This license is not valid for this WhatsApp number', { status: 403 });
      const slug = await licenseSlug(env.ROUTER_SECRET, key);
      return forward(env, request, slug, '/upstream', 'upstream', { 'x-owa-address': `https://${slug}.${domain}` });
    }

    // Self-hosted mode: /sessions/:id/... with a shared upstream token.
    const match = /^\/sessions\/([^/]+)(\/.*)?$/.exec(url.pathname);
    if (!match) return new Response('Not Found', { status: 404 });
    const sessionId = decodeURIComponent(match[1]);
    const path = match[2] ?? '/';
    const token = bearer?.replace(/^Bearer\s+/i, '');
    if (path === '/upstream') {
      if (!sameSecret(token, env.UPSTREAM_TOKEN)) return new Response('Unauthorized upstream', { status: 401 });
    } else if (path === '/connect') {
      // Browsers cannot set headers on a WebSocket, so /connect also accepts ?token=.
      if (!sameSecret(token ?? url.searchParams.get('token'), env.CONSUMER_TOKEN)) return new Response('Unauthorized consumer', { status: 401 });
    }
    if (path === '/upstream') return forward(env, request, sessionId, path, 'upstream');
    if (path === '/connect') return forward(env, request, sessionId, path, 'consumer');
    return forward(env, request, sessionId, `${path}${url.search}`);
  },
};

export { SessionTunnel };
