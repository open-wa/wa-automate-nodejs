# Task 1 - Replacement Transport Contract

Date: 2026-04-12
Plan: `.sisyphus/plans/socketio-removal-v5.md`
Status: frozen implementation contract for post-Socket.IO transport behavior

## 1. Purpose

This document freezes the milestone-1 replacement contract for removing Socket.IO from the active V5 runtime without changing the intended product behavior. It is implementation-facing: downstream tasks should treat the endpoint paths, payload shapes, reconnect rules, and milestone boundaries here as the source of truth.

The verified current baseline is:

- Socket.IO is created inside the shared API server when `config.socketMode` is true, alongside the Hono HTTP server and the raw `/screencast` WebSocket route (`packages/api/src/createApiServer.ts:65-85`, `packages/api/src/createApiServer.ts:185-212`, `packages/config/src/schema/config.ts:381-386`).
- Dynamic RPC dispatch currently comes from `SocketManager.registerCapabilityHandlers`, which loops over `getHttpMethodDefinitions()` and binds every invocation name to `socket.on(methodName, callback)` (`packages/api/src/socket/SocketManager.ts:31-89`).
- Global event fanout currently happens only after a client emits `register_ev`; `SocketManager` then forwards every bridged core event to that socket with `socket.emit(eventName, payload)` (`packages/api/src/socket/SocketManager.ts:37-50`).
- The active V5 runtime bridges `openwaClient.events.onAny(...)` into `SocketManager` via `server.setEventBridge(...)` in the CLI runtime (`packages/wa-automate/src/cli-runtime.ts:501-536`).
- HTTP RPC already exists today under Hono via `createApiMiddleware`, including canonical schema routes plus `POST /api/:method` and `POST /api/:namespace/:method` (`packages/api/src/createApiServer.ts:323-332`, `packages/api/src/createApiMiddleware.ts:65-197`).
- `/health` already provides session/readiness/dashboard status, QR, launch timeline, patch state, license state, and reconnection summaries without needing Socket.IO (`packages/api/src/createApiServer.ts:259-305`, `packages/api/src/health/HealthStore.ts:1-242`).

## 2. Milestone Scope Freeze

### Milestone 1: active runtime cutover

Milestone 1 is complete when the active V5 runtime no longer requires Socket.IO for command RPC or live event delivery and `/screencast` remains the only raw WebSocket endpoint.

Milestone-1 scope includes:

- `packages/api/src/createApiServer.ts`
- `packages/api/src/socket/SocketManager.ts` replacement work
- `packages/wa-automate/src/cli-runtime.ts`
- `packages/socket-client/src/SocketClient.ts` internals
- `apps/dashboard-neo/**`
- any SSE server/client glue required to preserve `SocketClient` behavior in the active runtime

### Milestone 2: repo cleanup

Milestone 2 removes repo-wide Socket.IO residue after milestone 1 stabilizes.

Milestone-2 scope includes:

- legacy packages and legacy-documented mirrors
- Node-RED integration migration
- old dashboard app cleanup/migration
- tests, docs, manifests, and dependency removals
- config/CLI cleanup for `socketMode` and `--socket`

## 3. Contract Domain A - Command RPC (`ask()` replacement)

### 3.1 Current verified behavior

- `SocketClient.ask(method, args)` currently emits a Socket.IO event named after the method and expects a callback payload shaped as `{ success, data }` or `{ success: false, error, details }` (`packages/socket-client/src/SocketClient.ts:275-305`).
- The server-side handler normalizes/validates payloads against the same schema definitions used by the HTTP API (`packages/api/src/socket/SocketManager.ts:62-89`).
- The HTTP API already returns the same success envelope on success and JSON error objects on failure (`packages/api/src/createApiMiddleware.ts:110-142`).

### 3.2 Replacement contract

Socket.IO dynamic dispatch is replaced with HTTP calls to existing Hono routes. The canonical transport contract is:

- Preferred route: schema-defined canonical route under `/api` from `getHttpMethodDefinitions()`.
- Compatibility route 1: `POST /api/:method`
- Compatibility route 2: `POST /api/:namespace/:method`

`SocketClient.ask(method, args)` MUST switch to HTTP but preserve caller-facing semantics:

1. method name remains a string
2. `args` accepts object payloads or ordered arrays/tuples
3. resolved value remains `response.data`
4. failures reject with `Error(response.error)`

