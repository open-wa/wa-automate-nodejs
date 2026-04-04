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

**Implementation Protocol:**
1.  **Headless Fallback (Strict Interactive Predicate):** Ink should boot only when the process is truly interactive: `stdin`, `stdout`, and `stderr` are all TTYs, `TERM` is not `dumb`, and no explicit non-interactive override is present (for example `CI`, `NO_COLOR`, or a dedicated `OPEN_WA_NON_INTERACTIVE=1` style switch). `PM2_HOME` alone is not a reliable signal because it can exist in shells that are still interactive, and PM2-like supervisors can also omit it.
2.  **Multi-Boundary Output Brokering:** The redirection layer must sit above every writer path, not just `console.log`. That includes `console.warn`, `console.error`, logger transports, QR rendering paths, startup summaries, readiness banners, and any direct writes to `process.stdout` / `process.stderr`. Ink mode is only safe once all of those flows are brokered through one output service.
3.  **Bounded Log Buffering:** Winston and console redirection in Ink mode should route into a bounded ring buffer rather than an unbounded in-memory array. The Ink log pane must have a hard cap so verbose sessions or runaway emitters cannot grow memory indefinitely.
4.  **The `<LogStream />` Component:** We will render a safe, scrolling Ink `<Static>` or equivalent bottom-mounted log region. This safely mounts diagnostic text streams out-of-bounds of the active visual rendering matrix, ensuring layout diffs remain uncorrupted while still allowing degraded plain-text mode when Ink is disabled.

### Event Projection Safety

The current `HyperEmitter` implementation in `packages/hyperemitter/src/core/HyperEmitter.ts` uses synchronous `emit()` dispatch, and `.on()` returns `this` rather than an unsubscribe handle. Meanwhile, `packages/core/src/transport/Transport.ts` emits high-frequency events such as `message.received`, `message.any`, and `ack.changed`. We must therefore not wire raw HyperEmitter streams directly into React `setState` calls.

**Implementation Protocol:**
1.  **Use an External Projection Store:** Sink transport events into a bounded external store or ring buffer first, not directly into React component state.
2.  **Coalesce and Sample:** High-volume events must be sampled, coalesced, or reduced into derived view state before React sees them, so render cadence stays decoupled from transport event cadence.
3.  **Derive UI State, Do Not Mirror the Bus:** Ink components should consume derived summaries (boot phase, QR state, readiness, recent logs, compact counters) rather than a one-to-one replay of the raw event stream.
4.  **Require Explicit Cleanup:** Because `.on()` does not return an unsubscribe handle, every subscription must retain the original handler reference and call `off(event, handler)` explicitly on unmount or mode transition.

## 5. Responsive QR Code Viewport Constraints

QR Codes represent rigid spatial matrices. If the terminal width is narrower than the QR string requirements, column wrapping destroys the scannability.

**Implementation Protocol:**
*   Utilize Ink's `useStdout()` hook to monitor dimensions dynamically.
*   If the calculated matrix width exceeds `stdout.columns`, the `<QrCodeDisplay />` component must gracefully degrade. It will emit a yellow `<Text>` warning stating "Terminal window too small to render QR Code visually. Please expand." and fallback to rendering the raw authentication URI for external handling.

## 6. Teardown, Version, and Interactivity Constraints

**Staged Teardown over Immediate Kill:** If a user hits `Ctrl+C` (SIGINT) or the process receives a termination signal (SIGTERM), the CLI must trap it and enter a staged shutdown. The first signal should freeze the UI, stop accepting new work, and begin orderly teardown by calling `server.stop()`, `TunnelClient.disconnect()`, and `client.stop()` in the correct ownership layer. If graceful shutdown exceeds a timeout budget, only then should we escalate to force-kill browser resources. A second signal may force immediate termination. This is especially important because the current transport shutdown path closes gracefully with `page.close()` followed by `browser.close()`, and hard interruption around a persistent `userDataDir` can leave Chromium profile locks or corrupt preference data that requires manual cleanup before the next boot.

**Zero External Notifier Dependencies:** We will **not** rely on legacy bloat like `update-notifier`. If we maintain version checking functionality, the CLI will query the NPM registry JSON natively via `fetch`.

**Strictly Non-Interactive Output:** The initial scaffolding of the CLI will focus strictly on output visualization. The UI will render beautifully (spinners, statuses, and logs), but it will **not** prompt the user with interactive questions (e.g., "Do you want to continue? [Y/n]").

## Verification Plan

### Automated Tests
*   **Config Resolution Tests:** Pass mock command-line arguments to `zod` via Pastel, and assert that the `@open-wa/config` properly merges the results without throwing validation cascades.
*   **Headless CI Fallback:** Verify that running `pnpm cli:dev` within a piped CI runner (`isTTY = false`) refuses to initialize Ink and prints standard text output.

### Manual Verification
*   Execute the refactored CLI natively. Validate that the Core Event mapped hooks transition the new BootSequence components perfectly.
*   Resize the terminal horizontally during QR rendering to verify the "Terminal Too Small" graceful degradation boundary triggers instantly.
*   Force an injected standard `console.log` deep within `@open-wa/core` to confirm it routes correctly through the safe `<LogStream>` static component rather than destroying the layout.

---

## 7. Instructions for Red Team Agent

You are an expert systems architecture and terminal UI stability auditor. Your objective is to red-team and stress-test the implementation plan above for transitioning the Open-WA CLI from its legacy `Spinnies`-based monolithic state to a modern, React-based `Ink`/`Pastel` architecture within a strictly decoupled PNPM monorepo.

### Your Directives
1. **Find Holes in the Headless Fallback:** Probe the `isTTY` logic. Are there edge cases where Ink strings could still leak into PM2 logs and corrupt output?
2. **Stress-test the Architecture Map:** Does mapping `@open-wa/core` internal events (currently using `HyperEmitter`) directly to React state in Ink pose memory leak risks if event frequencies outpace React render cycles?
3. **Validate Config Routing:** Review our choice to bypass Pastel's Zod mapping for pure hydration into `@open-wa/config`. Is this actually safer than having Zod strictly construct the tree initially?
4. **Identify Teardown Risks:** We elected a hard-kill approach to the Chromium process on `SIGINT`. Could this permanently lock underlying profile data (e.g., `Default/Preferences`) requiring manual intervention by the end-user upon next boot?

### Relevant Repositories / Files to Analyze
Use your `view_file` capabilities on the following files to ground your criticisms in reality:

**Legacy V4 Baseline (`wa copy/`):**
* `file:///Users/Mohammed/projects/tools/wa copy/src/controllers/events.ts` (The monolithic `Spin` class that coupled UI, Logging, and Events)
* `file:///Users/Mohammed/projects/tools/wa copy/src/controllers/initializer.ts` (The orchestrator that relied heavily on `new Spin()`)
* `file:///Users/Mohammed/projects/tools/wa copy/src/cli/setup.ts` (The complex configuration fallback logic)
* `file:///Users/Mohammed/projects/tools/wa copy/src/logging/logging.ts` (Legacy Winston setup)

**V5 Monorepo Target (`packages/`):**
* `file:///Users/Mohammed/projects/tools/wa/packages/cli/src/bin.ts` (The current v5 entry-point boundary for the TTY checks)
* `file:///Users/Mohammed/projects/tools/wa/packages/config/src/define-config.ts` (The target for config hydration)

Please provide a structured markdown output detailing any identified vulnerabilities, race conditions, or DX regressions we missed in this plan.
