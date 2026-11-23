import WebSocket from 'ws';

export interface TunnelClientOptions {
  proxyHost: string;
  /** Self-hosted proxy: the shared upstream token. */
  proxyToken?: string;
  /** Licensed router: the license key and this account's number; the router answers with the session's address. */
  license?: { key: string; number: string };
  onAddress?: (address: string) => void;
  sessionId: string;
  localSessionPort: number;
  localApiKey?: string;
  log?: (level: 'info' | 'warn' | 'error', message: string) => void;
}

/** Largest body slice per frame, before base64; matches the proxy. */
const BODY_CHUNK_BYTES = 256 * 1024;
/** Sent by the proxy when another instance of the same session connects. */
const REPLACED_CLOSE_CODE = 4001;
const HEARTBEAT_MS = 20_000;
const MAX_BUFFERED_BYTES = 4 * 1024 * 1024;
const HOP_BY_HOP = new Set(['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'te', 'trailer', 'host', 'content-length', 'expect']);

interface TunnelStream {
  abort: AbortController;
  body?: ReadableStreamDefaultController<Uint8Array>;
}

export class TunnelClient {
  private ws: WebSocket | null = null;
  private streams = new Map<string, TunnelStream>();
  private heartbeat: NodeJS.Timeout | null = null;
  private lastPong = 0;
  private replaced = false;
  private retryMs = 3_000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  constructor(private options: TunnelClientOptions) {}

  private log(level: 'info' | 'warn' | 'error', message: string) {
    if (this.options.log) {
      this.options.log(level, message);
      return;
    }

    if (level === 'warn') {
      console.warn(message);
      return;
    }

    if (level === 'error') {
      console.error(message);
      return;
    }

    console.log(message);
  }

  public connect() {
    if (this.isDestroyed) return;

    const base = this.options.proxyHost.replace(/^http/, 'ws').replace(/\/+$/, '');
    const { license } = this.options;
    const connectUrl = license ? `${base}/upstream` : `${base}/sessions/${encodeURIComponent(this.options.sessionId)}/upstream`;
    // Credentials go in headers so they do not appear in request logs.
    const headers: Record<string, string> = license
      ? { Authorization: `License ${license.key}`, 'x-owa-number': license.number }
      : { Authorization: `Bearer ${this.options.proxyToken}` };
    this.ws = new WebSocket(connectUrl, { headers });
    this.ws.on('unexpected-response', (req, res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      res.on('end', () => {
        this.log('error', `[TunnelClient] The proxy refused the connection (${res.statusCode}): ${body.slice(0, 200)}`);
        // A refused license or token won't fix itself in 3 seconds; retry slowly.
        this.retryMs = res.statusCode === 401 || res.statusCode === 403 ? 60_000 : 3_000;
        req.destroy();
      });
    });

    this.ws.on('open', () => {
      this.retryMs = 3_000;
      this.log('info', `[TunnelClient] Connected upstream for session ${this.options.sessionId}`);
      // The proxy answers pings at the edge; a missing answer means the connection is half open.
      this.lastPong = Date.now();
      this.heartbeat = setInterval(() => {
        if (Date.now() - this.lastPong > HEARTBEAT_MS * 2 + 5_000) {
          this.log('warn', '[TunnelClient] No answer from the proxy; reconnecting');
          this.ws?.terminate();
          return;
        }
        this.send({ type: 'ping' });
      }, HEARTBEAT_MS);
    });

    this.ws.on('message', (data: Buffer) => {
      let msg: any;
      try {
        msg = JSON.parse(data.toString('utf-8'));
      } catch {
        return;
      }

      switch (msg.type) {
        case 'ping':
          this.send({ type: 'pong' });
          return;
        case 'pong':
          this.lastPong = Date.now();
          return;
        case 'welcome':
          if (typeof msg.address === 'string') {
            this.log('info', `[TunnelClient] Public address: ${msg.address} (MCP: ${msg.address}/mcp)`);
            this.options.onAddress?.(msg.address);
          }
          return;
        case 'replaced':
          this.replaced = true;
          this.log('error', `[TunnelClient] Another instance connected as session ${this.options.sessionId}; this one stopped forwarding. Restart it to take over again.`);
          this.ws?.close();
          return;
        case 'req_start':
          void this.handleRequest(msg);
          return;
        case 'req_body':
          this.streams.get(msg.id)?.body?.enqueue(new Uint8Array(Buffer.from(msg.chunk, 'base64')));
          return;
        case 'req_end':
          this.streams.get(msg.id)?.body?.close();
          return;
        case 'req_abort': {
          const stream = this.streams.get(msg.id);
          stream?.abort.abort();
          try { stream?.body?.error(new Error(msg.error ?? 'Aborted')); } catch { /* already closed */ }
          this.streams.delete(msg.id);
          return;
        }
        case 'rpc_request':
          // Map RPC requests to the REST API.
          void this.handleRpcAsHttp(msg);
          return;
      }
    });

    this.ws.on('close', (code: number) => {
      for (const stream of this.streams.values()) stream.abort.abort();
      this.streams.clear();
      if (this.heartbeat) clearInterval(this.heartbeat);
      if (this.replaced || code === REPLACED_CLOSE_CODE) return;
      if (!this.isDestroyed) {
        this.log('warn', `[TunnelClient] Disconnected. Reconnecting in ${this.retryMs / 1000}s...`);
        this.reconnectTimeout = setTimeout(() => this.connect(), this.retryMs);
      }
    });

    this.ws.on('error', (err: any) => {
      this.log('error', `[TunnelClient] WebSocket error: ${err.message}`);
    });
  }

  private send(message: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message));
  }

  /** Waits while the socket has a large send backlog, so a big download does not fill memory. */
  private async drain() {
    while (this.ws && this.ws.readyState === WebSocket.OPEN && this.ws.bufferedAmount > MAX_BUFFERED_BYTES) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private async handleRequest(msg: { id: string; method: string; path: string; headers: [string, string][]; hasBody: boolean }) {
    const abort = new AbortController();
    const stream: TunnelStream = { abort };
    this.streams.set(msg.id, stream);
    const body = msg.hasBody ? new ReadableStream<Uint8Array>({ start: controller => { stream.body = controller; } }) : undefined;
    const headers = new Headers();
    for (const [key, value] of msg.headers) if (!HOP_BY_HOP.has(key.toLowerCase())) headers.append(key, value);

    let started = false;
    try {
      const res = await fetch(`http://127.0.0.1:${this.options.localSessionPort}${msg.path}`, {
        method: msg.method, headers, body, signal: abort.signal, redirect: 'manual',
        // Required by Node to stream a request body.
        ...(body ? { duplex: 'half' } : {}),
      } as RequestInit);

      // fetch decodes compressed bodies, so the encoding and length headers no longer apply.
      const pairs: [string, string][] = [];
      res.headers.forEach((value, key) => {
        if (key !== 'set-cookie' && key !== 'content-encoding' && !HOP_BY_HOP.has(key)) pairs.push([key, value]);
      });
      for (const cookie of res.headers.getSetCookie()) pairs.push(['set-cookie', cookie]);
      this.send({ type: 'res_start', id: msg.id, status: res.status, headers: pairs });
      started = true;

      if (res.body) {
        for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
          if (!this.streams.has(msg.id)) return;
          for (let offset = 0; offset < chunk.length; offset += BODY_CHUNK_BYTES) {
            await this.drain();
            this.send({ type: 'res_body', id: msg.id, chunk: Buffer.from(chunk.subarray(offset, offset + BODY_CHUNK_BYTES)).toString('base64') });
          }
        }
      }
      this.send({ type: 'res_end', id: msg.id });
    } catch (e: unknown) {
      if (abort.signal.aborted) return;
      const cause = e instanceof Error && e.cause instanceof Error ? ` (${e.cause.message})` : '';
      const message = `${e instanceof Error ? e.message : String(e)}${cause}`;
      this.log('error', `[TunnelClient] Failed to proxy ${msg.method} ${msg.path.split('?')[0]}: ${message}`);
      if (!started) this.send({ type: 'res_start', id: msg.id, status: 502, headers: [['content-type', 'text/plain; charset=utf-8']] });
      if (!started) this.send({ type: 'res_body', id: msg.id, chunk: Buffer.from(`Bad Gateway: ${message}`).toString('base64') });
      this.send(started ? { type: 'res_abort', id: msg.id, error: message } : { type: 'res_end', id: msg.id });
    } finally {
      this.streams.delete(msg.id);
    }
  }

  private async handleRpcAsHttp(msg: any) {
    const refreshControl = msg.method === 'requestRefresh' || msg.method === 'getRefreshStatus';
    // If the proxy sends an RPC request, map it to the REST API equivalent.
    // E.g. rpc 'sendText' -> HTTP POST /api/sendText
    const localUrl = `http://127.0.0.1:${this.options.localSessionPort}${refreshControl ? '/api/session/refresh' : `/api/${msg.method}`}`;
    try {
      const method = msg.method === 'getRefreshStatus' ? 'GET' : 'POST';
      const res = await fetch(localUrl, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(refreshControl && this.options.localApiKey ? { 'X-API-Key': this.options.localApiKey } : {}),
        },
        ...(method === 'POST' ? { body: JSON.stringify(refreshControl ? msg.args ?? {} : { args: msg.args }) } : {}),
      });
      
      const resData = await res.json() as { error?: string };
      if (refreshControl && !res.ok) throw new Error(resData.error || 'Session controls are unavailable.');
      
      const responseMsg = {
        type: 'rpc_response',
        id: msg.id,
        result: resData
      };

      this.send(responseMsg);
    } catch (e: any) {
      this.log('error', `[TunnelClient] Failed to proxy rpc_request: ${e instanceof Error ? e.message : String(e)}`);
      this.send({
        type: 'rpc_response',
        id: msg.id,
        error: e.message
      });
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public disconnect() {
    this.destroy();
  }
}