### 3.3 HTTP request contract

- Method: `POST`
- Path: `/api/:method` for unnamed legacy calls; canonical route path when the method definition is known
- Headers:
  - `Content-Type: application/json`
  - `X-API-Key: <key>` when available
- Query auth fallback: `api_key` or `key` may be used only where header injection is unavailable, matching current middleware behavior (`packages/api/src/auth/api-key.ts:4-27`)
- Body:
  - object input: merge directly into JSON body
  - array input: send as `{ args: [...] }`
  - no args: `{}`

### 3.4 HTTP response contract

- Success: `{ "success": true, "data": <result> }`
- Validation failure: `{ "error": "Validation Error", "details": [...] }` with HTTP 400
- Lifecycle block: `{ "error": "API not available until the session is truly ready", "status": 503 }` with HTTP 503 (`packages/api/src/createApiMiddleware.ts:78-87`)
- Other failure: `{ "error": <message> }` with HTTP 500/404/401 as applicable

### 3.5 Compatibility requirement

The exported `SocketClient` API surface stays intact in milestone 1:

- `SocketClient.connect(...)`
- `client.ask(...)`
- proxy-based method access (`client.sendText(...)`, etc.)
- `client.listen(...)`
- `client.stopListener(...)`

This compatibility obligation is grounded in `packages/socket-client/src/SocketClient.ts:86-107`, `packages/socket-client/src/SocketClient.ts:220-239`, and `packages/socket-client/src/index.ts:1-4`.

## 4. Contract Domain B - Event streaming (`register_ev` / `socket.onAny()` replacement)

### 4.1 Current verified behavior

- `SocketClient._connected()` emits `register_ev` once connected, then mirrors every incoming socket event into local `ev` via `socket.onAny((event, value) => this.ev.emit(event, value))` (`packages/socket-client/src/SocketClient.ts:109-123`).
- `SocketManager` responds to `register_ev` by wiring the active connection to `eventBridge.onAny` and forwarding `socket.emit(eventName, payload)` for every bridged event (`packages/api/src/socket/SocketManager.ts:37-50`).
- The V5 runtime bridge currently forwards all `openwaClient.events` names, not just a hand-curated subset (`packages/wa-automate/src/cli-runtime.ts:527-536`).

### 4.2 Verified event names currently consumed through Socket.IO

The bridge is wildcard, but the currently verified active consumers use these event names:

- `message.received` (`apps/dashboard-neo/src/lib/hooks/use-message-toasts.ts:28-61`)
- `session.state.changed` (`apps/dashboard-neo/src/lib/hooks/use-health.ts:95-114`)
- `launch.auth.qr.generated` (`apps/dashboard-neo/src/lib/hooks/use-health.ts:116-130`)
- `patch.apply.after` (`apps/dashboard-neo/src/lib/hooks/use-health.ts:132-148`)
- `client.ready` (`apps/dashboard-neo/src/lib/hooks/use-health.ts:150-164`)
- `internal_launch_progress` (`apps/dashboard-neo/src/lib/hooks/use-health.ts:166-184`)
- `core.started` (`apps/dashboard-neo/src/lib/hooks/use-health.ts:186-200`)
- wildcard capture of all bridged events via `client.ev.onAny(...)` and raw transport capture via `client.socket.onAny(...)` (`apps/dashboard-neo/src/lib/hooks/use-events.ts:39-66`)
- `debug:log` is still consumed by the dashboard debug page (`apps/dashboard-neo/src/routes/debug.tsx:23-35`), but no current V5 producer was verified in this audit
- `qr` and `session:state` are still consumed by `use-session`, but no current V5 producer was verified in this audit (`apps/dashboard-neo/src/lib/hooks/use-session.ts:87-110`)

### 4.3 Event payload baselines verified from producers

- `message.received` payload shape: `{ ctx: { correlationId, ts }, message }` (`packages/core/src/transport/Transport.ts:574-584`, `apps/dashboard-neo/src/lib/hooks/use-message-toasts.ts:8-15`)
- `message.any` payload shape: `{ ctx, message }` (`packages/core/src/transport/Transport.ts:586-596`)
- `ack.changed` payload shape: `{ ctx, ack }` (`packages/core/src/transport/Transport.ts:598-608`)
- `session.state.changed` payload shape: `{ correlationId, ts, step, details: { prev, next } }` (`packages/core/src/transport/Transport.ts:610-626`)
- `group.addedToGroup` payload shape: `{ ctx, groupId, by }` (`packages/core/src/transport/Transport.ts:628-644`)
- `launch.auth.qr.generated` payload shape: `{ correlationId, ts, step, details: { qr, attemptInThisCycle } }` (`packages/core/src/transport/Transport.ts:1497-1540`)
- `launch.auth.qr.scanned` payload shape: `{ correlationId, ts, step }` (`packages/core/src/transport/Transport.ts:1553-1563`)
- `internal_launch_progress` payload shape: `{ value, text }` (`packages/core/src/transport/Transport.ts:2014-2021`)

