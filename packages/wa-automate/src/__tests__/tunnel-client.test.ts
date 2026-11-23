import http from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocketServer, type WebSocket } from 'ws';
import { TunnelClient } from '../tunnel-client';

type Frame = Record<string, any>;
const closers: (() => void)[] = [];
afterEach(() => { for (const close of closers.splice(0)) close(); });

/** A fake proxy: records frames from the client and lets the test send frames to it. */
async function harness(handler: http.RequestListener) {
  const origin = http.createServer(handler);
  await new Promise<void>(resolve => origin.listen(0, '127.0.0.1', resolve));
  const proxy = new WebSocketServer({ port: 0, host: '127.0.0.1' });
  await new Promise<void>(resolve => proxy.once('listening', resolve));
  const frames: Frame[] = [];
  const auth: (string | undefined)[] = [];
  let socket!: WebSocket;
  const connected = new Promise<void>(resolve => proxy.on('connection', (ws, req) => {
    socket = ws;
    auth.push(req.headers.authorization);
    ws.on('message', data => frames.push(JSON.parse(String(data))));
    resolve();
  }));
  const client = new TunnelClient({
    proxyHost: `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`, proxyToken: 'upstream-secret', sessionId: 's1',
    localSessionPort: (origin.address() as AddressInfo).port, log: () => undefined,
  });
  client.connect();
  closers.push(() => { client.destroy(); proxy.close(); origin.closeAllConnections(); origin.close(); });
  await connected;
  const send = (frame: Frame) => socket.send(JSON.stringify(frame));
  const until = async (predicate: () => boolean, ms = 3000) => {
    const end = Date.now() + ms;
    while (!predicate()) {
      if (Date.now() > end) throw new Error('timed out');
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };
  const of = (id: string, type?: string) => frames.filter(frame => frame.id === id && (!type || frame.type === type));
  const body = (id: string) => Buffer.concat(of(id, 'res_body').map(frame => Buffer.from(frame.chunk, 'base64')));
  return { send, until, of, body, frames, auth, proxy, client };
}

describe('TunnelClient', () => {
  it('authenticates with a header and streams event-stream chunks as they are written', async () => {
    const t = await harness((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'set-cookie': ['a=1', 'b=2'] });
      res.write('data: one\n\n');
      setTimeout(() => res.end('data: two\n\n'), 300);
    });
    expect(t.auth).toEqual(['Bearer upstream-secret']);
    t.send({ type: 'req_start', id: 'r1', method: 'GET', path: '/events?x=1', headers: [['accept', 'text/event-stream']], hasBody: false });
    await t.until(() => t.of('r1', 'res_body').length === 1);
    expect(t.of('r1', 'res_end')).toHaveLength(0);
    const start = t.of('r1', 'res_start')[0];
    expect(start.status).toBe(200);
    expect(start.headers.filter(([key]: string[]) => key === 'set-cookie')).toEqual([['set-cookie', 'a=1'], ['set-cookie', 'b=2']]);
    await t.until(() => t.of('r1', 'res_end').length === 1);
    expect(t.body('r1').toString()).toBe('data: one\n\ndata: two\n\n');
  });

  it('streams a request body and a large response in bounded chunks', async () => {
    const big = randomBytes(700 * 1024);
    const t = await harness((req, res) => {
      const hash = createHash('sha256');
      req.on('data', chunk => hash.update(chunk));
      req.on('end', () => { res.setHeader('x-upload', hash.digest('hex')); res.end(big); });
    });
    const upload = randomBytes(300 * 1024);
    t.send({ type: 'req_start', id: 'r2', method: 'POST', path: '/echo', headers: [['content-type', 'application/octet-stream'], ['expect', '100-continue']], hasBody: true });
    t.send({ type: 'req_body', id: 'r2', chunk: upload.subarray(0, 100_000).toString('base64') });
    t.send({ type: 'req_body', id: 'r2', chunk: upload.subarray(100_000).toString('base64') });
    t.send({ type: 'req_end', id: 'r2' });
    await t.until(() => t.of('r2', 'res_end').length === 1);
    const headers = new Map(t.of('r2', 'res_start')[0].headers);
    expect(headers.get('x-upload')).toBe(createHash('sha256').update(upload).digest('hex'));
    expect(t.of('r2', 'res_body').length).toBeGreaterThan(2);
    expect(t.body('r2').equals(big)).toBe(true);
  });

  it('stops the local request when the proxy aborts it', async () => {
    let closed = false;
    const t = await harness((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const timer = setInterval(() => res.write('data: tick\n\n'), 50);
      res.on('close', () => { closed = true; clearInterval(timer); });
    });
    t.send({ type: 'req_start', id: 'r3', method: 'GET', path: '/events', headers: [], hasBody: false });
    await t.until(() => t.of('r3', 'res_body').length >= 2);
    t.send({ type: 'req_abort', id: 'r3' });
    await t.until(() => closed);
  });

  it('answers 502 when the local API cannot be reached', async () => {
    const t = await harness((_req, res) => res.end());
    (t.client as any).options.localSessionPort = 1;
    t.send({ type: 'req_start', id: 'r4', method: 'GET', path: '/', headers: [], hasBody: false });
    await t.until(() => t.of('r4', 'res_end').length === 1);
    expect(t.of('r4', 'res_start')[0].status).toBe(502);
  });

  it('stops reconnecting after another instance replaces it', async () => {
    const t = await harness((_req, res) => res.end());
    let connections = 1;
    t.proxy.on('connection', () => { connections += 1; });
    t.send({ type: 'replaced' });
    await new Promise(resolve => setTimeout(resolve, 3500));
    expect(connections).toBe(1);
  }, 10_000);
  it('connects to a licensed router with the key and number, and reports the address it is given', async () => {
    const proxy = new WebSocketServer({ port: 0, host: '127.0.0.1' });
    await new Promise<void>(resolve => proxy.once('listening', resolve));
    const seen: { url?: string; auth?: string; number?: string } = {};
    proxy.on('connection', (ws, req) => {
      Object.assign(seen, { url: req.url, auth: req.headers.authorization, number: req.headers['x-owa-number'] });
      ws.send(JSON.stringify({ type: 'welcome', address: 'https://abc123.open-wa.com' }));
    });
    const addresses: string[] = [];
    const client = new TunnelClient({
      proxyHost: `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`, sessionId: 'ignored', localSessionPort: 1,
      license: { key: 'LICENSE-KEY', number: '447700900123' }, onAddress: address => addresses.push(address), log: () => undefined,
    });
    client.connect();
    closers.push(() => { client.destroy(); proxy.close(); });
    const end = Date.now() + 3000;
    while (!addresses.length && Date.now() < end) await new Promise(resolve => setTimeout(resolve, 10));
    expect(seen).toEqual({ url: '/upstream', auth: 'License LICENSE-KEY', number: '447700900123' });
    expect(addresses).toEqual(['https://abc123.open-wa.com']);
  });
});
