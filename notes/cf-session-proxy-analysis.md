# Cloudflare Worker Reverse-Tunnel Session Proxy — Architecture Analysis

## TL;DR

**Yes, this is a killer idea.** The architecture you described is essentially what **traforo** already implements — and it works. The key insight that makes it cost-effective is the **WebSocket Hibernation API**, which Cloudflare specifically designed for exactly this use case. When idle, the DO is evicted from memory but the WebSocket stays connected. You pay **nothing** for idle connections.

---

## The Core Insight: WebSocket Hibernation = Free Idle Connections

Your concern about "always connected = massive charge" is solved by the Hibernation API:

| Billing Model | What Happens | Cost |
|---|---|---|
| `ws.accept()` (standard) | DO stays in memory entire time WebSocket is open | **Billed for full wall-clock duration** 💸💸💸 |
| `ctx.acceptWebSocket()` (hibernation) | DO evicts from memory when idle, WebSocket stays open at edge | **Only billed when handler runs** ✅ |

From the Cloudflare docs:
> *"Duration is billed in wall-clock time as long as the Object is active and not eligible for hibernation. Using the WebSocket Hibernation API can significantly reduce duration-related charges, especially when messages are sent infrequently."*

So a session that connects at 8am and disconnects at 11pm costs you for the **milliseconds** of actual message processing, not the 15 hours of connection time. A keepalive ping every 30s? Handled by `setWebSocketAutoResponse` at the **edge** without waking the DO at all.

---

## How Traforo Works (and why it's directly relevant)

Traforo is literally this pattern for generic HTTP tunneling:

```
┌─────────────┐     WebSocket      ┌─────────────────────┐     HTTP      ┌──────────┐
│ Local Server │ ◄── (reverse) ──► │ CF Durable Object   │ ◄─────────── │ Internet │
│ (session)    │                    │ (per tunnel ID)     │              │ (client) │
└─────────────┘                    └─────────────────────┘              └──────────┘
```

### The Flow:
1. **Local client** connects via WebSocket to the DO's `/traforo-upstream` endpoint
2. **DO** stores the WebSocket reference via `ctx.acceptWebSocket()` (hibernatable)
3. **HTTP request** comes in → DO wakes up → serializes the request into a JSON message over WebSocket → sends to local client
4. **Local client** makes the actual HTTP request to `localhost:PORT` → sends the response back over WebSocket  
5. **DO** reconstructs the Response and returns it to the original HTTP caller

### Key Protocol Messages:
```
DO → Client:  { type: "http_request", id, method, path, headers, body (base64) }
Client → DO:  { type: "http_response", id, status, headers, body (base64) }
```

Also supports streaming (`http_response_start` → `http_response_chunk`* → `http_response_end`) and WebSocket proxying.

---

## Proposed Architecture for open-wa

### What Changes vs Traforo

| Aspect | Traforo | open-wa Session Proxy |
|---|---|---|
| Tunnel identity | Random or custom `tunnelId` | `sessionId` (e.g. `session-1`) |
| Auth model | Optional password | **Access token** in env vars |
| Routing | Wildcard subdomain `{id}-tunnel.domain.com` | Path-based: `host/sessions/{id}/*` |
| Who deploys | Traforo team (shared SaaS) | **User deploys to own CF account** |
| DO per... | Per tunnel ID | Per session ID |
| Multi-session | One DO per tunnel | One DO per session, unlimited sessions |

### Architecture Diagram

