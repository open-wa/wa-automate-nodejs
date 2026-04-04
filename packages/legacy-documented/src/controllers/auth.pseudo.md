# auth.ts pseudocode trace

Source of truth: `packages/legacy/src/controllers/auth.ts`

## Role in session bootstrap

- `auth.ts:20` — `isAuthenticated(page)` races three mutually exclusive session-state detectors:
  - `needsToScan(page)`
  - `isInsideChat(page)`
  - `sessionDataInvalid(page)`
- This is the first major gate used by `initializer.ts:create(...)`.

## Auth-state probes

- `auth.ts:22-47` — `needsToScan(...)`
  - waits for a QR canvas selector to appear
  - logs the QR-element result
  - resolves `false`, meaning “not authenticated yet, QR flow is required”
- `auth.ts:49-58` — `isInsideChat(...)`
  - waits for either `window.WA_AUTHENTICATED` or the known authenticated app shells (`app`/`two`) to become tabbable
  - resolves `true`
- `auth.ts:81-98` — `sessionDataInvalid(...)`
  - waits for `localStorage.old-logout-cred`
  - when observed, returns `'NUKE'`
  - `initializer.ts` interprets this as “host account logout probably invalidated persisted session state”.
- `auth.ts:100-108` — `phoneIsOutOfReach(...)`
  - detects the “Trying to reach phone” text and returns `true`/`false`
  - used only when the auth race itself timed out.
- `auth.ts:71-79` — `waitForRipeSession(...)`
  - waits for `window.isRipeSession()`
  - gives the runtime time to fully hydrate after reauth before reinjection.

## QRManager lifecycle

- `auth.ts:110-118` — `QRManager` stores launch-session QR state: event emitter, QR count, QR hash, config, and whether the first QR was emitted.
- `auth.ts:119-133` — constructor + config wiring create or reuse a QR-specific `EvEmitter` namespace.

## QR payload collection and fan-out

- `auth.ts:135-199` — `grabAndEmit(qrData, page, config, spinner)` is the central QR/link-code distributor.
  - increments QR count
  - enforces `qrMax`
  - emits raw QR data to the internal event bus
  - optionally prints terminal QR output
  - waits for the in-page QR PNG renderer (`window.getQrPng`) to become available
  - emits PNG data to listeners
  - optionally uploads QR PNG data to `https://qr.openwa.cloud/` for the “easy QR” remote scan flow

## Link-code path

- `auth.ts:201-222` — `linkCode(...)`
  - detects TOS blocks
  - short-circuits if already authenticated
  - waits briefly if Store state is not fully ready
  - requests a link code from the page (`window.linkCode(...)`)
  - emits/logs the link code using the same QR fan-out path
  - resolves when chat UI becomes available.

## QR path

- `auth.ts:224-271` — `smartQr(...)`
  - detects TOS blocks
  - short-circuits if already authenticated
  - waits briefly for Store state if needed
  - exposes a bridge function (`_smartQr`) into Node
  - subscribes to page-side QR updates through `window.smartQr(...)`
  - if a very large QR payload appears while `multiDevice` is false, resolves with `MULTI_DEVICE_DETECTED`
  - if a success sentinel arrives, waits for authenticated chat UI and resolves `true`
  - otherwise sends every QR payload through `grabAndEmit(...)`
  - takes a screenshot on QR-launcher errors using the helper defined in `initializer.ts`.

## First-QR helpers

- `auth.ts:273-278` — `emitFirst(...)` emits the current QR only once.
- `auth.ts:280-295` — `waitFirstQr(...)` waits up to 10 seconds for the QR element to appear and then emits it.

## Why this file matters for v5

- The library does **not** treat auth as a single boolean. It models at least four materially different states:
  1. already inside chat
  2. QR/link-code required
  3. persisted session invalid (`NUKE`)
  4. phone unreachable after auth timeout
- That distinction is part of why the bootstrap feels resilient and should be preserved in the migration.

## Behavioral contract / pseudo tests

- Auth probing should distinguish at least: already authenticated, interactive auth required, persisted-session invalid, and temporary phone-unreachable states.
- Auth probing should not collapse every non-success path into the same generic failure.
- If the runtime already has a valid authenticated shell, auth detection should settle without forcing QR flow.
- If QR or link-code UI is present, the auth layer should expose that as an actionable state.
- If logout-corruption markers are detected, auth should trigger a recovery contract rather than pretending the session is healthy.
- QR management should emit enough state for both humans and integrations to react to refreshed QR/link codes.
- QR management should enforce retry/refresh limits when configured.
- QR management should not spam duplicate first-QR emissions.
- If multi-device-like payloads are detected in interactive auth, the layer should surface that session-shape fact explicitly.
- Waiting for a “ripe” session should be treated as stabilization, not as proof of authentication by itself.

### Observable evidence

- Auth state should be externally inferable from emitted events, explicit status values, or terminal errors.
- QR refreshes/link codes should be visible to integrations without relying on terminal scraping.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Multi-state auth classification | Preserve | Distinguish valid, interactive, invalid, unreachable. |
| QR/link-code transport format | Intentionally changed | Delivery format can change if observability remains. |
| MD detection as migration path | Not carried forward | v5 should assume MD baseline. |

## Inputs / outputs / side effects

- Inputs: page state, QR/link-code config, timeout policy, session markers.
- Outputs: auth classification, QR/link-code emissions, stabilization signal.
- Side effects: emits QR/link-code events, may capture screenshots, may trigger restart-worthy outcomes.

## Failure taxonomy

- QR not renderable
- Auth probe timeout
- Invalid persisted session marker detected
- Phone unreachable / offline condition
- Interactive auth transport failure

## Dependency contracts

- Requires: page selectors/runtime probes that can distinguish auth states.
- Guarantees: upstream launcher receives a stateful outcome, not a generic boolean only.
- Guarantees downstream: QR managers do not become the source of truth for final readiness.

## State transitions

- `UNKNOWN -> AUTHENTICATED`
- `UNKNOWN -> INTERACTIVE_AUTH_REQUIRED`
- `UNKNOWN -> SESSION_INVALID`
- `AUTH_TIMEOUT -> PHONE_UNREACHABLE | GENERIC_TIMEOUT`
- `INTERACTIVE_AUTH_REQUIRED -> QR_OR_LINK_EMITTED -> AUTHENTICATED | TIMEOUT | SESSION_SHAPE_SIGNAL`
