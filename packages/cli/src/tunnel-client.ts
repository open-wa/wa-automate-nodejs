import WebSocket from 'ws';

export interface TunnelClientOptions {
  proxyHost: string;
  proxyToken: string;
  sessionId: string;
  localSessionPort: number;
  localApiKey?: string;
  log?: (level: 'info' | 'warn' | 'error', message: string) => void;
}

export class TunnelClient {
  private ws: WebSocket | null = null;
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

    let urlStr = this.options.proxyHost;
    if (urlStr.startsWith('http')) {
      urlStr = urlStr.replace(/^http/, 'ws');
    }
    const connectUrl = `${urlStr}/sessions/${encodeURIComponent(this.options.sessionId)}/upstream?token=${encodeURIComponent(this.options.proxyToken)}`;

    this.ws = new WebSocket(connectUrl);

    this.ws.on('open', () => {
      this.log('info', `[TunnelClient] Connected upstream for session ${this.options.sessionId}`);
    });

    this.ws.on('message', async (data: Buffer) => {
      let msg: any;
      try {
        msg = JSON.parse(data.toString('utf-8'));
      } catch {
        return;
      }

      if (msg.type === 'ping') {
        this.ws?.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      if (msg.type === 'http_request') {
        await this.handleHttpRequest(msg);
      } else if (msg.type === 'rpc_request') {
        // Advanced hybrid mode: forward to an RPC interface if exposed, or map to HTTP.
        // For now, if we get an RPC request in CLI, proxy it to HTTP.
        await this.handleRpcAsHttp(msg);
      }
    });

    this.ws.on('close', () => {
      if (!this.isDestroyed) {
        this.log('warn', `[TunnelClient] Disconnected. Reconnecting in 3s...`);
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      }
    });

    this.ws.on('error', (err: any) => {
      this.log('error', `[TunnelClient] WebSocket error: ${err.message}`);
    });
  }

  private async handleHttpRequest(msg: any) {
    const localUrl = `http://localhost:${this.options.localSessionPort}${msg.path}`;
    try {
      const fetchOpts: RequestInit = {
        method: msg.method,
        // @ts-ignore
        headers: msg.headers || {},
      };
      
      if (msg.body) {
        if (typeof msg.body === 'string') {
          fetchOpts.body = Buffer.from(msg.body, 'base64');
        }
      }

      const res = await fetch(localUrl, fetchOpts);
      const resBuffer = await res.arrayBuffer();
      
      const responseMsg = {
        type: 'http_response',
        id: msg.id,
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body: Buffer.from(resBuffer).toString('base64')
      };

      this.ws?.send(JSON.stringify(responseMsg));
    } catch (e: any) {
      this.log('error', `[TunnelClient] Failed to proxy http_request: ${e instanceof Error ? e.message : String(e)}`);
      this.ws?.send(JSON.stringify({
        type: 'http_response',
        id: msg.id,
        status: 502,
        headers: { 'content-type': 'text/plain' },
        body: Buffer.from('Bad Gateway: ' + e.message).toString('base64')
      }));
    }
  }

  private async handleRpcAsHttp(msg: any) {
    const refreshControl = msg.method === 'requestRefresh' || msg.method === 'getRefreshStatus';
    // If the proxy sends an RPC request, map it to the REST API equivalent.
    // E.g. rpc 'sendText' -> HTTP POST /api/sendText
    const localUrl = `http://localhost:${this.options.localSessionPort}${refreshControl ? '/api/session/refresh' : `/api/${msg.method}`}`;
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
      
      const resData = await res.json();
      if (refreshControl && !res.ok) throw new Error(resData.error || 'Session controls are unavailable.');
      
      const responseMsg = {
        type: 'rpc_response',
        id: msg.id,
        result: resData
      };

      this.ws?.send(JSON.stringify(responseMsg));
    } catch (e: any) {
      this.log('error', `[TunnelClient] Failed to proxy rpc_request: ${e instanceof Error ? e.message : String(e)}`);
      this.ws?.send(JSON.stringify({
        type: 'rpc_response',
        id: msg.id,
        error: e.message
      }));
    }
  }

  public destroy() {
    this.isDestroyed = true;
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