### 4.4 Replacement contract

Wildcard Socket.IO fanout is replaced by a single Server-Sent Events stream:

- Endpoint: `GET /api/events`
- Content-Type: `text/event-stream`
- Auth:
  - preferred: `X-API-Key` when the client can set headers
  - browser fallback: `?api_key=` query support remains allowed during milestone 1

### 4.5 SSE frame contract

Each delivered event MUST use named SSE events and a normalized JSON body:

```text
id: <monotonic-event-id>
event: <runtime-event-name>
data: {"id":"<same-id>","event":"<runtime-event-name>","payload":<event-payload>,"ts":<unix-ms>,"sessionId":"<session-id>"}

```

Contract rules:

- `event:` equals the original runtime event name (for example `message.received`)
- `payload` is the original event payload without reshaping
- clients may listen by event name or consume all frames generically
- the server MUST emit periodic keepalive comments (for example `:keepalive`) so idle proxies do not silently kill the stream

### 4.6 Topic/subscription rules

Milestone 1 uses one SSE stream for both wildcard runtime events and listener-backed events.

- `GET /api/events?topics=*` means all bridged runtime events; this replaces `register_ev`
- `GET /api/events?topics=message.received,session.state.changed` allows future narrowing but is optional for milestone 1
- listener-backed events such as `onMessage` continue to arrive on the same stream after their corresponding activation RPC succeeds

No Socket.IO room model must be preserved because the current V5 implementation does not use rooms; it only attaches a per-connection wildcard forwarder on `register_ev` (`packages/api/src/socket/SocketManager.ts:37-50`).

## 5. Contract Domain C - Reconnect / re-subscribe semantics

### 5.1 Current verified behavior

- Socket.IO reconnect state currently comes from `socket.io-client` internals (`packages/socket-client/src/SocketClient.ts:206-214`).
- On reconnect, `SocketClient` re-runs `_connected()` and `_ensureListenersRegistered()`, which re-emits `register_ev` and re-issues listener activation RPCs (`packages/socket-client/src/SocketClient.ts:109-123`, `packages/socket-client/src/SocketClient.ts:242-250`).
- `TunnelSocketClient` already demonstrates the non-Socket.IO reconnection pattern the replacement should resemble: reconnect transport, then call `_ensureListenersRegistered()` (`packages/socket-client/src/TunnelSocketClient.ts:92-99`, `packages/socket-client/src/TunnelSocketClient.ts:231-236`).

### 5.2 Replacement contract

SSE reconnect semantics are:

1. browser/EventSource clients rely on automatic reconnect handled by the EventSource implementation
2. each SSE frame carries an `id`
3. reconnecting clients send `Last-Event-ID` automatically when supported
4. the server is not required to offer arbitrary historical replay in milestone 1
5. instead, reconnect recovery is snapshot-first: clients must re-fetch `/health` after reconnect and then continue streaming new events

### 5.3 Listener re-subscription rules

Because current `SocketClient.listen(...)` assumes listener registrations may be lost on disconnect, that contract stays in place for milestone 1:

- the client MUST retain its requested listener names locally
- after SSE reconnect/open, the client MUST re-issue activation RPCs for every registered simple listener (`onMessage`, `onAnyMessage`, etc.)
- wildcard runtime streaming (`topics=*`) does not require separate re-registration beyond re-opening `/api/events`

### 5.4 Failure-state contract

- loss of the SSE stream does not imply the session died
- transport-down and session-down are separate states
- after reconnect/open, the client MUST treat `/health` as the source of truth for current session status

## 6. Contract Domain D - Dashboard connection state without socket lifecycle events

### 6.1 Current verified behavior

Dashboard Neo currently mixes transport lifecycle and session lifecycle:

- `useSocket` drives `connected` from `client.socket` `connect` / `disconnect` / `connect_error` (`apps/dashboard-neo/src/lib/hooks/use-socket.ts:22-47`)
- `useHealth` derives readiness and QR state from event names plus `/health` polling (`apps/dashboard-neo/src/lib/hooks/use-health.ts:89-307`)
- `useSession` also listens to `disconnect`/`connect` plus two legacy `ev` event names that are not currently verified producers (`apps/dashboard-neo/src/lib/hooks/use-session.ts:61-110`)

### 6.2 Replacement contract

Dashboard state is split into two separate concepts:

1. `transportConnected`
   - source: SSE/EventSource `open` and `error` state plus command-RPC fetch failures
   - replaces raw socket lifecycle events
2. `sessionConnected` / readiness / QR / launch state
   - source: `/health` snapshot plus SSE runtime events

### 6.3 Required state flow

- initial page load:
  1. fetch `/health`
  2. open `GET /api/events?topics=*`
  3. mark transport connected only after the SSE stream successfully opens
- on SSE event:
  - apply event-specific local updates for `session.state.changed`, `launch.auth.qr.generated`, `patch.apply.after`, `internal_launch_progress`, `client.ready`, `core.started`
- on SSE error/retry:
  - mark transport disconnected/degraded
  - do not force session state to `DISCONNECTED`
  - re-fetch `/health` once the stream re-opens
- on command RPC failure:
  - expose the failure as a command error, not as a fake session disconnect unless `/health` also reports the session disconnected

### 6.4 Dashboard-specific compatibility rules

- `useEvents` keeps wildcard event visibility; it should consume the named SSE stream instead of `client.ev.onAny(...)` + raw `socket.onAny(...)`
- `useMessageToasts` must continue to receive `message.received`
- `useHealth` continues to use `/health` as the durable snapshot authority
- `useSession` must stop depending on unverified legacy event names `qr` and `session:state` and instead align with `/health` + dotted runtime events

## 7. Contract Domain E - `/screencast` isolation

### 7.1 Current verified behavior

- `/screencast` is already a dedicated Hono WebSocket route registered before Socket.IO setup (`packages/api/src/createApiServer.ts:65-85`).
- the server currently contains a special upgrade-path exclusion so Hono does not process `/socket.io/` upgrades (`packages/api/src/createApiServer.ts:185-199`).

### 7.2 Replacement contract

After milestone 1:

- `/screencast` remains a raw WebSocket endpoint
- it remains owned exclusively by `@open-wa/screencaster/server`
- no command RPC or event streaming traffic may share the `/screencast` transport
- there is no replacement `/socket.io/` path in the active runtime
- the HTTP server must not install any secondary upgrade consumer except the screencast WebSocket path(s) explicitly owned by Hono

Operational reading: command RPC becomes pure HTTP, event fanout becomes pure SSE, `/screencast` stays the only live WebSocket surface.

## 8. Consumer classification

### 8.1 `runtime-blocker`

These must be migrated before Socket.IO can be deleted from the active V5 runtime.

| Consumer | Why it blocks runtime deletion | Verified references |
| --- | --- | --- |
| API server Socket.IO wiring | It instantiates `SocketIOServer` on the shared HTTP server and is the direct source of the `/socket.io/` upgrade coexistence problem. | `packages/api/src/createApiServer.ts:180-212` |
| SocketManager | It currently owns both dynamic Socket.IO RPC dispatch and `register_ev` event fanout. | `packages/api/src/socket/SocketManager.ts:31-94` |
| CLI runtime bridge | It forces `socketMode: true` in runtime defaults and wires `openwaClient.events` into the socket manager. | `packages/wa-automate/src/cli-runtime.ts:440-445`, `packages/wa-automate/src/cli-runtime.ts:525-536` |
| Dashboard Neo client bootstrap | The active dashboard creates/uses `SocketClient.connect(...)` as its live transport. | `apps/dashboard-neo/src/lib/api-client.ts:15-46` |
| Dashboard Neo transport hook | Connection state is currently derived from raw socket lifecycle events. | `apps/dashboard-neo/src/lib/hooks/use-socket.ts:22-47` |
| Dashboard Neo live events page | Wildcard event capture currently depends on `client.ev.onAny(...)` and raw socket `onAny(...)`. | `apps/dashboard-neo/src/lib/hooks/use-events.ts:35-66` |
| Dashboard Neo health/live readiness UI | It consumes real-time Socket.IO event names for health transitions. | `apps/dashboard-neo/src/lib/hooks/use-health.ts:89-205` |
| Dashboard Neo message toasts | It listens directly for `message.received` on the socket transport. | `apps/dashboard-neo/src/lib/hooks/use-message-toasts.ts:28-61` |
| Dashboard Neo session hook | It still binds socket lifecycle events and stale compatibility event names. | `apps/dashboard-neo/src/lib/hooks/use-session.ts:61-110` |

