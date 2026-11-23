import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Context, Hono } from 'hono';

/**
 * A single-owner OAuth 2.1 authorization server for the Easy API MCP endpoint.
 *
 * ChatGPT can't present custom API keys, so it signs in here: it registers a client, sends the owner to a
 * consent page, and exchanges the PKCE-protected code for tokens bound to the MCP resource. Requests then
 * carry `Authorization: Bearer`.
 *
 * The owner approves with a one-time code that the session delivers to itself (log, webhook, or its own
 * WhatsApp chat), or with the Easy API key. The consent page may be served through a proxy that can read it,
 * so the code is single-use, bound to one authorization request and short-lived: seeing it there is useless.
 */
export interface ApprovalCodeRequest {
  /** Short label shown on the consent page, so the owner can match the code to the request. */
  requestId: string;
  code: string;
  clientName: string;
  /** Host the client redirects to after approval, such as chatgpt.com. */
  redirectHost: string;
  expiresAt: number;
}

export interface McpOAuthOptions {
  storePath: string;
  /** The MCP endpoint path, such as `/mcp`. */
  mcpPath: string;
  apiKey: () => string | undefined;
  /** Identity of the current owner; tokens issued to another owner stop working. */
  owner: () => string | undefined;
  /** Public origin when Easy API runs behind a tunnel or proxy; otherwise derived from the request. */
  publicUrl?: string;
  /** Delivers a one-time approval code to the owner. It must not reach MCP clients or event subscribers. */
  onApprovalCode?: (request: ApprovalCodeRequest) => void;
}

