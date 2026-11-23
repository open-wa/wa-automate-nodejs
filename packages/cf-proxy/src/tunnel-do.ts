import { BODY_CHUNK_BYTES, HOP_BY_HOP, type AnyProxyMessage, type HeaderPairs } from './types';

/** How long to wait for the session to start a response. Once it starts, the body may stream indefinitely. */
const RESPONSE_START_TIMEOUT_MS = 30_000;
/**
 * An open event stream keeps this object awake, which is billed by the second. Each session gets one stream at a
 * time (a new one replaces the old) and a stream ends after 10 minutes; clients reconnect with their cursor.
 */
const STREAM_MAX_MS = 10 * 60_000;
const MAX_STREAMS = 1;
/** Tells a replaced session not to reconnect, so two instances do not take turns. */
const REPLACED_CLOSE_CODE = 4001;
/** Set by the proxy itself; values sent by the caller are replaced. */
const FORWARDED = new Set(['x-forwarded-host', 'x-forwarded-proto', 'forwarded']);
/** Statuses whose Response must not carry a body. */
const NULL_BODY = new Set([101, 103, 204, 205, 304]);

interface PendingResponse {
  resolve: (response: Response) => void;
  timeout?: ReturnType<typeof setTimeout>;
  body?: ReadableStreamDefaultController<Uint8Array>;
  started: boolean;
  stream?: boolean;
}