```
User's Machine / VPS / Docker                    User's Cloudflare Account
┌──────────────────────────────────┐            ┌──────────────────────────────────┐
│                                  │            │                                  │
│  ┌──────────┐   ┌──────────┐    │   WSS      │  CF Worker (proxy-worker)        │
│  │ session-1 │   │ session-2 │   │ ────────► │  ├─ GET /sessions/:id/*          │
│  │ :8001     │   │ :8002     │   │            │  │  → route to DO(id)            │
│  └──────────┘   └──────────┘    │            │  │                               │
│       │              │           │            │  ├─ GET /sessions/:id/ws-upstream│
│       ▼              ▼           │            │  │  → WS upgrade to DO(id)      │
│  ┌─────────────────────────┐     │            │  │                               │
│  │  open-wa CLI             │    │            │  └─ DO: SessionTunnel            │
│  │  (manages sessions)      │    │            │     ├─ acceptWebSocket() (hibernate)│
│  │  connects each session   │    │            │     ├─ HTTP→WS relay             │
│  │  to CF via WS client     │    │            │     └─ WS→WS relay              │
│  └─────────────────────────┘     │            │                                  │
└──────────────────────────────────┘            └──────────────────────────────────┘
                                                         ▲
                                                         │ HTTPS
                                                    ┌──────────┐
                                                    │ API      │
                                                    │ Consumer │  
                                                    └──────────┘
```

### Worker Project Structure

```
packages/cf-proxy/
├── src/
│   ├── index.ts          # Worker entry: routing + auth
│   ├── tunnel-do.ts      # Durable Object: WebSocket relay
│   ├── types.ts          # Protocol message types
│   └── auth.ts           # Token validation middleware
├── wrangler.jsonc
└── package.json
```

### CLI Integration

```
packages/cli/
└── src/
    └── tunnel-client.ts   # WebSocket client that connects to CF
```

### Configuration

**Cloudflare Worker env vars:**
```
ACCESS_TOKEN=secret-token-123
```

**CLI config (`.openwarc` or env):**
```yaml
proxy:
  host: https://my-proxy.myworker.workers.dev
  token: secret-token-123
```

---

## Cost Analysis

### Cloudflare Workers Paid Plan ($5/mo)

| Resource | Free Tier | Paid Tier | Your Usage (10 sessions) |
|---|---|---|---|
| Workers requests | 100K/day | 10M/mo included | ~negligible |
| DO requests | N/A | 1M/mo included | ~negligible |
| DO duration | N/A | 400K GB-s/mo included | **~near zero with hibernation** |
| DO storage | N/A | 1 GB included | ~0 (no persistent state) |