const SCOPE = 'mcp';
const CODE_TTL_MS = 10 * 60_000;
const ACCESS_TTL_MS = 60 * 60_000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60_000;
const MAX_CLIENTS = 200;
const KEY_ATTEMPTS_PER_MINUTE = 10;
const APPROVAL_TTL_MS = 10 * 60_000;
const APPROVAL_ATTEMPTS = 5;
const CODES_PER_IP_PER_10_MINUTES = 5;
const CODES_PER_HOUR = 30;
/** Unambiguous characters: no 0/O, 1/I/L or U. Eight of them give about 39 bits. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const pick = (length: number) => Array.from({ length }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
const normalizeCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** The shared open-wa palette (docs and dashboard: packages/ui-components/src/theme.css), laid out after the ui-sdk.dev sink. */
const PAGE_CSS = `:root{--paper:#f9fcff;--raised:#fff;--muted:#eef4fd;--selected:#dde8ff;--ink:#162748;--ink-2:#56647f;--ink-3:#8190ab;--rule:#dde6f3;--accent:#214be6;--accent-ink:#fff;--ring:#5c86f3;--danger:#c63e5c;
--shadow:0 1px 2px #1627480f,0 12px 32px -16px #16274833;--sans:"Geist","DM Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--mono:"Geist Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root{--paper:#0c1832;--raised:#122343;--muted:#162b50;--selected:#1d3564;--ink:#eaf1ff;--ink-2:#9eb0d2;--ink-3:#7389b0;--rule:#284570;--accent:#8cb0ff;--accent-ink:#0c1832;--ring:#8cb0ff;--danger:#ff7690;--shadow:0 12px 32px -14px #000a}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:32px 16px;background:var(--paper);color:var(--ink);font:15px/1.5 var(--sans);-webkit-font-smoothing:antialiased}
.card{width:100%;max-width:420px;background:var(--raised);border:1px solid var(--rule);border-radius:16px;box-shadow:var(--shadow);padding:28px}
.brand{display:flex;align-items:center;gap:8px;color:var(--ink-3);font-size:13px;font-weight:500;margin-bottom:18px}
.brand i{width:22px;height:22px;border-radius:7px;background:var(--accent);display:inline-grid;place-items:center;color:var(--accent-ink);font:600 12px var(--mono);font-style:normal}
h1{font-size:22px;line-height:1.25;letter-spacing:-.01em;margin:0 0 6px}
.lede{color:var(--ink-2);margin:0 0 14px}
.perms{list-style:none;padding:12px 14px;margin:0 0 18px;border:1px solid var(--rule);border-radius:12px;background:var(--muted);display:grid;gap:6px;font-size:14px}
.perms li{display:flex;gap:8px;align-items:baseline}.perms li::before{content:"";flex:none;width:6px;height:6px;border-radius:50%;background:var(--accent);transform:translateY(-2px)}
.step{display:grid;gap:10px}
.step-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
.label{font-size:13px;font-weight:600}
.badge{font:500 12px var(--mono);padding:2px 8px;border-radius:999px;border:1px solid var(--rule);color:var(--ink-2)}
.hint{margin:0;color:var(--ink-2);font-size:13.5px}
.input{width:100%;height:40px;border:1px solid var(--rule);background:var(--raised);color:var(--ink);border-radius:10px;padding:0 12px;font:14px var(--sans);outline:none;transition:border-color .12s,box-shadow .12s}
.input::placeholder{color:var(--ink-3)}
.input:focus-visible{border-color:var(--ring);box-shadow:0 0 0 3px color-mix(in oklab,var(--ring) 25%,transparent)}
.input.code{height:52px;text-align:center;font:600 22px var(--mono);letter-spacing:.18em;text-transform:uppercase}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:36px;padding:0 14px;border:1px solid var(--rule);background:var(--raised);color:var(--ink);border-radius:10px;font:500 14px var(--sans);cursor:pointer;white-space:nowrap;transition:background .12s,border-color .12s,transform .12s cubic-bezier(.22,1,.36,1)}
.btn:hover{border-color:var(--ink-3)}.btn:active{transform:scale(.97)}
.btn:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.btn.primary:hover{background:color-mix(in oklch,var(--accent) 88%,var(--ink))}
.btn.ghost{background:transparent;border-color:transparent;color:var(--ink-2)}
.btn.ghost:hover{background:color-mix(in oklab,var(--ink) 7%,transparent);color:var(--ink)}
.btn.danger{color:var(--danger)}
.btn.wide{width:100%;height:40px}
.alert{margin:0 0 14px;padding:10px 12px;border-radius:10px;font-size:13.5px;font-weight:500;color:var(--danger);background:color-mix(in oklab,var(--danger) 10%,transparent);border:1px solid color-mix(in oklab,var(--danger) 30%,transparent)}
.alt{margin-top:16px;border-top:1px solid var(--rule);padding-top:12px}
.alt summary{cursor:pointer;color:var(--ink-2);font-size:13.5px;list-style:none;display:flex;align-items:center;gap:6px}
.alt summary::-webkit-details-marker{display:none}
.alt summary::before{content:"›";display:inline-block;transition:transform .12s;font-size:16px;line-height:1}
.alt[open] summary::before{transform:rotate(90deg)}
.alt[open]{display:grid;gap:10px}
.warn{margin:0;font-size:12.5px;color:var(--ink-2);padding:8px 10px;border-radius:10px;background:var(--selected)}
.row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:16px}
.return{font-size:12.5px;color:var(--ink-3)}
code{font:12.5px var(--mono);color:var(--ink-2)}
.foot{margin:0;font-size:12px;color:var(--ink-3);text-align:center}`;
const BRAND = '<div class="brand"><i>wa</i>open-wa</div>';
const random = (bytes = 32) => randomBytes(bytes).toString('base64url');
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const s256 = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');
const escape = (value: string) => value.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(digest(a));
  const right = Buffer.from(digest(b));
  return timingSafeEqual(left, right);
}
function allowedRedirect(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    if (url.hash) return false;
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch { return false; }
}

interface ClientRow { client_id: string; secret_hash: string | null; redirect_uris: string; client_name: string | null; auth_method: string }
interface CodeRow { client_id: string; redirect_uri: string; challenge: string; scope: string; resource: string; owner: string; expires_at: number }
interface TokenRow { kind: string; client_id: string; scope: string; resource: string; owner: string; expires_at: number }
interface PendingApproval { codeHash: string; binding: string; attempts: number; expiresAt: number }
type AuthorizationRequest = { client: ClientRow & { redirects: string[] }; redirectUri: string; challenge: string; state?: string; scope: string; resource: string };

