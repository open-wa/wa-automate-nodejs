# Replacing Legacy CLI UX with Ink and Pastel (V5)

This document formalizes the architectural blueprint for replacing the legacy v4 Open-WA CLI (which relied on `meow`, `Spinnies`, `CFonts`, and `boxen`) with a modern, dynamic, React-driven CLI powered by [Ink](https://github.com/vadimdemedes/ink) and [Pastel](https://github.com/vadimdemedes/pastel).

It integrates fixes for the critical vulnerabilities identified during our Red Team analysis, ensuring that the CLI is beautiful for local developers while remaining bulletproof for production PM2/Docker headless deployments.

## User Review Required

> [!CAUTION]
> Integrating `Ink` inherently shifts CLI rendering to ANSI differential updates via standard output (`stdout`). We must strictly intercept core engine logs to prevent terminal layout tearing, while gracefully degrading to standard streaming text formats in headless environments like Docker and PM2.

## 1. Architectural Imperative: Decoupling Visualization from the Core Event Engine

### The Legacy Problem (v4)
In the v4 architecture, the [`Spin` class](file:///Users/Mohammed/projects/tools/wa%20copy/src/controllers/events.ts) acted as a tightly-coupled monolith:
1.  **UI Updates:** Manipulated terminal frames via `Spinnies`.
2.  **Event Emitting:** Programmatically fired global hooks directly through `EvEmitter`.
3.  **Logging:** Synced outputs directly to `winston` logs.

Because this UI class lived intimately within `src/controllers`, headless deployments dragged along terminal visual dependencies. If the event loop blocked during heavy crypto decryption sequences, the terminal spinner froze completely because UI rendering and Core logic competed for the main thread.

### The Modern Solution (v5)
In the new v5 monorepo, we enforce a strict **Producer-Consumer boundary**:
*   **Producer (Core Engine):** `@open-wa/core` will have zero knowledge of terminal UI. It strictly emits data-rich lifecycle events through its native internal Event Bus (`packages/hyperemitter` / `packages/core/events`).
*   **Consumer (CLI React App):** `@open-wa/cli` will map those asynchronous Core events to a React State definition (`useState`/`useReducer`). Ink components will subscribe to that local state to render beautiful, non-blocking visual feedback.

> [!TIP]
> By forcing Ink components to only subscribe to mapped states rather than heavy processing duties, we mitigate Event Loop CPU starvation and keep the UI butter-smooth.

## 2. Replacing the Tooling & Legacy Dependencies

| Legacy V4 Concept | V5 Architecture Component |
| :--- | :--- |
| `command-line-usage` / `meow` |  **Pastel** & **Zod** (Command routing and schema-based parsing) |
| `CFonts` | `<Gradient name="pastel">` wrapping `<BigText>` (Ink Components) |
| `Spinnies` / `Spin` Class | Ink state-driven `<TaskOrchestrator />` UI component subscribing to `core` events |
| `boxen` | Native `<Box borderStyle="round" borderColor="cyan">` in Ink |

## 3. Resolving Configuration Priority Fallbacks

Our Red Team analysis uncovered a risk in blindly adopting Pastel's Zod parsers for configuration: Pastel does not natively understand the complex fallback matrix (e.g., Environment Variable overrides -> `cli.config.json` -> CLI Flags) seen in the [legacy `setup.ts`](file:///Users/Mohammed/projects/tools/wa%20copy/src/cli/setup.ts).

However, the v5 monorepo already features a dedicated Configuration Ingester inside `packages/config` (handling `loader.ts`, `env.ts`, `merge.ts`).

**Implementation Protocol:**
1.  **Bypass Pure Pastel Only as a Merge Engine:** We will still use Zod as a first-pass validator, but only for source-local inputs. Config files should validate at the file boundary, and CLI flags should validate against a deliberately narrow CLI schema before they are mapped into `@open-wa/config`.
2.  **Honor Existing Precedence Ownership:** Pastel/Zod must not attempt to re-implement precedence resolution. `@open-wa/config` already owns the real merge order in `packages/config/src/merge.ts` and environment parsing derived from schema in `packages/config/src/env.ts`, so those layers remain the single merge authority.
3.  **Hydration with Realistic Boundaries:** Parsed CLI flags will be translated into `PartialConfig` overrides and handed to `resolveConfig`. We must not describe `define-config.ts` as a validator, because `packages/config/src/define-config.ts` only returns config input and does not validate it. The resolved, final configuration object will then be supplied into the React Context (`<ConfigProvider>`) for the Ink app to use system-wide.

## 4. Mitigating Terminal Tearing and Output Contamination

Traditional `console.log` and raw `winston` writes from deeper plugins will instantly shatter the interactive Ink layout, rendering duplicate rows of garbage frames.

### Reality Check: The Current Output Boundary Is Not Singular

`packages/cli/src/bin.ts` is not yet a true output boundary. It still performs direct `console.log` / `console.error` writes, while `packages/wa-automate/src/cli-runtime.ts` prints startup summaries, QR output, compatibility warnings, PM2 failures, and readiness messages directly to console. `packages/wa-automate/src/server/lifecycle-manager.ts` also logs directly during API lifecycle transitions. Therefore, a single guard at `bin.ts` is insufficient; output brokering has to cover every active writer path before Ink can be considered safe.

**Concrete writer paths that currently bypass any broker (audited from `cli-runtime.ts`):**
*   `renderTerminalQr()` — calls `qrcode.generate()` → `console.log(boxen(...))` directly to stdout.
*   `printStartupSummary()` — 12+ `console.log` / `console.warn` calls for session info, API explorer URLs, browser executable resolution, dashboard, and webhook warnings.
*   `unsupportedWarnings.forEach(w => console.warn(...))` — compatibility warnings printed inline during `start()`.
*   `resolveExecutablePath()` — emits a `console.warn` when Chrome resolution fails.
*   `start()` — `console.log('Starting WhatsApp Client...')` and `console.log(`WhatsApp Client ready...`)` lines.
*   `main()` — `console.error('pm2 not found...')` in the PM2 error path.
*   `packages/cli/src/bin.ts` — `console.log('[CLI] Starting TunnelClient...')` and `console.error('Fatal error:...')`.

**Implementation Protocol:**
1.  **Headless Fallback (Strict Interactive Predicate):** Ink should boot only when the process is truly interactive: `stdin`, `stdout`, and `stderr` are all TTYs, `TERM` is not `dumb`, and no explicit non-interactive override is present (for example `CI`, `NO_COLOR`, or a dedicated `OPEN_WA_NON_INTERACTIVE=1` style switch). `PM2_HOME` alone is not a reliable signal because it can exist in shells that are still interactive, and PM2-like supervisors can also omit it.
2.  **Multi-Boundary Output Brokering:** The redirection layer must sit above every writer path enumerated above, not just `console.log`. That includes `console.warn`, `console.error`, logger transports, QR rendering paths (`qrcode-terminal` + `boxen`), startup summaries, readiness banners, and any direct writes to `process.stdout` / `process.stderr`. Ink mode is only safe once all of those flows are brokered through one output service.
3.  **Bounded Log Buffering:** Winston and console redirection in Ink mode should route into a bounded ring buffer rather than an unbounded in-memory array. The Ink log pane must have a hard cap so verbose sessions or runaway emitters cannot grow memory indefinitely.
4.  **The `<LogStream />` Component:** We will render a safe, scrolling Ink `<Static>` or equivalent bottom-mounted log region. This safely mounts diagnostic text streams out-of-bounds of the active visual rendering matrix, ensuring layout diffs remain uncorrupted while still allowing degraded plain-text mode when Ink is disabled.

### Event Projection Safety

The current `HyperEmitter` implementation in `packages/hyperemitter/src/core/HyperEmitter.ts` uses synchronous `emit()` dispatch. While `.on()` returns `this` for chaining, it does **not** return a disposable unsubscribe handle — the caller must retain the original handler function reference and explicitly call `.off(event, handler)` to unsubscribe. Meanwhile, `packages/core/src/transport/Transport.ts` emits high-frequency events such as `message.received`, `message.any`, and `ack.changed`. We must therefore not wire raw HyperEmitter streams directly into React `setState` calls.

> [!WARNING]
> `HyperEmitter.emit()` is fully synchronous and invokes all matched listeners inline before returning. If an Ink component calls `setState` from a listener, React will attempt to reconcile in the same tick. Under burst conditions (e.g., rapid `ack.changed` events during message sync), this can cause excessive re-renders. The projection store pattern below is not optional — it is the primary defense against render starvation.

**Implementation Protocol:**
1.  **Use an External Projection Store:** Sink transport events into a bounded external store or ring buffer first, not directly into React component state.
2.  **Coalesce and Sample:** High-volume events must be sampled, coalesced, or reduced into derived view state before React sees them, so render cadence stays decoupled from transport event cadence. A practical approach is `requestAnimationFrame`-gated snapshots or a configurable debounce window (e.g., 100ms).
3.  **Derive UI State, Do Not Mirror the Bus:** Ink components should consume derived summaries (boot phase, QR state, readiness, recent logs, compact counters) rather than a one-to-one replay of the raw event stream.
4.  **Require Explicit Cleanup:** Because `.on()` does not return a disposable handle, every subscription must retain the original handler function reference and call `off(event, handler)` explicitly on unmount or mode transition. A `useHyperEmitter(emitter, event, handler)` hook that manages this lifecycle is strongly recommended.

## 5. Responsive QR Code Viewport Constraints

QR Codes represent rigid spatial matrices. If the terminal width is narrower than the QR string requirements, column wrapping destroys the scannability.

**Implementation Protocol:**
*   Utilize Ink's `useStdout()` hook to monitor dimensions dynamically.
*   If the calculated matrix width exceeds `stdout.columns`, the `<QrCodeDisplay />` component must gracefully degrade. It will emit a yellow `<Text>` warning stating "Terminal window too small to render QR Code visually. Please expand." and fallback to rendering the raw authentication URI for external handling.

## 6. Teardown, Version, and Interactivity Constraints

**Staged Teardown over Immediate Kill:** If a user hits `Ctrl+C` (SIGINT) or the process receives a termination signal (SIGTERM), the CLI must trap it and enter a staged shutdown. The first signal should freeze the UI, stop accepting new work, and begin orderly teardown in this order:
1.  `server.stop()` — stop accepting new HTTP/WebSocket connections.
2.  `TunnelClient.disconnect()` — close the reverse-proxy tunnel if active (see `packages/cli/src/tunnel-client.ts`).
3.  `client.stop()` — orderly client facade shutdown.
4.  Transport teardown — `page.close()` then `browser.close()` through the driver interface.

If graceful shutdown exceeds a timeout budget (recommended: 10s), only then should we escalate to force-kill browser resources. A second signal may force immediate termination. This is especially important because the current transport shutdown path closes gracefully with `page.close()` followed by `browser.close()`, and hard interruption around a persistent `userDataDir` can leave Chromium profile locks (`Default/Preferences`, `Default/Lock`) or corrupt preference data that requires manual cleanup before the next boot.

**Zero External Notifier Dependencies:** We will **not** rely on legacy bloat like `update-notifier`. If we maintain version checking functionality, the CLI will query the NPM registry JSON natively via `fetch`.

**Strictly Non-Interactive Output:** The initial scaffolding of the CLI will focus strictly on output visualization. The UI will render beautifully (spinners, statuses, and logs), but it will **not** prompt the user with interactive questions (e.g., "Do you want to continue? [Y/n]").

## 6.1 Prerequisites: Known Bugs to Fix Before Ink Migration

> [!IMPORTANT]
> The following bugs in `packages/wa-automate/src/cli-runtime.ts` must be fixed before or during Phase 1. They are not Ink-related but will cause failures in any testing of the CLI path.

1.  **Hardcoded PM2 `cliPath` (line 399):** `const cliPath = '/Users/Mohammed/projects/tools/wa/packages/wa-automate/dist/cli.cjs'` is an absolute local development path. This must be resolved dynamically via `path.resolve(__dirname, '..', 'dist', 'cli.cjs')` or equivalent, or the PM2 code path will fail on any other machine.
2.  **Fire-and-forget Promise in PM2 path (lines 393-396):** `new Promise<void>((resolve, reject) => { ... })` is created but never awaited or assigned. The `pm2.on('error', reject)` rejection has no handler, causing an unhandled promise rejection.
3.  **Dead filter logic (line 408):** `pm2Flags.filter((x: string) => !pm2Flags.includes(x))` always returns an empty array because every element of `pm2Flags` is trivially included in `pm2Flags`. This was likely meant to filter out PM2-specific flags from the forwarded args.

## 6.2 Implementation Runbook

This section is a delivery runbook, not a code drop. The goal is to make the first implementation pass predictable and package-local.

1.  **Establish the CLI entry boundary in `packages/cli`:** Keep `packages/cli/src/bin.ts` as the process bootstrap, but move environment and mode decisions into a dedicated detector module such as `packages/cli/src/runtime/output-mode.ts`. That detector should own the strict interactive predicate (`stdin`/`stdout`/`stderr` TTY, `TERM !== dumb`, explicit non-interactive overrides) and return a small mode contract consumed by the rest of the CLI bootstrap.
2.  **Introduce a brokered output service in `packages/cli`:** Add a module such as `packages/cli/src/runtime/output-broker.ts` that can intercept `console.log`, `console.warn`, `console.error`, and guarded direct stream writes while Ink mode is active. `bin.ts` should install and remove this broker, but the broker itself should remain package-local and framework-agnostic so the same service can front raw text mode.
3.  **Normalize legacy writers in `packages/wa-automate`:** Route the seven concrete writer paths enumerated in Section 4 through a broker-compatible sink contract rather than direct console calls. The plan should assume a narrow adapter such as `packages/wa-automate/src/cli/output-sink.ts` or equivalent, so startup summaries, QR rendering (`renderTerminalQr`), lifecycle notices, and readiness messages can be redirected without rewriting unrelated runtime logic.
4.  **Create a bounded projection store for event cadence isolation:** Add a module such as `packages/cli/src/state/event-projection-store.ts` implementing a ring buffer plus coalesced derived state. It should consume high-volume runtime and transport events, reduce them into UI-safe summaries, and expose snapshot reads for Ink without mirroring the raw bus. Include a `useHyperEmitter(emitter, event, handler)` hook that automates handler retention and `off()` cleanup.
5.  **Add an Ink presenter layer instead of mixing UI into runtime glue:** Introduce presentational modules under a boundary like `packages/cli/src/ui/` or `packages/cli/src/presenter/`, for example `app.tsx`, `log-stream.tsx`, `boot-sequence.tsx`, and `qr-code-display.tsx`. These components should depend on derived view models from the projection store and output broker, not on raw `HyperEmitter` subscriptions.
6.  **Add a signal and shutdown controller at the CLI boundary:** Create a coordinator such as `packages/cli/src/runtime/shutdown-controller.ts` that owns first-signal freeze, teardown timeout budget (10s default), second-signal force exit, and cleanup of brokered writers. `bin.ts` should wire process signals into this controller, while `packages/wa-automate` should expose orderly stop hooks (`server.stop()`, `client.stop()`) rather than owning signal policy itself.
7.  **Preserve source-local validation ownership in `packages/config`:** Keep CLI flag parsing narrow and source-local (note: `parseCliArgs()` already produces a `PartialConfig` in `cli-runtime.ts`), then hand the resulting overrides to `@open-wa/config` via `resolveConfig()`. Any new CLI-side validator should live in `packages/cli/src/config/cli-flags-schema.ts` or similar and defer merge/precedence to `packages/config/src/merge.ts`, `env.ts`, and related existing config entry points.
8.  **Stage the implementation by blast radius:** First land the output mode detector and broker with plain-text fallback still intact, then land projection store plus Ink presenters, and only then move direct writers in `wa-automate` behind the sink abstraction. This sequencing keeps non-interactive behavior working while the interactive path matures.

### Phase Checklist and Ship Gates

The migration should ship in practical phases with explicit gates. The language below is intentional:

*   **Merge blocker:** do not merge the phase branch or PR until this is resolved.
*   **Release blocker:** the code may merge behind an incomplete interactive path, but it must not ship as the default released CLI experience until this is resolved.
*   **Acceptable deferred follow-up:** a non-critical improvement that can land in a follow-up PR without invalidating the phase outcome, provided it is documented and does not weaken the automated or manual gates below.

#### Phase 1: Safe boundary and non-interactive parity

**Scope / objective:** Establish a trustworthy CLI boundary in `packages/cli` so the process can distinguish interactive vs non-interactive environments without regressing existing plain-text behavior.

**Concrete deliverables:**
*   `packages/cli/src/runtime/output-mode.ts` owns the strict interactive predicate and mode contract described above.
*   `packages/cli/src/bin.ts` is reduced to process bootstrap plus wiring into the mode detector rather than ad hoc environment checks.
*   `packages/cli/src/config/cli-flags-schema.ts` or equivalent narrow CLI schema exists only for source-local validation before handing overrides to `@open-wa/config`.
*   No precedence logic moves out of `packages/config/src/merge.ts`, `packages/config/src/env.ts`, or related existing config entry points.

**Automated gate criteria:**
*   `packages/cli/src/__tests__/output-mode.test.ts` covers TTY vs non-TTY, `TERM=dumb`, explicit non-interactive override, and interactive happy-path decisions.
*   `packages/config/src/__tests__/precedence.test.ts` proves CLI overrides still preserve the existing precedence chain after `resolveConfig`.
*   `packages/config/src/__tests__/define-config.test.ts` proves `define-config.ts` remains a shape helper rather than becoming the new validation or precedence owner.
*   Commands expected green for this phase: `pnpm --filter @open-wa/cli test`, `pnpm --filter @open-wa/config test -- src/__tests__/precedence.test.ts`, and `pnpm --filter @open-wa/config test -- src/__tests__/define-config.test.ts`.

**Manual signoff criteria:**
*   Run the built CLI in a normal TTY and verify the mode contract selects the interactive path only when the terminal is genuinely interactive.
*   Run `node packages/cli/dist/bin.cjs --help | cat` and `TERM=dumb node packages/cli/dist/bin.cjs --help` (or the eventual safe placeholder command) and confirm the CLI stays plain-text with no ANSI diff rendering.
*   Confirm current non-interactive summaries and errors remain readable and complete.

**Explicit merge blocker / no-ship condition:**
*   **Merge blocker:** any scenario where a non-TTY, `TERM=dumb`, or explicit non-interactive override still selects Ink mode.
*   **Release blocker:** any precedence regression where CLI parsing changes the established ownership of `@open-wa/config`.
*   **Acceptable deferred follow-up:** tightening developer ergonomics around mode debug output, provided behavior is already covered by tests.

#### Phase 2: Output brokering and sink normalization

**Scope / objective:** Make Ink-safe output possible by brokering every active writer path and normalizing `wa-automate` runtime output behind a sink contract.

**Concrete deliverables:**
*   `packages/cli/src/runtime/output-broker.ts` intercepts `console.log`, `console.warn`, `console.error`, and guarded direct stream writes while Ink mode is active.
*   `packages/cli/src/bin.ts` installs and removes the broker without turning itself into the logging implementation.
*   `packages/wa-automate/src/cli/output-sink.ts` or equivalent narrow sink contract exists and is used by `packages/wa-automate/src/cli-runtime.ts` and `packages/wa-automate/src/server/lifecycle-manager.ts` for startup summaries, QR output, lifecycle notices, compatibility warnings, and readiness messages.
*   Brokered output remains usable in plain-text mode rather than becoming Ink-only plumbing.

**Automated gate criteria:**
*   `packages/cli/src/__tests__/output-broker.test.ts` verifies interception, pass-through in plain-text mode, bounded retention behavior if buffering is introduced here, and cleanup restoring original console behavior.
*   `packages/wa-automate/src/__tests__/cli-runtime.test.ts` verifies startup, QR, and readiness paths route through the sink abstraction rather than direct console assumptions.
*   Commands expected green for this phase: `pnpm --filter @open-wa/cli test` and `pnpm --filter @open-wa/wa-automate test -- src/__tests__/cli-runtime.test.ts`.

**Manual signoff criteria:**
*   In an interactive local terminal, force or simulate runtime log emission from `@open-wa/wa-automate` and verify the output is absorbed by the broker path without tearing the UI.
*   In a headless or piped environment, confirm the same notices still appear as plain text and remain readable.
*   Under a PM2-managed smoke run, inspect logs and confirm there are no ANSI differential fragments or duplicated layout rows.

**Explicit merge blocker / no-ship condition:**
*   **Merge blocker:** any known direct writer path in `bin.ts`, `cli-runtime.ts`, or `lifecycle-manager.ts` still bypasses the broker or sink contract in interactive mode.
*   **Release blocker:** PM2-style logs still show Ink frame contamination, duplicated QR output, or garbled readiness banners.
*   **Acceptable deferred follow-up:** additional sink adapters for low-priority notices outside the documented active writer paths, as long as the main startup, QR, lifecycle, and readiness flows are normalized.

#### Phase 3: Event projection store and Ink presenter wiring

**Scope / objective:** Wire the interactive UI through a bounded projection layer so Ink consumes derived state instead of raw synchronous bus traffic.

**Concrete deliverables:**
*   `packages/cli/src/state/event-projection-store.ts` implements the bounded ring buffer and coalesced derived state promised in the plan.
*   Presenter modules under `packages/cli/src/ui/` or `packages/cli/src/presenter/` exist for `app.tsx`, `log-stream.tsx`, `boot-sequence.tsx`, and `qr-code-display.tsx` or close equivalents.
*   Ink components consume brokered logs and projection snapshots rather than subscribing directly to `HyperEmitter` from render code.
*   Subscription cleanup is explicit, retaining handler references and calling `off(event, handler)` on unmount or mode transition.

**Automated gate criteria:**
*   `packages/cli/src/__tests__/event-projection-store.test.ts` verifies bounded retention, burst-load coalescing, snapshot stability, and eviction behavior.
*   `packages/core/test/unit/runtimeEventBridge.test.ts` or adjacent bridge coverage documents the cadence assumptions that the projection store must tolerate.
*   `pnpm --filter @open-wa/cli test` and `pnpm --filter @open-wa/core test -- test/unit/runtimeEventBridge.test.ts` pass for this phase.

**Manual signoff criteria:**
*   In a normal TTY, verify the Ink boot sequence, log region, QR rendering, and readiness transition remain visually stable under ordinary startup activity.
*   Resize the terminal during QR rendering and confirm the UI degrades to the warning plus raw authentication URI instead of emitting a wrapped, unreadable matrix.
*   Trigger bursty runtime output and confirm the UI updates remain smooth and informative rather than trying to replay the raw bus event-for-event.

**Explicit merge blocker / no-ship condition:**
*   **Merge blocker:** any presenter component subscribes directly to raw `HyperEmitter` traffic or mirrors high-volume events one-to-one into React state.
*   **Release blocker:** the interactive UI exhibits obvious tearing, runaway memory growth, or QR rendering that becomes unreadable in narrow terminals.
*   **Acceptable deferred follow-up:** refinement of derived counters or cosmetic presenter layout details, provided the bounded store and QR degradation behavior are already correct.

#### Phase 4: Signal handling, teardown hardening, and release readiness

**Scope / objective:** Finish the migration with a controlled shutdown path, workspace-level confidence, and explicit release signoff around interactive vs headless behavior.

**Concrete deliverables:**
*   `packages/cli/src/runtime/shutdown-controller.ts` owns first-signal freeze, teardown timeout budget, second-signal force exit, and broker cleanup ordering.
*   `packages/cli/src/bin.ts` wires process signals into the shutdown controller rather than owning shutdown policy inline.
*   `packages/wa-automate` exposes orderly stop hooks for `server.stop()`, `TunnelClient.disconnect()`, `client.stop()`, and related runtime cleanup instead of absorbing signal policy itself.
*   The final smoke commands in this document are executable against the built CLI entry point once the migration lands.

**Automated gate criteria:**
*   `packages/cli/src/__tests__/shutdown-controller.test.ts` verifies first-signal graceful shutdown, timeout escalation, second-signal force behavior, and broker cleanup ordering.
*   All documented workspace gates pass: `pnpm test`, `pnpm typecheck`, and `pnpm lint`.
*   Phase-specific targeted commands remain green: `pnpm --filter @open-wa/cli test`, `pnpm --filter @open-wa/wa-automate test -- src/__tests__/cli-runtime.test.ts`, `pnpm --filter @open-wa/config test -- src/__tests__/precedence.test.ts`, `pnpm --filter @open-wa/config test -- src/__tests__/define-config.test.ts`, and `pnpm --filter @open-wa/core test -- test/unit/runtimeEventBridge.test.ts`.

**Manual signoff criteria:**
*   Exercise repeated `SIGINT` and `SIGTERM` using the documented smoke commands and verify staged shutdown first, escalation second, and clean process exit behavior.
*   Confirm the interactive local terminal path, piped output path, `TERM=dumb` path, and PM2-managed path all behave according to the intended mode contract.
*   Confirm there is no obvious profile-lock or corrupted-state fallout after interrupted teardown in the supported shutdown paths.

**Explicit merge blocker / no-ship condition:**
*   **Merge blocker:** first-signal shutdown is not orderly, or broker cleanup can leave the process in a partially hijacked console state.
*   **Release blocker:** repeated signal handling, PM2-managed runs, or non-interactive fallbacks remain unreliable or produce output contamination in the documented smoke matrix.
*   **Acceptable deferred follow-up:** adding convenience wrapper scripts such as `test:cli-ui`, `test:output`, `test:signals`, or `test:runtime-events`, since the document already marks them as proposed later rather than required for first release.

#### Final Checklists

**Ready to Merge**
*   The current phase deliverables are implemented in the planned package/module boundaries.
*   The current phase automated gates are green using the commands already documented in this file.
*   The current phase manual signoff has been performed against the relevant entries in the verification matrix or smoke checks.
*   There are no unresolved merge blockers for the current phase.
*   Any deferred follow-up is explicitly documented and does not dilute the completed gate criteria.

**Ready to Release**
*   All four phases have cleared their merge blockers.
*   No release blocker remains open for interactive local terminals, non-TTY fallback, `TERM=dumb`, PM2-style supervision, QR degradation, or shutdown handling.
*   Workspace gates are green: `pnpm test`, `pnpm typecheck`, and `pnpm lint`.
*   The documented post-implementation smoke checks complete without Ink contamination, unreadable QR behavior, or teardown regressions.
*   Deferred follow-ups are limited to explicitly acceptable items and are not masking stability, correctness, or operator-facing output issues.

## Verification Plan

### Automated Unit and Integration Tests

**New `@open-wa/cli` unit targets (to be created):**
*   `packages/cli/src/__tests__/output-mode.test.ts`: cover TTY vs non-TTY detection, `TERM=dumb`, explicit non-interactive overrides, and interactive happy-path decisions.
*   `packages/cli/src/__tests__/output-broker.test.ts`: verify interception of `console.log` / `console.warn` / `console.error`, broker pass-through in plain-text mode, and cleanup restoring original console behavior.
*   `packages/cli/src/__tests__/event-projection-store.test.ts`: verify bounded ring-buffer retention, burst-load coalescing, snapshot stability, and eviction behavior under high event volume.
*   `packages/cli/src/__tests__/shutdown-controller.test.ts`: verify first-signal graceful shutdown, timeout escalation, second-signal force behavior, and broker cleanup ordering.

**Extensions to existing package tests:**
*   Extend `packages/wa-automate/src/__tests__/cli-runtime.test.ts` to verify CLI override mapping into runtime config, fallback to plain-text output when the CLI declares non-interactive mode, and routing of startup/QR/readiness notices through a sink abstraction rather than direct console assumptions.
*   Extend `packages/config/src/__tests__/precedence.test.ts` to prove CLI-source-local validation still preserves the existing precedence chain once overrides are handed to `resolveConfig`.
*   Extend `packages/config/src/__tests__/define-config.test.ts` to prove `define-config.ts` remains a shape helper and does not accidentally become the new validation or precedence owner during the CLI migration.
*   Reuse `packages/core/test/unit/runtimeEventBridge.test.ts` or adjacent runtime event bridge tests to document transport event cadence assumptions, especially around bursty event delivery that the projection store must coalesce rather than replay directly into Ink state.

**Workspace-aligned automated commands:**
*   `pnpm --filter @open-wa/cli test`
*   `pnpm --filter @open-wa/wa-automate test -- src/__tests__/cli-runtime.test.ts`
*   `pnpm --filter @open-wa/config test -- src/__tests__/precedence.test.ts`
*   `pnpm --filter @open-wa/config test -- src/__tests__/define-config.test.ts`
*   `pnpm --filter @open-wa/core test -- test/unit/runtimeEventBridge.test.ts`
*   `pnpm test`
*   `pnpm typecheck`
*   `pnpm lint`

**Proposed focused scripts to add later (documented only, not yet present):**
*   Root: `test:cli-ui` -> intended to run focused CLI UI and runtime migration coverage via Turbo filters.
*   `@open-wa/cli`: `test:output`, `test:signals`, `test:watch`.
*   `@open-wa/wa-automate`: `test:cli-runtime`.
*   `@open-wa/config`: `test:precedence`.
*   `@open-wa/core`: `test:runtime-events`.

### Manual Verification Matrix

*   **Interactive local terminal:** Run the built CLI in a normal TTY and confirm Ink boot rendering, stable log region behavior, and clean transition through boot, QR, readiness, and shutdown states.
*   **Terminal resize and QR degradation:** Resize the terminal during QR rendering and confirm the QR component degrades to a warning plus raw auth URI instead of wrapped, unreadable matrix output.
*   **Deep writer contamination check:** Force or simulate runtime log emission from `@open-wa/wa-automate` and verify the brokered log pane absorbs the write without tearing the Ink layout.
*   **Headless fallback:** Run under non-TTY and `TERM=dumb` conditions and confirm the CLI refuses to start Ink, emits plain text only, and still preserves critical readiness/error output.
*   **Supervisor-style runtime:** Exercise the CLI under PM2-like process management and confirm no ANSI diff rendering leaks into managed logs.
*   **Shutdown escalation:** Send one signal and verify orderly staged teardown; send repeated signals and verify force-exit escalation only after the grace path has started.

### Post-Implementation Smoke Checks

These are explicit smoke commands for after the implementation lands. Build first so the examples run against the generated CLI entrypoint. The `--help` examples below are placeholders for whichever lightweight, non-destructive CLI entry exists at implementation time (for example `--help`, `--version`, `doctor`, or `--dry-run`); they should not be read as asserting that `--help` is already supported in the current repo.

*   Build the CLI: `pnpm --filter @open-wa/cli build`
*   Plain interactive run: `node packages/cli/dist/bin.cjs --help` (replace `--help` with the safe placeholder command that exists after the migration)
*   Piped output / non-TTY fallback: `node packages/cli/dist/bin.cjs --help | cat` (same placeholder assumption)
*   `TERM=dumb` fallback: `TERM=dumb node packages/cli/dist/bin.cjs --help` (same placeholder assumption)
*   PM2-managed smoke check: `pm2 start node --name openwa-cli -- packages/cli/dist/bin.cjs --help` (same placeholder assumption)
*   PM2 log inspection: `pm2 logs openwa-cli --lines 100`
*   Repeated SIGINT / staged shutdown: `node packages/cli/dist/bin.cjs <args> & PID=$!; kill -INT $PID; sleep 1; kill -INT $PID; wait $PID`
*   SIGTERM escalation path: `node packages/cli/dist/bin.cjs <args> & PID=$!; kill -TERM $PID; wait $PID`

**Command sequencing guidance:** During implementation, favor package-local loops first (`pnpm --filter @open-wa/cli test`, targeted `wa-automate` / `config` / `core` tests), then run the workspace gates (`pnpm test`, `pnpm typecheck`, `pnpm lint`) before declaring the migration stable.

---

## 7. Dependency Manifest

New dependencies required for the Ink migration. All should be added to `packages/cli/package.json`.

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `ink` | `^5.2.0` | React-based terminal UI renderer |
| `pastel` | `^3.0.0` | File-system command routing for Ink |
| `ink-gradient` | `^3.0.0` | Gradient text rendering (replaces CFonts) |
| `ink-big-text` | `^2.0.0` | ASCII art text rendering (replaces CFonts) |
| `ink-spinner` | `^5.0.0` | Spinner component (replaces Spinnies) |
| `react` | `^18.3.0` | React runtime (Ink peer dependency) |
| `qrcode` | `^1.5.0` | Programmatic QR generation (replaces qrcode-terminal for Ink-safe rendering) |

> [!NOTE]
> `qrcode-terminal` writes directly to stdout via callback. For Ink mode, we need `qrcode` (the library) to generate the QR matrix as a string, which can then be rendered inside an Ink `<Box>`. `qrcode-terminal` can remain as a fallback for plain-text mode.

---

## 8. Instructions for Red Team Agent

You are an expert systems architecture and terminal UI stability auditor. Your objective is to red-team and stress-test the implementation plan above for transitioning the Open-WA CLI from its legacy `Spinnies`-based monolithic state to a modern, React-based `Ink`/`Pastel` architecture within a strictly decoupled PNPM monorepo.

### Your Directives
1. **Find Holes in the Headless Fallback:** Probe the `isTTY` logic. Are there edge cases where Ink strings could still leak into PM2 logs and corrupt output? Pay special attention to the `TunnelClient` instantiation path in `bin.ts` which logs outside the main `start()` flow.
2. **Stress-test the Architecture Map:** `HyperEmitter.emit()` is synchronous and invokes all listeners inline. Does this pose event-loop starvation risks if React `setState` is called from a listener during burst delivery of `message.received` events?
3. **Validate Config Routing:** `parseCliArgs()` in `cli-runtime.ts` already produces a `PartialConfig` object. Review whether this existing pattern is sufficient as-is or whether a separate Zod schema in `packages/cli` adds meaningful safety.
4. **Identify Teardown Risks:** We use staged teardown with `page.close()` → `browser.close()`. Could interruption during this sequence permanently lock Chromium profile data (e.g., `Default/Preferences`, `Default/Lock`) under a persistent `userDataDir`?
5. **Audit the PM2 code path:** The current `main()` function in `cli-runtime.ts` has a hardcoded absolute path, an unhandled promise, and dead filter logic. Confirm these are addressed before any Ink work begins.

### Relevant Repositories / Files to Analyze
Use your `view_file` capabilities on the following files to ground your criticisms in reality:

**V5 Monorepo Target (`packages/`):**
* `packages/cli/src/bin.ts` — The current v5 entry-point boundary and TunnelClient wiring
* `packages/cli/src/tunnel-client.ts` — WebSocket tunnel client (direct console writes)
* `packages/wa-automate/src/cli-runtime.ts` — The main CLI runtime with all direct writers
* `packages/wa-automate/src/server/hono-server.ts` — WAServer implementation
* `packages/wa-automate/src/server/lifecycle-manager.ts` — API lifecycle manager (direct logs)
* `packages/hyperemitter/src/core/HyperEmitter.ts` — Synchronous emit, no disposable handles
* `packages/config/src/merge.ts` — Config merge/precedence logic
* `packages/config/src/define-config.ts` — Config shape helper (not a validator)

**Legacy V4 Baseline (for context only):**
* `packages/legacy/src/controllers/events.ts` — The monolithic `Spin` class
* `packages/legacy/src/cli/setup.ts` — The complex configuration fallback logic

Please provide a structured markdown output detailing any identified vulnerabilities, race conditions, or DX regressions we missed in this plan.
