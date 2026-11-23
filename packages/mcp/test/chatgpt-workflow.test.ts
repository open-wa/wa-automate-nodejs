import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import type { Config } from '@open-wa/schema';
import { createHonoMcpAdapter } from '../src/adapter/hono-mcp';
import { callChatTool, mediaContent } from '../src/adapter/chat-tools';
import { McpEventsService } from '../src/events/service';
import { McpOAuth, type ApprovalCodeRequest } from '../src/oauth/oauth';
import { createApprovalDelivery } from '../src/oauth/approval-delivery';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Webhook } from 'standardwebhooks';

const dirs: string[] = [];
const closers: (() => Promise<void>)[] = [];
afterEach(async () => {
  await Promise.all(closers.splice(0).map(close => close()));
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});
const tempDir = () => { const dir = mkdtempSync(join(tmpdir(), 'mcp-chatgpt-')); dirs.push(dir); return dir; };

describe('OAuth sign-in', () => {
  const API_KEY = 'owner-key-123';
  const ORIGIN = 'https://wa.example.com';
  function server() {
    const dir = tempDir();
    const config = {
      sessionId: 'oauth', apiKey: API_KEY,
      mcp: { enabled: true, path: '/mcp', events: { enabled: false }, oauth: { enabled: true, publicUrl: ORIGIN, storePath: join(dir, 'oauth.sqlite') } },
    } as unknown as Config;
    const app = new Hono();
    const adapter = createHonoMcpAdapter({ config, clientSource: () => ({}) });
    adapter.mount(app, '/mcp');
    closers.push(() => adapter.close());
    return app;
  }
  const form = (values: Record<string, string>) => ({ method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(values).toString() });

  it('challenges unauthenticated MCP requests and publishes metadata', async () => {
    const app = server();
    const denied = await app.request('/mcp', { method: 'POST' });
    expect(denied.status).toBe(401);
    expect(denied.headers.get('www-authenticate')).toBe(`Bearer resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource/mcp", scope="mcp"`);
    const resource = await (await app.request('/.well-known/oauth-protected-resource/mcp')).json();
    expect(resource).toMatchObject({ resource: `${ORIGIN}/mcp`, authorization_servers: [ORIGIN] });
    const metadata = await (await app.request('/.well-known/oauth-authorization-server')).json();
    expect(metadata).toMatchObject({ issuer: ORIGIN, code_challenge_methods_supported: ['S256'], registration_endpoint: `${ORIGIN}/oauth/register` });
  });

  it('issues a resource-bound token through registration, consent and PKCE, and rotates refresh tokens', async () => {
    const app = server();
    const registered = await (await app.request('/oauth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_name: 'Test', redirect_uris: ['https://client.example/cb'] }),
    })).json();
    const verifier = randomBytes(32).toString('base64url');
    const authorize = {
      response_type: 'code', client_id: registered.client_id, redirect_uri: 'https://client.example/cb', state: 's1', scope: 'mcp',
      code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', resource: `${ORIGIN}/mcp`,
    };
    const page = await (await app.request(`/oauth/authorize?${new URLSearchParams(authorize)}`)).text();
    expect(page).toContain('Connect Test to open-wa');

    expect((await app.request('/oauth/authorize', form({ ...authorize, api_key: 'wrong', decision: 'approve' }))).status).toBe(401);
    const approved = await app.request('/oauth/authorize', form({ ...authorize, api_key: API_KEY, decision: 'approve' }));
    const location = new URL(approved.headers.get('location')!);
    expect(location.searchParams.get('state')).toBe('s1');
    expect(location.searchParams.get('iss')).toBe(ORIGIN);
    const code = location.searchParams.get('code')!;

    const exchange = { grant_type: 'authorization_code', code, redirect_uri: 'https://client.example/cb', client_id: registered.client_id };
    expect((await app.request('/oauth/token', form({ ...exchange, code_verifier: 'wrong-verifier' }))).status).toBe(400);
    // The failed attempt consumed the code, as single-use codes must.
    expect((await app.request('/oauth/token', form({ ...exchange, code_verifier: verifier }))).status).toBe(400);

    const second = new URL((await app.request('/oauth/authorize', form({ ...authorize, api_key: API_KEY, decision: 'approve' }))).headers.get('location')!);
    const tokens = await (await app.request('/oauth/token', form({ ...exchange, code: second.searchParams.get('code')!, code_verifier: verifier }))).json();
    expect(tokens).toMatchObject({ token_type: 'Bearer', scope: 'mcp' });

    const discover = await app.request('/mcp', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${tokens.access_token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'server/discover',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'server/discover', params: { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} } } }),
    });
    expect(discover.status).toBe(200);

    const refreshed = await (await app.request('/oauth/token', form({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token, client_id: registered.client_id }))).json();
    expect(refreshed.access_token).toBeTruthy();
    expect((await app.request('/oauth/token', form({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token, client_id: registered.client_id }))).status).toBe(400);
  });

  it('rejects insecure redirect URIs and unregistered redirects', async () => {
    const app = server();
    const bad = await app.request('/oauth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ redirect_uris: ['http://evil.example/cb'] }) });
    expect(bad.status).toBe(400);
    const registered = await (await app.request('/oauth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ redirect_uris: ['https://client.example/cb'] }) })).json();
    const page = await app.request(`/oauth/authorize?${new URLSearchParams({ response_type: 'code', client_id: registered.client_id, redirect_uri: 'https://attacker.example/cb', code_challenge: 'x', code_challenge_method: 'S256' })}`);
    expect(page.status).toBe(400);
  });
});

describe('approval codes', () => {
  const ORIGIN = 'https://wa.example.com';
  const form = (values: Record<string, string>) => ({ method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(values).toString() });
  async function setup() {
    const codes: ApprovalCodeRequest[] = [];
    const oauth = new McpOAuth({
      storePath: join(tempDir(), 'oauth.sqlite'), mcpPath: '/mcp', apiKey: () => 'owner-key', owner: () => 'owner', publicUrl: ORIGIN,
      onApprovalCode: request => codes.push(request),
    });
    closers.push(async () => oauth.close());
    const app = new Hono();
    oauth.routes(app);
    const client = await (await app.request('/oauth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_name: 'ChatGPT', redirect_uris: ['https://chatgpt.com/cb'] }),
    })).json();
    const authorize = (challenge = 'c'.repeat(43)) => ({
      response_type: 'code', client_id: client.client_id, redirect_uri: 'https://chatgpt.com/cb', state: 's',
      code_challenge: challenge, code_challenge_method: 'S256', resource: `${ORIGIN}/mcp`,
    });
    return { app, codes, authorize };
  }

  it('approves with a one-time code that works once, for its own request only', async () => {
    const { app, codes, authorize } = await setup();
    const pageResponse = await app.request(`/oauth/authorize?${new URLSearchParams(authorize())}`);
    // Browsers apply form-action to the redirect after the post, so the client's origin must be allowed.
    expect(pageResponse.headers.get('content-security-policy')).toContain("form-action 'self' https://chatgpt.com;");
    const page = await pageResponse.text();
    expect(page).toContain('Get a one-time code');
    expect(codes).toHaveLength(0);

    const sent = await (await app.request('/oauth/authorize', form({ ...authorize(), decision: 'send_code' }))).text();
    expect(codes).toHaveLength(1);
    const { requestId, code, clientName, redirectHost } = codes[0];
    expect({ clientName, redirectHost }).toEqual({ clientName: 'ChatGPT', redirectHost: 'chatgpt.com' });
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(sent).toContain(requestId);
    expect(sent).not.toContain(code);

    // A code can't approve a different authorization request.
    const other = await app.request('/oauth/authorize', form({ ...authorize('d'.repeat(43)), request_id: requestId, approval_code: code, decision: 'approve' }));
    expect(other.status).toBe(401);
    expect(await other.text()).toContain('expired or belongs to another request');

    await app.request('/oauth/authorize', form({ ...authorize(), decision: 'send_code' }));
    const fresh = codes[1];
    const approved = await app.request('/oauth/authorize', form({ ...authorize(), request_id: fresh.requestId, approval_code: fresh.code.toLowerCase().replace('-', ' '), decision: 'approve' }));
    expect(approved.status).toBe(302);
    expect(new URL(approved.headers.get('location')!).searchParams.get('code')).toBeTruthy();
    const reused = await app.request('/oauth/authorize', form({ ...authorize(), request_id: fresh.requestId, approval_code: fresh.code, decision: 'approve' }));
    expect(reused.status).toBe(401);
  });

  it('allows five guesses per code and caps how many codes one address can request', async () => {
    const { app, codes, authorize } = await setup();
    await app.request('/oauth/authorize', form({ ...authorize(), decision: 'send_code' }));
    const { requestId, code } = codes[0];
    for (let i = 0; i < 5; i++) {
      const res = await app.request('/oauth/authorize', form({ ...authorize(), request_id: requestId, approval_code: 'AAAA-AAAA', decision: 'approve' }));
      expect(res.status).toBe(401);
    }
    const late = await app.request('/oauth/authorize', form({ ...authorize(), request_id: requestId, approval_code: code, decision: 'approve' }));
    expect(late.status).toBe(401);
    for (let i = 0; i < 4; i++) await app.request('/oauth/authorize', form({ ...authorize(), decision: 'send_code' }));
    expect(codes).toHaveLength(5);
    expect((await app.request('/oauth/authorize', form({ ...authorize(), decision: 'send_code' }))).status).toBe(429);
    expect(codes).toHaveLength(5);
  });

  it('still accepts the Easy API key', async () => {
    const { app, authorize } = await setup();
    expect((await app.request('/oauth/authorize', form({ ...authorize(), api_key: 'wrong', decision: 'approve' }))).status).toBe(401);
    expect((await app.request('/oauth/authorize', form({ ...authorize(), api_key: 'owner-key', decision: 'approve' }))).status).toBe(302);
  });

  it('delivers the code to the log, a signed webhook and the account\'s own chat', async () => {
    const received: { headers: http.IncomingHttpHeaders; body: string }[] = [];
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => { received.push({ headers: req.headers, body }); res.end(); });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    closers.push(async () => { server.close(); });
    const secret = `whsec_${Buffer.from('approval-secret-0123456789').toString('base64')}`;
    const lines: string[] = [];
    const calls: [string, Record<string, unknown>][] = [];
    const own: string[] = [];
    const deliver = createApprovalDelivery({
      sessionId: 'shop', log: true, sendToSelf: true, webhookSecret: secret,
      webhookUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}/hook`,
      write: line => lines.push(line), noteOwnSend: id => own.push(id),
      invoke: async (fn, payload) => {
        calls.push([fn, payload]);
        return fn === 'getHostNumber' ? { success: true, data: '447700900123' } : { success: true, data: 'true_447700900123@c.us_SELF' };
      },
    });
    deliver({ requestId: 'K7F2', code: 'ABCD-EFGH', clientName: 'ChatGPT', redirectHost: 'chatgpt.com', expiresAt: Date.now() + 600_000 });
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(lines[0]).toContain('Request K7F2, one-time code ABCD-EFGH');
    expect(received).toHaveLength(1);
    const payload = new Webhook(secret).verify(received[0].body, received[0].headers as Record<string, string>) as { type: string; data: Record<string, unknown> };
    expect(payload).toMatchObject({ type: 'mcp.oauth.approval_requested', data: { sessionId: 'shop', requestId: 'K7F2', code: 'ABCD-EFGH' } });
    expect(calls[1][0]).toBe('sendText');
    expect(calls[1][1]).toMatchObject({ to: '447700900123@c.us' });
    expect(String(calls[1][1].content)).toContain('ABCD-EFGH');
    expect(own).toEqual(['true_447700900123@c.us_SELF']);
  });
});

describe('media content', () => {
  it('returns images and voice notes as viewable content', () => {
    const image = mediaContent(`data:image/jpeg;base64,${Buffer.from('jpeg').toString('base64')}`);
    expect(image?.[1]).toEqual({ type: 'image', data: Buffer.from('jpeg').toString('base64'), mimeType: 'image/jpeg' });
    const voice = mediaContent(`data:audio/ogg; codecs=opus;base64,${Buffer.from('opus').toString('base64')}`);
    expect(voice?.[1]).toMatchObject({ type: 'audio', mimeType: 'audio/ogg' });
    expect(mediaContent('plain text')).toBeUndefined();
  });

  it('downloads media for a message ID and sends ChatGPT files by URL', async () => {
    const calls: [string, Record<string, unknown>][] = [];
    const invoke = async (fn: string, payload: Record<string, unknown>) => {
      calls.push([fn, payload]);
      if (fn === 'getMessageById') return { success: true, data: { id: payload.messageId, type: 'image' } };
      if (fn === 'decryptMedia') return { success: true, data: 'data:image/png;base64,iVBORw0KGgo=' };
      return { success: true, data: 'true_447700900123@c.us_SENT' };
    };
    const media = await callChatTool('media.getForMessage', { messageId: 'false_1@c.us_X' }, invoke);
    expect(media?.content[1]).toMatchObject({ type: 'image', mimeType: 'image/png' });
    const sent = await callChatTool('messages.sendAttachment', {
      to: '447700900123@c.us', caption: 'Design A',
      file: { download_url: 'https://files.example/abc', file_id: 'file_1', mime_type: 'image/png', file_name: 'design.png' },
    }, invoke);
    expect(sent?.isError).toBeUndefined();
    expect(calls.at(-1)).toEqual(['sendFileFromUrl', { to: '447700900123@c.us', url: 'https://files.example/abc', filename: 'design.png', options: { type: 'auto', caption: 'Design A' } }]);
    const insecure = await callChatTool('messages.sendAttachment', { to: '1@c.us', file: { download_url: 'http://x', file_id: 'f' } }, invoke);
    expect(insecure?.isError).toBe(true);
  });
});

describe('operator pause', () => {
  it('pauses message events after a reply typed in the app, but not after open-wa sends', () => {
    const service = new McpEventsService({ sessionId: 's', storePath: join(tempDir(), 'e.sqlite'), owner: () => 'o', lifetimeMs: 60_000, retentionMs: 60_000 });
    closers.push(() => service.close());
    const cursor = service.poll({ name: 'message.received', arguments: {}, cursor: null }).cursor;
    const incoming = (id: string) => service.publish('message.received', { ctx: { ts: Date.now() }, message: { id, chatId: 'a@c.us', from: 'a@c.us', body: 'hi' } });

    // Sent from open-wa's own linked device, whether through MCP or REST.
    service.publish('message.any', { message: { id: 'true_a@c.us_BOT', fromMe: true, local: true, chatId: 'a@c.us' } });
    incoming('m1');
    expect(service.chatStatus('a@c.us').paused).toBe(false);

    service.publish('message.any', { message: { id: 'true_a@c.us_HUMAN', fromMe: true, local: false, chatId: 'a@c.us' } });
    expect(service.chatStatus('a@c.us')).toMatchObject({ paused: true, reason: 'operator' });
    incoming('m2');
    service.resumeChat('a@c.us');
    incoming('m3');
    expect(service.poll({ name: 'message.received', arguments: {}, cursor }).events.map(event => event.eventId)).toEqual(['m1', 'm3']);
  });

  it('waits for a send to return its ID before treating an unflagged message as a person', async () => {
    const service = new McpEventsService({ sessionId: 's', storePath: join(tempDir(), 'e.sqlite'), owner: () => 'o', lifetimeMs: 60_000, retentionMs: 60_000 });
    closers.push(() => service.close());
    // WhatsApp reports the message first, then the send call returns its ID.
    service.publish('message.any', { message: { id: 'true_b@c.us_RACE', fromMe: true, chatId: 'b@c.us' } });
    service.noteOwnSend('true_b@c.us_RACE');
    service.publish('message.any', { message: { id: 'true_b@c.us_PHONE', fromMe: true, chatId: 'c@c.us' } });
    await new Promise(resolve => setTimeout(resolve, 3200));
    expect(service.chatStatus('b@c.us').paused).toBe(false);
    expect(service.chatStatus('c@c.us').paused).toBe(true);
  }, 10_000);
});