**Estimated monthly cost for 10 sessions with moderate traffic:**
- Base: **$5/month** (Workers paid plan, required for DOs)
- DO compute: **~$0** (hibernation means you only pay for actual request relay time)
- Bandwidth: **free** (CF doesn't charge egress)

Even with 100 sessions doing 10K requests/day each, you'd stay well within included limits. The **hibernation API is the killer feature** — a session that sits idle for hours costs literally $0 in DO duration.

### Comparison with Alternatives

| Approach | Cost | Complexity | Security |
|---|---|---|---|
| **CF Worker + DO (this proposal)** | $5/mo flat | Low (deploy once) | Excellent (no ports) |
| Cloudflare Tunnel (cloudflared) | Free | Medium (per machine) | Excellent |
| ngrok | $8+/mo per tunnel | Low | Good |
| Self-hosted reverse proxy | $5-20/mo (VPS) | High (networking) | Manual |
| Current orchestrator proxy | $0 extra | Built-in | Requires port exposure |

---

## Key Design Decisions

### 1. Path-based vs Subdomain Routing

**Recommendation: Path-based** (`host/sessions/:id/...`)

- Simpler — no wildcard DNS needed
- Works on `*.workers.dev` subdomain out of the box
- Users don't need a custom domain
- Traforo uses subdomains because they're a public SaaS; you control the client

### 2. One DO per Session vs One DO for All

**Recommendation: One DO per session**

- Natural isolation — each session has its own WebSocket
- If one session crashes, others unaffected  
- Cloudflare handles the routing via `env.SESSION_TUNNEL.idFromName(sessionId)`
- No single point of failure

### 3. Message Protocol

Borrow traforo's protocol — it's battle-tested:

```typescript
// DO → Session (downstream)
type HttpRequestMessage = {
  type: 'http_request'
  id: string           // correlation ID
  method: string
  path: string
  headers: Record<string, string>
  body: string | null   // base64 encoded
}

// Session → DO (upstream)  
type HttpResponseMessage = {
  type: 'http_response'
  id: string
  status: number
  headers: Record<string, string | string[]>
  body: string | null   // base64 encoded
}
```

### 4. Keepalive Strategy

Traforo uses a 30s ping interval with `setWebSocketAutoResponse`:

```typescript
// In DO constructor:
this.ctx.setWebSocketAutoResponse(
  new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}')
)
```

This handles pings **at the Cloudflare edge** without waking the DO. The DO stays hibernated. Zero cost.

---

## How This Changes the Orchestrator

Currently:
```
Client → Orchestrator → localhost:PORT (direct proxy via fetch)
```

With CF proxy:
```
Client → CF Worker → DO → WebSocket → Session (anywhere)
         ↑ no port exposure needed
         ↑ session can be on any machine
         ↑ orchestrator doesn't need to proxy
```

### Benefits:
1. **No port exposure** — sessions never listen on a public interface
2. **Location-independent** — sessions can be on any machine, behind any NAT
3. **Load balancing is free** — just point sessions at the same CF worker
4. **Orchestrator simplified** — no more proxy middleware, port tracking, PORT_MISMATCH handling
5. **Multi-machine** — sessions across 10 servers look like one API
6. **User-deployed** — each user controls their own infra, you don't need to host anything

### What Stays in Orchestrator:
- Session lifecycle management (create/start/stop/delete)
- PM2 process management
- The CF tunnel client connection (per session)

### What Gets Removed from Orchestrator:
- `endpoints/proxy.ts` — entirely replaced by CF routing
- Port tracking / `forcePortReport()` / port mismatch logic
- The entire `proxyToSession()` flow

---

## Potential Concerns & Mitigations

### 1. Latency
- **Concern**: Extra hop through CF adds latency
- **Reality**: CF edge is ~20ms from most locations. For a WA session proxy (not a game server), this is negligible
- **Mitigation**: The DO is colocated with the session's WebSocket connection (same CF colo)

### 2. Large Payloads / Media
- **Concern**: Base64 encoding over WebSocket is inefficient for large media
- **Reality**: Traforo handles this fine. CF WebSocket messages can be up to 1MB. For larger payloads, use chunked streaming
- **Mitigation**: Use `http_response_start` + `http_response_chunk` + `http_response_end` for streaming

### 3. WebSocket Disconnections
- **Concern**: What if the tunnel WS disconnects?
- **Reality**: The client auto-reconnects (traforo does this). Requests during disconnect get a 503
- **Mitigation**: Auto-reconnect with exponential backoff. The DO knows the session is offline via `webSocketClose` handler

### 4. CF Worker Limits
- **Concern**: Request size limits, execution time
- **Reality**: Workers have 128MB memory, 30s CPU time (paid plan). More than enough
- **Mitigation**: Stream large responses rather than buffering

### 5. Debugging
- **Concern**: Hard to debug tunnel issues
- **Mitigation**: Add a `/sessions/:id/status` endpoint on the DO that returns connection state, last message time, etc.

---

## Verdict

This is an excellent architecture. It's essentially traforo but purpose-built for open-wa sessions:

1. **Fork traforo's approach** — the DO relay pattern, the message protocol, the hibernation strategy
2. **Simplify for your use case** — path-based routing, access token auth, no caching/password features
3. **Ship as a deployable package** — `npx wrangler deploy` from a template in the open-wa repo
4. **Integrate the client** — add a `TunnelClient` to `@open-wa/cli` that connects each session on startup

The discord-gateway-proxy is less relevant — it's a forward proxy (sits between client and server to multiplex connections) rather than a reverse tunnel. The multi-tenant auth model is interesting inspiration though.

> ⚠️ **One alternative worth considering**: [Cloudflare Tunnel (cloudflared)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) does this natively — but it requires installing `cloudflared` daemon and doesn't give you the same programmatic control or per-session routing. Your custom approach is simpler for end users.
