export class SessionTunnel {
    state;
    env;
    pendingRequests = new Map();
    constructor(state, env) {
        this.state = state;
        this.env = env;
        // Edge-level ping/pong handles keepalives without waking the DO
        this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}'));
    }
    async fetch(request) {
        const url = new URL(request.url);
        const subpath = url.pathname.match(/^\/sessions\/[^\/]+(.*)$/)?.[1] || '/';
        if (subpath.startsWith('/upstream')) {
            const upgradeHeader = request.headers.get('Upgrade');
            if (!upgradeHeader || upgradeHeader !== 'websocket') {
                return new Response('Expected Upgrade: websocket', { status: 426 });
            }
            const [client, server] = Object.values(new WebSocketPair());
            // Accept with tag "upstream"
            this.state.acceptWebSocket(server, ['upstream']);
            return new Response(null, { status: 101, webSocket: client });
        }
        if (subpath.startsWith('/connect')) {
            const upgradeHeader = request.headers.get('Upgrade');
            if (!upgradeHeader || upgradeHeader !== 'websocket') {
                return new Response('Expected Upgrade: websocket', { status: 426 });
            }
            const [client, server] = Object.values(new WebSocketPair());
            // Accept with tag "consumer"
            this.state.acceptWebSocket(server, ['consumer']);
            return new Response(null, { status: 101, webSocket: client });
        }
        // Handle HTTP proxy request
        return this.handleHttpAsRpc(request, subpath);
    }
    async handleHttpAsRpc(request, subpath) {
        const upstreams = this.state.getWebSockets('upstream');
        if (upstreams.length === 0) {
            return new Response('Session offline', { status: 503 });
        }
        const id = crypto.randomUUID();
        const headers = {};
        for (const [key, value] of request.headers.entries()) {
            headers[key] = value;
        }
        const buffer = await request.arrayBuffer();
        let bodyBase64 = null;
        if (buffer.byteLength > 0) {
            bodyBase64 = this.arrayBufferToBase64(buffer);
        }
        const msg = {
            type: 'http_request',
            id,
            method: request.method,
            path: subpath,
            headers,
            body: bodyBase64
        };
        return new Promise((resolve) => {
            // 30 seconds timeout
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                resolve(new Response('Gateway Timeout from session upstream', { status: 504 }));
            }, 30000);
            this.pendingRequests.set(id, { resolve, timeout });
            // Send to the first connected upstream
            upstreams[0].send(JSON.stringify(msg));
        });
    }
    async webSocketMessage(ws, message) {
        if (typeof message !== 'string')
            return;
        let msg;
        try {
            msg = JSON.parse(message);
        }
        catch {
            return;
        }
        const tags = this.state.getTags(ws);
        if (tags.includes('upstream')) {
            // 1. Resolve pending HTTP requests
            if (msg.type === 'http_response') {
                const pending = this.pendingRequests.get(msg.id);
                if (pending) {
                    clearTimeout(pending.timeout);
                    this.pendingRequests.delete(msg.id);
                    let body = msg.body ? this.base64ToArrayBuffer(msg.body) : null;
                    pending.resolve(new Response(body, {
                        status: msg.status,
                        headers: msg.headers
                    }));
                }
            }
            // 2. Route RPC response/events to consumers
            // For simplicity, broadcast to all since consumers filter by ID
            if (msg.type === 'rpc_response' || msg.type === 'event') {
                for (const consumer of this.state.getWebSockets('consumer')) {
                    consumer.send(message);
                }
            }
        }
        if (tags.includes('consumer')) {
            // Forward consumer rpc requests to upstream
            const upstreams = this.state.getWebSockets('upstream');
            if (upstreams.length > 0) {
                upstreams[0].send(message);
            }
            else {
                if (msg.type === 'rpc_request') {
                    ws.send(JSON.stringify({ type: 'rpc_response', id: msg.id, error: 'Session offline' }));
                }
            }
        }
    }
    async webSocketClose(ws, code, reason, wasClean) {
        const tags = this.state.getTags(ws);
        if (tags.includes('upstream')) {
            for (const consumer of this.state.getWebSockets('consumer')) {
                consumer.send(JSON.stringify({ type: 'session_offline' }));
            }
        }
    }
    async webSocketError(ws, error) {
        await this.webSocketClose(ws, 1006, '', false);
    }
    // Helpers
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