### 8.2 `compatibility-surface`

These represent external/public API shapes that must be preserved during milestone 1 even if the internals change.

| Surface | Compatibility promise | Verified references |
| --- | --- | --- |
| `@open-wa/socket-client` exports | `SocketClient`, `TunnelSocketClient`, collectors, and the package entrypoint stay exported. | `packages/socket-client/src/index.ts:1-4` |
| `SocketClient` call shape | Preserve `connect`, `ask`, proxy method access, `listen`, `stopListener`, `disconnect`, `reconnect`, and `killSession`. | `packages/socket-client/src/SocketClient.ts:62-342` |
| Proxy-based `ask()` mental model | Dynamic method access must still feel like `client.sendText(...)` even if it becomes HTTP-backed. | `packages/socket-client/src/SocketClient.ts:220-239`, `packages/core/src/createClient.ts:109-161` |
| Node-RED type references to `SocketClient` | Public integration types currently import `SocketClient`; consumers should not see a package-level breaking export removal in milestone 1. | `integrations/node-red/src/nodes/shared/types.ts:1-12` |

### 8.3 `cleanup-only`

These can move after the active runtime no longer depends on Socket.IO.

| Consumer | Why cleanup-only | Verified references |
| --- | --- | --- |
| Node-RED runtime nodes | Important integration surface, but explicitly scoped as secondary cleanup rather than milestone-1 blocker. | `integrations/node-red/src/nodes/owa-server/owa-server.ts:19-45`, `integrations/node-red/src/nodes/listen/listen.ts:21-77`, `integrations/node-red/src/nodes/cmd/cmd.ts:42-100` |
| Old dashboard app (`apps/dashboard`) | Uses direct `socket.io-client`, but it is not part of the active V5 runtime cutover path. | `apps/dashboard/src/lib/api-client.ts:1-33`, `apps/dashboard/src/routes/events.tsx:17-29` |
| Socket.IO-specific tests | These validate current Socket.IO behavior and can be replaced after the active transport cutover lands. | `packages/wa-automate/test/server-test.ts:32-62`, `packages/socket-client/test/SocketClient.test.ts:11-80`, `packages/socket-client/test/index.js:1-9`, `packages/socket-client/test/longrunning.js:1-28` |
| Legacy runtime/server packages | They still contain historical Socket.IO implementations and Node-RED init events, but they are not the active V5 runtime. | `packages/legacy/src/cli/server.ts:438-470`, `packages/legacy-documented/src/cli/server.ts:438-470` |
| Docs and guides that teach `--socket` / SocketClient over Socket.IO | Repo hygiene and messaging cleanup, not a runtime gate. | `packages/socket-client/README.md:1-35`, `docs/SOCKET_CLIENT_CONNECTION_GUIDE.md`, `docs/docs/get-started/socketmode.md` |
| `socketMode` config and `--socket` CLI affordance removal | Necessary cleanup, but should follow the replacement transport landing first. | `packages/config/src/schema/config.ts:381-386`, `packages/wa-automate/src/cli-runtime.ts:272`, `packages/legacy/src/cli/cli-options.ts:206` |

## 9. Implementation guardrails

- Do not preserve `/socket.io/` as a hidden fallback in milestone 1.
- Do not reshape existing runtime event payloads merely to fit SSE.
- Do not equate transport reconnect with session reconnect.
- Do not make `/screencast` share its WebSocket stack with command/event traffic again.
- Do preserve the public `SocketClient` API shape while internals migrate.

## 10. Downstream task implications

- Task 2 should implement the SSE server and event envelope exactly as defined here.
- Task 3 should rework `SocketClient` internals to HTTP + SSE while preserving the exported API contract.
- Dashboard migration tasks should treat `/health` as the durable session snapshot and SSE as the live delta stream.
- Repo cleanup tasks must not delete compatibility surfaces until milestone-1 runtime blockers are gone.
