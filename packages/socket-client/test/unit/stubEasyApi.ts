import http from 'node:http';
import type { AddressInfo } from 'node:net';

export interface RecordedCall {
  method: string;
  body: any;
  apiKey: string | undefined;
}

/**
 * A stand-in for the Easy API: it records method calls, answers them with the
 * Easy API envelope, and lets a test push events down the `/api/events` stream.
 * It never touches WhatsApp.
 */
export async function startStubEasyApi(results: Record<string, unknown> = {}) {
  const calls: RecordedCall[] = [];
  const streams = new Set<http.ServerResponse>();
  let nextId = 0;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://stub');
    if (url.pathname === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(':connected\n\n');
      streams.add(res);
      req.on('close', () => streams.delete(res));
      return;
    }

    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      const method = url.pathname.replace(/^\/api\//, '');
      calls.push({ method, body: raw ? JSON.parse(raw) : undefined, apiKey: req.headers['x-api-key'] as string | undefined });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: results[method] ?? null }));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    calls,
    /** Push one event to every connected stream, in the Easy API's envelope. */
    emit(event: string, payload: unknown, ts = 1_700_000_000_000) {
      const envelope = { id: String(++nextId), event, payload, ts, sessionId: 'stub-session' };
      for (const stream of streams) stream.write(`id: ${envelope.id}\nevent: ${event}\ndata: ${JSON.stringify(envelope)}\n\n`);
    },
    async close() {
      for (const stream of streams) stream.end();
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
