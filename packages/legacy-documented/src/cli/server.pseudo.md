# cli/server.ts bootstrap-relevant pseudocode trace

Source of truth: `packages/legacy/src/cli/server.ts`

This file is large. This note focuses on the exported middleware/server setup functions used by `cli/index.ts`.

## Role

- Provides the HTTP/socket/integration server layer wrapped around a live `Client` instance.

## Main exported setup pieces

- `server.ts:23-24` — create the shared Express app and HTTP server.
- `server.ts:46-98` — `setupHttpServer(cliConfig)`
  - enforce allow-IP filtering when configured
  - optionally enable Helmet
  - choose HTTPS vs HTTP based on configured cert/key.
- `server.ts:100-105` — `setUpExpressApp()` installs robots blocking, JSON parsing, and metadata routes.
- `server.ts:107-110` — `enableCORSRequests(...)` enables CORS.
- `server.ts:112-127` — `setupAuthenticationLayer(...)` enforces API-key auth for most API routes.
- `server.ts:129-152` — `setupApiDocs(...)` serves Swagger UI.
- `server.ts:154-175` — `setupSwaggerStatsMiddleware(...)` serves Swagger statistics.
- `server.ts:178-184` — `setupRefocusDisengageMiddleware(...)` toggles keepAlive off.
- `server.ts:231+` — `setupMetaProcessMiddleware(client, cliConfig)` exposes process-control routes such as shutdown/restart.
- `server.ts:295` — `setupMediaMiddleware()` exposes local media file serving.
- `server.ts:299` — `setupTunnel(...)` provisions cloudflared tunnels.
- `server.ts:309` — `setupTwilioCompatibleWebhook(...)`
- `server.ts:355` — `setupChatwoot(...)`
- `server.ts:366` — `setupBotPressHandler(...)`
- `server.ts:437-505` — `setupSocketServer(cliConfig, client)`
  - create a socket.io server
  - optionally require API-key auth
  - let sockets register event streaming
  - dispatch arbitrary client method calls or listener registrations over the socket transport.

## Why this matters for v5

- This is where “runtime as integration host” is most visible.
- If plugins/integrations are socket-driven by default, `setupSocketServer(...)` stops being an optional add-on and becomes part of the core server substrate.

## Behavioral contract / pseudo tests

- Server setup should cleanly separate transport concerns: HTTP, HTTPS, socket, tunnel, docs, and integration middleware.
- Authentication middleware should protect operational routes without blocking explicitly public metadata/docs endpoints when configured otherwise.
- The socket server should be able to stream events and dispatch client method calls without forcing consumers to know direct in-process APIs.
- Server shutdown/restart middleware should close network surfaces and client resources in a predictable order.
- Optional integrations should compose onto the server host without redefining the core server contract.

### Observable evidence

- A consumer should be able to tell whether the server is serving HTTP, HTTPS, docs, sockets, and tunnels through explicit startup outputs or introspection endpoints.
- Auth failures and transport failures should be distinguishable from application-level client failures.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Runtime host separation by transport concern | Preserve | Important for maintainability. |
| Exact Express/socket.io middleware stack | Intentionally changed | Host stack can be replaced. |
| Socket as optional server surface | Not carried forward | Default transport should become core. |

## Inputs / outputs / side effects

- Inputs: client instance, CLI host config.
- Outputs: configured HTTP/HTTPS/socket/docs/integration host surfaces.
- Side effects: network listeners, middleware registration, tunnel processes, auth gates.

## Failure taxonomy

- TLS setup failure
- Middleware/auth setup failure
- Socket host failure
- Tunnel/integration binding failure
- Controlled shutdown failure

## Dependency contracts

- Requires: live client and resolved host config.
- Guarantees: host surfaces are composed without changing client semantics.

## State transitions

- `APP_CREATED -> TRANSPORT_CONFIGURED -> MIDDLEWARE_BOUND -> LISTENING`
- `LISTENING -> SHUTDOWN_REQUESTED -> CLOSED`