const text = (status: number, message: string) => new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export class SessionTunnel implements DurableObject {
  private pending = new Map<string, PendingResponse>();

  constructor(private state: DurableObjectState, private env: unknown) {
    // Keepalives are answered at the edge without waking the object.
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}'));
  }

  async fetch(request: Request): Promise<Response> {
    const subpath = request.headers.get('x-owa-subpath') ?? '/';
    // Set by the Worker only after it authenticated the connection.
    const role = request.headers.get('x-owa-role');

    if (role === 'upstream' || role === 'consumer') {
      if (request.headers.get('Upgrade') !== 'websocket') return text(426, 'Expected Upgrade: websocket');
      const [client, server] = Object.values(new WebSocketPair());
      if (role === 'upstream') {
        // A session reconnecting replaces its previous connection; requests on the old one fail.
        for (const old of this.state.getWebSockets('upstream')) {
          try {
            this.send(old, { type: 'replaced' });
            old.close(REPLACED_CLOSE_CODE, 'Another instance of this session connected');
          } catch {
            // Already closing.
          }
        }
        this.failAll('The session reconnected');
        await this.state.storage.delete('offlineSince');
      }
      this.state.acceptWebSocket(server, [role]);
      const address = request.headers.get('x-owa-address');
      if (role === 'upstream' && address) this.send(server, { type: 'welcome', address });
      return new Response(null, { status: 101, webSocket: client });
    }

    return this.proxy(request, subpath);
  }

  /** The open upstream connection; a replaced one may still be closing. */
  private upstream(): WebSocket | undefined {
    return this.state.getWebSockets('upstream').find(socket => socket.readyState === WebSocket.READY_STATE_OPEN);
  }

  private send(ws: WebSocket, message: AnyProxyMessage) {
    ws.send(JSON.stringify(message));
  }

  private async proxy(request: Request, subpath: string): Promise<Response> {
    const upstream = this.upstream();
    if (!upstream) {
      const offlineSince = await this.state.storage.get<number>('offlineSince');
      const since = offlineSince ? ` since ${new Date(offlineSince).toISOString()}` : '';
      return new Response(`Session offline${since}`, { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '30' } });
    }

    const url = new URL(request.url);
    const headers: HeaderPairs = [];
    for (const [key, value] of request.headers) {
      if (!HOP_BY_HOP.has(key) && !key.startsWith('x-owa-') && !FORWARDED.has(key)) headers.push([key, value]);
    }
    headers.push(['x-forwarded-host', request.headers.get('x-owa-public-host') ?? url.host], ['x-forwarded-proto', 'https']);

    const id = crypto.randomUUID();
    const response = new Promise<Response>(resolve => {
      const timeout = setTimeout(() => this.finish(id, text(504, 'The session did not respond in time')), RESPONSE_START_TIMEOUT_MS);
      this.pending.set(id, { resolve, timeout, started: false });
    });

    this.send(upstream, { type: 'req_start', id, method: request.method, path: subpath, headers, hasBody: request.body !== null });
    if (request.body) void this.pumpRequestBody(id, request.body, upstream);
    return response;
  }

  private async pumpRequestBody(id: string, body: ReadableStream<Uint8Array>, upstream: WebSocket) {
    const reader = body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!this.pending.has(id)) return void reader.cancel().catch(() => undefined);
        for (let offset = 0; offset < value.length; offset += BODY_CHUNK_BYTES) {
          this.send(upstream, { type: 'req_body', id, chunk: toBase64(value.subarray(offset, offset + BODY_CHUNK_BYTES)) });
        }
      }
      if (this.pending.has(id)) this.send(upstream, { type: 'req_end', id });
    } catch (error) {
      if (this.pending.has(id)) this.send(upstream, { type: 'req_abort', id, error: String(error) });
    }
  }

  /** Resolves a response that has not started yet, or ends one that is streaming. */
  private finish(id: string, fallback: Response, error?: Error) {
    const entry = this.pending.get(id);
    if (!entry) return;
    this.pending.delete(id);
    if (entry.timeout) clearTimeout(entry.timeout);
    if (!entry.started) {
      entry.resolve(fallback);
      const upstream = this.upstream();
      if (upstream) this.send(upstream, { type: 'req_abort', id, error: 'Response no longer awaited' });
      return;
    }
    try {
      if (error) entry.body?.error(error);
      else entry.body?.close();
    } catch {
      // The reader already went away.
    }
  }

  /** Ends a streaming response cleanly and tells the session to stop producing it. */
  private endStream(id: string, reason: string) {
    if (!this.pending.has(id)) return;
    this.finish(id, text(502, reason));
    const upstream = this.upstream();
    if (upstream) this.send(upstream, { type: 'req_abort', id, error: reason });
  }

  private failAll(reason: string) {
    for (const id of [...this.pending.keys()]) this.finish(id, text(502, reason), new Error(reason));
  }

  private startResponse(id: string, status: number, headerPairs: HeaderPairs) {
    const entry = this.pending.get(id);
    if (!entry || entry.started) return;
    entry.started = true;
    if (entry.timeout) clearTimeout(entry.timeout);
    const headers = new Headers();
    for (const [key, value] of headerPairs) if (!HOP_BY_HOP.has(key.toLowerCase())) headers.append(key, value);

    if (NULL_BODY.has(status)) {
      this.pending.delete(id);
      entry.resolve(new Response(null, { status, headers }));
      return;
    }
    const body = new ReadableStream<Uint8Array>({
      start: controller => { entry.body = controller; },
      cancel: () => {
        // The caller disconnected, for example by closing an event stream.
        if (!this.pending.delete(id)) return;
        const upstream = this.upstream();
        if (upstream) this.send(upstream, { type: 'req_abort', id, error: 'Client disconnected' });
      },
    });
    if ((headers.get('content-type') ?? '').includes('text/event-stream')) {
      const open = [...this.pending].filter(([other, value]) => other !== id && value.stream).map(([other]) => other);
      for (const other of open.slice(0, Math.max(0, open.length - MAX_STREAMS + 1))) this.endStream(other, 'Replaced by a newer event stream');
      entry.stream = true;
      entry.timeout = setTimeout(() => this.endStream(id, 'Event stream time limit reached; reconnect with your cursor'), STREAM_MAX_MS);
    }
    entry.resolve(new Response(body, { status, headers }));
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== 'string') return;
    let message: AnyProxyMessage;
    try {
      message = JSON.parse(raw) as AnyProxyMessage;
    } catch {
      return;
    }
    const tags = this.state.getTags(ws);

    if (tags.includes('upstream')) {
      switch (message.type) {
        case 'res_start':
          this.startResponse(message.id, message.status, message.headers);
          return;
        case 'res_body': {
          const entry = this.pending.get(message.id);
          try {
            entry?.body?.enqueue(fromBase64(message.chunk));
          } catch {
            this.finish(message.id, text(502, 'Bad response from the session'));
          }
          return;
        }
        case 'res_end':
          this.finish(message.id, text(502, 'The session ended the response before starting it'));
          return;
        case 'res_abort':
          this.finish(message.id, text(502, `Bad Gateway: ${message.error ?? 'the session could not answer'}`), new Error(message.error ?? 'Aborted by the session'));
          return;
        case 'rpc_response':
        case 'event':
          // Consumers filter RPC responses by ID.
          for (const consumer of this.state.getWebSockets('consumer')) consumer.send(raw);
          return;
        default:
          return;
      }
    }

    if (tags.includes('consumer')) {
      const upstream = this.upstream();
      if (upstream) upstream.send(raw);
      else if (message.type === 'rpc_request') this.send(ws, { type: 'rpc_response', id: message.id, error: 'Session offline' });
    }
  }

  async webSocketClose(ws: WebSocket) {
    if (!this.state.getTags(ws).includes('upstream')) return;
    // A replaced connection closes after its successor is accepted; only report offline when none is left.
    if (this.state.getWebSockets('upstream').some(socket => socket !== ws && socket.readyState === WebSocket.READY_STATE_OPEN)) return;
    await this.state.storage.put('offlineSince', Date.now());
    this.failAll('The session went offline');
    for (const consumer of this.state.getWebSockets('consumer')) this.send(consumer, { type: 'session_offline' });
  }

  async webSocketError(ws: WebSocket) {
    await this.webSocketClose(ws);
  }
}