export class McpOAuth {
  private readonly db: DatabaseSync;
  private readonly attempts = new Map<string, number[]>();
  private readonly approvals = new Map<string, PendingApproval>();
  private readonly codeRequests = new Map<string, number[]>();
  private codesIssued: number[] = [];

  constructor(private readonly options: McpOAuthOptions) {
    mkdirSync(dirname(options.storePath), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(options.storePath);
    chmodSync(options.storePath, 0o600);
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS oauth_clients (
        client_id TEXT PRIMARY KEY, secret_hash TEXT, redirect_uris TEXT NOT NULL, client_name TEXT,
        auth_method TEXT NOT NULL, created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS oauth_codes (
        code_hash TEXT PRIMARY KEY, client_id TEXT NOT NULL, redirect_uri TEXT NOT NULL, challenge TEXT NOT NULL,
        scope TEXT NOT NULL, resource TEXT NOT NULL, owner TEXT NOT NULL, expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        token_hash TEXT PRIMARY KEY, kind TEXT NOT NULL, client_id TEXT NOT NULL, scope TEXT NOT NULL,
        resource TEXT NOT NULL, owner TEXT NOT NULL, expires_at INTEGER NOT NULL
      );
    `);
  }

  /** The public origin clients see, for metadata and token audience. */
  base(c: Context): string {
    if (this.options.publicUrl) return this.options.publicUrl.replace(/\/+$/, '');
    const url = new URL(c.req.url);
    const proto = c.req.header('x-forwarded-proto')?.split(',')[0]?.trim() || url.protocol.replace(':', '');
    const host = c.req.header('x-forwarded-host')?.split(',')[0]?.trim() || c.req.header('host') || url.host;
    return `${proto}://${host}`;
  }
  resource(c: Context): string { return `${this.base(c)}${this.options.mcpPath}`; }
  /** The `WWW-Authenticate` challenge that sends a client to the protected-resource metadata. */
  challenge(c: Context): string {
    return `Bearer resource_metadata="${this.base(c)}/.well-known/oauth-protected-resource${this.options.mcpPath}", scope="${SCOPE}"`;
  }

  /** True when the request carries a live access token for this owner and resource. */
  verify(c: Context): boolean {
    const header = c.req.header('authorization') ?? '';
    const match = /^Bearer\s+(\S+)$/i.exec(header);
    if (!match) return false;
    const row = this.db.prepare("SELECT * FROM oauth_tokens WHERE token_hash=? AND kind='access'").get(digest(match[1])) as TokenRow | undefined;
    return Boolean(row && row.expires_at > Date.now() && row.owner === this.options.owner() && row.resource === this.resource(c));
  }

  routes(app: Hono): void {
    const protectedResource = (c: Context) => c.json({
      resource: this.resource(c), authorization_servers: [this.base(c)], bearer_methods_supported: ['header'],
      scopes_supported: [SCOPE], resource_name: 'open-wa',
    });
    const serverMetadata = (c: Context) => {
      const base = this.base(c);
      return c.json({
        issuer: base, authorization_endpoint: `${base}/oauth/authorize`, token_endpoint: `${base}/oauth/token`,
        registration_endpoint: `${base}/oauth/register`, revocation_endpoint: `${base}/oauth/revoke`,
        response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'], scopes_supported: [SCOPE],
        token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
      });
    };
    app.get('/.well-known/oauth-protected-resource', protectedResource);
    app.get(`/.well-known/oauth-protected-resource${this.options.mcpPath}`, protectedResource);
    app.get('/.well-known/oauth-authorization-server', serverMetadata);
    app.get('/.well-known/openid-configuration', serverMetadata);
    app.post('/oauth/register', c => this.register(c));
    app.get('/oauth/authorize', c => this.authorizePage(c));
    app.post('/oauth/authorize', c => this.authorizeDecision(c));
    app.post('/oauth/token', c => this.token(c));
    app.post('/oauth/revoke', c => this.revoke(c));
  }

  // Client registration (RFC 7591)

  private async register(c: Context) {
    let body: Record<string, unknown>;
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_client_metadata', error_description: 'Send client metadata as JSON' }, 400); }
    const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
    if (!redirectUris.length || !redirectUris.every(allowedRedirect)) {
      return c.json({ error: 'invalid_redirect_uri', error_description: 'Redirect URIs must be HTTPS, or HTTP on a loopback address' }, 400);
    }
    const method = typeof body.token_endpoint_auth_method === 'string' ? body.token_endpoint_auth_method : 'none';
    if (!['none', 'client_secret_post', 'client_secret_basic'].includes(method)) {
      return c.json({ error: 'invalid_client_metadata', error_description: 'Unsupported token_endpoint_auth_method' }, 400);
    }
    const count = Number((this.db.prepare('SELECT COUNT(*) AS n FROM oauth_clients').get() as { n: number }).n);
    if (count >= MAX_CLIENTS) {
      // Drop the oldest client with no live tokens, so abandoned registrations can't fill the table.
      this.db.prepare(`DELETE FROM oauth_clients WHERE client_id = (SELECT client_id FROM oauth_clients
        WHERE client_id NOT IN (SELECT client_id FROM oauth_tokens WHERE expires_at > ?) ORDER BY created_at LIMIT 1)`).run(Date.now());
    }
    const clientId = `owa_client_${random(16)}`;
    const secret = method === 'none' ? undefined : `owa_cs_${random()}`;
    const clientName = typeof body.client_name === 'string' ? body.client_name.slice(0, 120) : null;
    this.db.prepare('INSERT INTO oauth_clients VALUES (?,?,?,?,?,?)')
      .run(clientId, secret ? digest(secret) : null, JSON.stringify(redirectUris), clientName, method, Date.now());
    return c.json({
      client_id: clientId, client_id_issued_at: Math.floor(Date.now() / 1000), redirect_uris: redirectUris,
      token_endpoint_auth_method: method, grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'],
      ...(clientName ? { client_name: clientName } : {}), ...(secret ? { client_secret: secret, client_secret_expires_at: 0 } : {}),
    }, 201);
  }

  private client(clientId: unknown): (ClientRow & { redirects: string[] }) | undefined {
    if (typeof clientId !== 'string') return;
    const row = this.db.prepare('SELECT * FROM oauth_clients WHERE client_id=?').get(clientId) as ClientRow | undefined;
    return row ? { ...row, redirects: JSON.parse(row.redirect_uris) } : undefined;
  }

  // Authorization (consent)

  private request(params: Record<string, string | undefined>, c: Context) {
    const client = this.client(params.client_id);
    if (!client) return { fatal: 'This app is not registered with this open-wa server.' };
    if (!params.redirect_uri || !client.redirects.includes(params.redirect_uri)) return { fatal: 'The redirect address does not match the app registration.' };
    const fail = (error: string, description: string) => ({ redirect: this.redirect(params.redirect_uri!, { error, error_description: description, state: params.state }, c) });
    if (params.response_type !== 'code') return fail('unsupported_response_type', 'Only the code response type is supported');
    if (!params.code_challenge || params.code_challenge_method !== 'S256') return fail('invalid_request', 'PKCE with S256 is required');
    const resource = params.resource || this.resource(c);
    if (resource !== this.resource(c)) return fail('invalid_target', 'Unknown resource');
    const scope = params.scope?.split(' ').includes(SCOPE) || !params.scope ? SCOPE : '';
    if (!scope) return fail('invalid_scope', `Request the ${SCOPE} scope`);
    return { client, redirectUri: params.redirect_uri, challenge: params.code_challenge, state: params.state, scope, resource };
  }

  private redirect(target: string, params: Record<string, string | undefined>, c: Context) {
    const url = new URL(target);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, value);
    url.searchParams.set('iss', this.base(c));
    return url.toString();
  }

  /**
   * `redirectOrigin` is the client's registered redirect origin. Browsers apply `form-action` to the redirect
   * that follows the form post too, so without it the approval would never reach the client.
   */
  private page(c: Context, title: string, body: string, status: 200 | 400 | 401 | 429 = 200, redirectOrigin?: string) {
    c.header('X-Frame-Options', 'DENY');
    c.header('Content-Security-Policy', `default-src 'none'; style-src 'unsafe-inline'; form-action 'self'${redirectOrigin ? ` ${redirectOrigin}` : ''}; frame-ancestors 'none'`);
    c.header('Cache-Control', 'no-store');
    c.header('Referrer-Policy', 'no-referrer');
    return c.html(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><title>${escape(title)}</title><style>${PAGE_CSS}</style></head>
<body><main class="card">${BRAND}${body}</main><p class="foot">open-wa · this page is served by the WhatsApp session itself</p></body></html>`, status);
  }

  private consent(c: Context, params: Record<string, string | undefined>, error?: string, status: 200 | 401 | 429 = 200, sent?: string) {
    const req = this.request(params, c);
    if ('fatal' in req) return this.page(c, 'Sign-in failed', `<h1>Sign-in failed</h1><p class="lede">${escape(req.fatal!)}</p>`, 400);
    if ('redirect' in req) return c.redirect(req.redirect!);
    const name = req.client.client_name || 'An MCP client';
    const host = new URL(req.redirectUri).host;
    const requestId = sent ?? params.request_id;
    const waiting = Boolean(requestId && this.approvals.has(requestId));
    const hidden = ['client_id', 'redirect_uri', 'response_type', 'code_challenge', 'code_challenge_method', 'state', 'scope', 'resource']
      .map(key => params[key] === undefined ? '' : `<input type="hidden" name="${key}" value="${escape(params[key]!)}">`).join('');
    const codeStep = waiting
      ? `<section class="step">
  <div class="step-head"><span class="label">One-time code</span><span class="badge">Request ${escape(requestId!)}</span></div>
  <p class="hint">Find the code for request ${escape(requestId!)} where this server sends approval codes: its log, its webhook, or its own WhatsApp chat.</p>
  <input type="hidden" name="request_id" value="${escape(requestId!)}">
  <input class="input code" id="approval_code" name="approval_code" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX" maxlength="9" aria-label="One-time code" autofocus>
  <button class="btn primary wide" type="submit" name="decision" value="approve">Approve</button>
  <button class="btn ghost wide" type="submit" name="decision" value="send_code">Send a new code</button>
</section>`
      : `<section class="step">
  <p class="hint">Approve with a one-time code. open-wa sends it to the person running this server, never to this page.</p>
  <button class="btn primary wide" type="submit" name="decision" value="send_code">Get a one-time code</button>
</section>`;
    return this.page(c, `Connect ${name} to open-wa`, `<h1>Connect ${escape(name)}</h1>
<p class="lede">${escape(name)} wants to use this WhatsApp session.</p>
<ul class="perms"><li>Read messages and chats</li><li>Send messages as this account</li><li>Receive new message events</li></ul>
${error ? `<p class="alert" role="alert">${escape(error)}</p>` : ''}
<form method="post" action="/oauth/authorize">${hidden}
${codeStep}
<details class="alt"${params.api_key !== undefined && !waiting ? ' open' : ''}><summary>Approve with the Easy API key instead</summary>
  <p class="warn">Only on a connection you trust. A proxy or tunnel in front of open-wa can read what you type here.</p>
  <input class="input" id="api_key" name="api_key" type="password" autocomplete="current-password" placeholder="Easy API key" aria-label="Easy API key">
  <button class="btn wide" type="submit" name="decision" value="approve">Approve with key</button>
</details>
<div class="row"><span class="return">Returns to <code>${escape(host)}</code></span><button class="btn ghost danger" type="submit" name="decision" value="deny">Deny</button></div>
</form>`, status, new URL(req.redirectUri).origin);
  }

  private authorizePage(c: Context) {
    return this.consent(c, c.req.query());
  }

  private clientIp(c: Context) {
    return c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  }

  /** Ties a code to the exact authorization request, so it can't approve another client or flow. */
  private binding(req: AuthorizationRequest) {
    return digest([req.client.client_id, req.redirectUri, req.challenge, req.state ?? '', req.resource].join('\0'));
  }

  private sendCode(c: Context, form: Record<string, string | undefined>, req: AuthorizationRequest) {
    const now = Date.now();
    for (const [id, pending] of this.approvals) if (pending.expiresAt <= now) this.approvals.delete(id);
    const ip = this.clientIp(c);
    const recent = (this.codeRequests.get(ip) ?? []).filter(at => at > now - 10 * 60_000);
    this.codesIssued = this.codesIssued.filter(at => at > now - 60 * 60_000);
    if (recent.length >= CODES_PER_IP_PER_10_MINUTES || this.codesIssued.length >= CODES_PER_HOUR) {
      return this.consent(c, { ...form, request_id: undefined }, 'Too many codes were requested. Wait a few minutes and try again.', 429);
    }
    this.codeRequests.set(ip, [...recent, now]);
    if (this.codeRequests.size > 1000) this.codeRequests.delete(this.codeRequests.keys().next().value!);
    this.codesIssued.push(now);
    // A new code replaces the previous one for the same request.
    if (form.request_id) this.approvals.delete(form.request_id);
    const requestId = pick(4);
    const code = pick(8);
    const expiresAt = now + APPROVAL_TTL_MS;
    this.approvals.set(requestId, { codeHash: digest(code), binding: this.binding(req), attempts: 0, expiresAt });
    try {
      this.options.onApprovalCode?.({
        requestId, code: `${code.slice(0, 4)}-${code.slice(4)}`, clientName: req.client.client_name || 'An MCP client',
        redirectHost: new URL(req.redirectUri).host, expiresAt,
      });
    } catch {
      // Delivery problems are reported by the delivery itself; the page still offers the API key.
    }
    return this.consent(c, form, undefined, 200, requestId);
  }

  private checkCode(form: Record<string, string | undefined>, req: AuthorizationRequest): string | undefined {
    const pending = form.request_id ? this.approvals.get(form.request_id) : undefined;
    if (!pending || pending.expiresAt <= Date.now() || pending.binding !== this.binding(req)) {
      if (form.request_id) this.approvals.delete(form.request_id);
      return 'That code has expired or belongs to another request. Get a new code.';
    }
    pending.attempts += 1;
    const matches = timingSafeEqual(Buffer.from(digest(normalizeCode(form.approval_code ?? ''))), Buffer.from(pending.codeHash));
    if (matches) {
      this.approvals.delete(form.request_id!);
      return;
    }
    if (pending.attempts >= APPROVAL_ATTEMPTS) {
      this.approvals.delete(form.request_id!);
      return 'That code is not right, and this request has no attempts left. Get a new code.';
    }
    return 'That code is not right.';
  }

  private async authorizeDecision(c: Context) {
    const form = Object.fromEntries(Object.entries(await c.req.parseBody()).map(([key, value]) => [key, typeof value === 'string' ? value : undefined]));
    const req = this.request(form, c);
    if ('fatal' in req || 'redirect' in req) return this.consent(c, form);
    if (form.decision === 'send_code') return this.sendCode(c, form, req);
    if (form.decision !== 'approve') return c.redirect(this.redirect(req.redirectUri, { error: 'access_denied', state: req.state }, c));

    const ip = this.clientIp(c);
    const now = Date.now();
    const recent = (this.attempts.get(ip) ?? []).filter(at => at > now - 60_000);
    if (recent.length >= KEY_ATTEMPTS_PER_MINUTE) return this.consent(c, form, 'Too many attempts. Wait a minute and try again.', 429);
    const failed = (message: string) => {
      this.attempts.set(ip, [...recent, now]);
      if (this.attempts.size > 1000) this.attempts.delete(this.attempts.keys().next().value!);
      return this.consent(c, form, message, 401);
    };

    if (form.approval_code?.trim()) {
      const problem = this.checkCode(form, req);
      if (problem) return failed(problem);
    } else {
      const apiKey = this.options.apiKey();
      if (!form.api_key) return this.consent(c, form, 'Enter the one-time code, or approve with the Easy API key.', 401);
      if (!apiKey || !sameSecret(form.api_key, apiKey)) return failed('That key is not this server’s Easy API key.');
    }
    const code = random();
    this.db.prepare('INSERT INTO oauth_codes VALUES (?,?,?,?,?,?,?,?)')
      .run(digest(code), req.client.client_id, req.redirectUri, req.challenge, req.scope, req.resource, this.options.owner()!, now + CODE_TTL_MS);
    return c.redirect(this.redirect(req.redirectUri, { code, state: req.state }, c));
  }

  // Token endpoint

  private authenticateClient(c: Context, form: Record<string, string | undefined>): ClientRow | undefined {
    let clientId = form.client_id;
    let secret = form.client_secret;
    const basic = /^Basic\s+(\S+)$/i.exec(c.req.header('authorization') ?? '');
    if (basic) {
      const [id, pass] = Buffer.from(basic[1], 'base64').toString('utf8').split(':');
      clientId = decodeURIComponent(id ?? '');
      secret = decodeURIComponent(pass ?? '');
    }
    const client = this.client(clientId);
    if (!client) return;
    if (client.auth_method === 'none') return client;
    return secret && client.secret_hash && sameSecret(digest(secret), client.secret_hash) ? client : undefined;
  }

  private issue(clientId: string, scope: string, resource: string, owner: string) {
    const access = `owa_at_${random()}`;
    const refresh = `owa_rt_${random()}`;
    const insert = this.db.prepare('INSERT INTO oauth_tokens VALUES (?,?,?,?,?,?,?)');
    insert.run(digest(access), 'access', clientId, scope, resource, owner, Date.now() + ACCESS_TTL_MS);
    insert.run(digest(refresh), 'refresh', clientId, scope, resource, owner, Date.now() + REFRESH_TTL_MS);
    this.db.prepare('DELETE FROM oauth_tokens WHERE expires_at <= ?').run(Date.now());
    return { access_token: access, token_type: 'Bearer', expires_in: ACCESS_TTL_MS / 1000, refresh_token: refresh, scope };
  }

  private async token(c: Context) {
    c.header('Cache-Control', 'no-store');
    const form = Object.fromEntries(Object.entries(await c.req.parseBody()).map(([key, value]) => [key, typeof value === 'string' ? value : undefined]));
    const client = this.authenticateClient(c, form);
    if (!client) return c.json({ error: 'invalid_client' }, 401);
    const owner = this.options.owner();
    if (!owner) return c.json({ error: 'invalid_grant', error_description: 'The server has no Easy API key' }, 400);

    if (form.grant_type === 'authorization_code') {
      const hash = digest(form.code ?? '');
      const row = this.db.prepare('SELECT * FROM oauth_codes WHERE code_hash=?').get(hash) as CodeRow | undefined;
      // Codes are single use, whatever the outcome.
      this.db.prepare('DELETE FROM oauth_codes WHERE code_hash=? OR expires_at <= ?').run(hash, Date.now());
      if (!row || row.expires_at <= Date.now() || row.client_id !== client.client_id || row.redirect_uri !== form.redirect_uri
        || !form.code_verifier || s256(form.code_verifier) !== row.challenge || row.owner !== owner
        || (form.resource && form.resource !== row.resource)) {
        return c.json({ error: 'invalid_grant' }, 400);
      }
      return c.json(this.issue(client.client_id, row.scope, row.resource, owner));
    }
    if (form.grant_type === 'refresh_token') {
      const hash = digest(form.refresh_token ?? '');
      const row = this.db.prepare("SELECT * FROM oauth_tokens WHERE token_hash=? AND kind='refresh'").get(hash) as TokenRow | undefined;
      if (!row || row.expires_at <= Date.now() || row.client_id !== client.client_id || row.owner !== owner) return c.json({ error: 'invalid_grant' }, 400);
      // Refresh tokens rotate on every use.
      this.db.prepare('DELETE FROM oauth_tokens WHERE token_hash=?').run(hash);
      return c.json(this.issue(client.client_id, row.scope, row.resource, owner));
    }
    return c.json({ error: 'unsupported_grant_type' }, 400);
  }

  private async revoke(c: Context) {
    const form = Object.fromEntries(Object.entries(await c.req.parseBody()).map(([key, value]) => [key, typeof value === 'string' ? value : undefined]));
    const client = this.authenticateClient(c, form);
    if (!client) return c.json({ error: 'invalid_client' }, 401);
    if (form.token) this.db.prepare('DELETE FROM oauth_tokens WHERE token_hash=? AND client_id=?').run(digest(form.token), client.client_id);
    return c.body(null, 200);
  }

  close(): void { this.db.close(); }
}
