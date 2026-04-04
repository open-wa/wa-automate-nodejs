# popup/index.ts pseudocode trace

Source of truth: `packages/legacy/src/controllers/popup/index.ts`

## Role in session bootstrap

- `initializer.ts:125-130` conditionally imports `./popup` and calls `popup(config)` when popup auth UX is enabled.
- This branch is optional, but it is the user-facing bridge between launch events and a local browser-based QR/auth page.

## popup(config) flow

- `popup/index.ts:31-49` — lazily build the Express app that serves:
  - `/` → popup HTML page
  - `/qr` → current QR image bytes
- `popup/index.ts:51-74` — subscribe to the global event bus (`ev.on('**', ...)`) and:
  - ignore session data events
  - forward launch/auth events to a connected websocket client
  - update in-memory QR placeholders when QR/auth/ready events arrive
  - automatically close the popup server once the account is ready.
- `popup/index.ts:80-110` — if a server already exists, return its URL; otherwise:
  - choose a local port
  - create HTTP server and optional socket.io server
  - publish popup port through `processSendData`
  - try to open the popup URL in Chrome/incognito when possible
  - fall back to returning the URL for manual opening.

## closeHttp()

- `popup/index.ts:113-119` — destroy open sockets and close the HTTP server.

## Why this matters for v5

- The popup flow is not a separate auth system. It is just a view over the launch event bus.
- That means a v5 migration should probably preserve the event contract first, and let popup/UI consumers sit on top of it.

## Behavioral contract / pseudo tests

- Popup auth UI should be a passive consumer of launch/auth events, not a separate source of truth.
- If popup mode is enabled, the system should expose a usable local URL or explicitly report why it could not.
- QR/auth state updates should flow through to popup clients without exposing session secrets unnecessarily.
- Popup infrastructure should shut itself down once readiness is achieved, unless explicitly designed to remain open.
- Failure to open a local browser window should not block the session from continuing.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Popup as passive auth observer | Preserve | Must not become the session source of truth. |
| Exact UI/websocket implementation | Intentionally changed | Any delivery/UI mechanism is acceptable. |

## Inputs / outputs / side effects

- Inputs: launch/auth events, popup config, QR image state.
- Outputs: local URL/websocket stream for popup consumers.
- Side effects: starts HTTP/socket server, may attempt to open browser window, updates in-memory QR state.

## Failure taxonomy

- Port/server startup failure
- QR forwarding failure
- Browser auto-open failure

## Dependency contracts

- Requires: global launch event stream.
- Guarantees: popup consumers receive launch/auth updates without owning auth logic.

## State transitions

- `POPUP_DISABLED -> NO_SERVER`
- `POPUP_ENABLED -> SERVER_READY -> QR_VISIBLE | READY -> CLOSED`
