# Effect v4 runtime architecture

Open-wa v5 uses Effect as its portable execution, dependency, concurrency, resource, and observability kernel. The coordinated Effect family is pinned to `4.0.0-beta.100`; beta upgrades are atomic and must pass `.github/workflows/effect-contracts.yml` before merge.

## Runtime capability boundary

Domain programs import `@open-wa/runtime-core` and request capabilities. Composition roots provide them with one of the runtime Layers below. A Layer advertises what the host really supports; it never emulates Chromium, files, or processes where the host cannot provide them.

| Runtime Layer | Browser client | Launch Chromium | Filesystem | Process | Fetch | Worker bindings |
| --- | --- | --- | --- | --- | --- | --- |
| Node | yes | yes | yes | yes | yes | no |
| Bun | yes | yes, contract tested under Bun | yes | yes | yes | no |
| Browser | yes | no | no | no | yes | no |
| Edge/Worker | yes | no | no | no | yes | yes |

Deno does not have a dedicated Layer yet. It may consume the Node package through Deno's Node compatibility only after the same capability contract passes there; until then it is deliberately unclaimed. The portable import check rejects Node, Bun, Deno, CommonJS, and other host globals from runtime-core, browser, and edge sources. Browser and edge tests also prove that host-only requests fail as typed capability errors.

## Queue policies

`ScopedTaskQueue` is the v5 queue primitive. Every instance declares a positive capacity, concurrency, FIFO ordering, and either bounded backpressure or dropping overload. It can also declare a task timeout and fixed-window rate policy. Queue workers belong to an Effect Scope; closing it rejects queued and active acknowledgements, interrupts worker fibers, and shuts down the mailbox. Metrics cover depth, active fibers, completions, failures, drops, and rate-delay decisions.

| Consumer | Capacity and overload | Ordering/concurrency | Failure and shutdown |
| --- | --- | --- | --- |
| Client event listener | Listener policy; bounded backpressure or dropping | FIFO per listener | Timeout/failure is reported; removing the listener closes its mailbox |
| Webhook delivery | 1,000/backpressure by default | FIFO, 10 workers by default | Stable idempotency keys, SQLite replay/dead-letter state, retry limits, interruption-safe shutdown |
| S3 upload | Integration policy/backpressure | FIFO with explicit permits | A file is marked processed only after upload success; dispose drains and closes |
| Orchestrator commands | Command-specific bounded queues | Serialized where update/reload/restart ordering matters | Queue ownership follows the orchestrator lifecycle and rejects on close |
| Chat executor | 64/backpressure per chat | FIFO, one worker by default | Timeout kills the isolate; idle/session close destroys the queue and process/worker |

Sliding overload is intentionally absent because it would discard an already-accepted task without a truthful acknowledgement. Priority work must use separate explicit lanes rather than silently weakening FIFO.

## Session resource ownership and startup

The process owns admission control and runtime adapters. Each `createClient` call creates one session Scope that owns its admission lease, Transport/browser/page, plugins, chat sandbox, event queues, listeners, timers, and shutdown hooks. Startup failure, authentication timeout, browser crash, plugin failure, signal, interruption, and normal stop all close that Scope; finalizers run once in reverse acquisition order.

Startup is an explicit dependency graph. Patch acquisition, license preflight, and transport launch/navigation start together. Patch application waits for the page and artifact, remote license validation waits for host identity, and readiness waits for every critical dependency. Optional branches accumulate failures while critical branches fail fast and interrupt siblings. Each phase and the graph critical path are observable.

`tools/bench-effect-startup.mjs` reports before/after critical-path time and peak process RSS for one and three concurrent synthetic sessions. It remains a contract benchmark, not a browser capacity claim. `pnpm bench:runtime:real -- --driver puppeteer --mode session --profile-root /release/openwa-profiles --output architecture/benchmarks/puppeteer-release-host.json` runs the full authenticated startup on a release host and records cold/warm one- and three-session latency plus browser-process-tree RSS with hardware labels. Browser-only mode supports capability baselines for drivers such as Lightpanda that cannot complete current WhatsApp service-worker startup. Production thresholds should be set only after several release-host samples exist for each supported driver.

`SessionAdmission` reserves steady-state memory and browser-launch permits before work starts. The Node sampler exports process RSS and heap gauges. OS/container limits remain responsible for hard caps.

## Per-chat execution isolation

`sandboxChats` or `--sandbox-chats` creates a per-chat mailbox and execution scope. Policies include worker/process/container isolation, timeout, idle timeout, memory, concurrency, filesystem, network, environment, and allowed capabilities. The common default is a process with no ambient environment, serialized work, a 30-second timeout, and a 256 MB V8 heap limit.

- Worker mode is an availability boundary with a V8 heap limit, not a hostile-code security boundary.
- Process mode removes ambient globals from the VM context, disables string/Wasm code generation, strips environment variables, uses Node permissions, and enforces time/output limits. Node's permission model is defense in depth, so this mode is not advertised as containment for determined malicious code.
- Container mode is the strong boundary: no network, read-only root, bounded memory/CPU/PIDs, a small no-exec tmpfs, and no workspace mount unless policy explicitly allows one. Network allowlists require an external network-policy adapter and fail closed otherwise.

Worker and process adapters accept only `filesystem=none`, `network=none`, and `env=none`; requests for host access fail closed instead of pretending that the VM boundary can enforce them. Filesystem mounts and selected environment forwarding are container-only policies.

`Effect.sandbox` is used only to preserve the full `Cause` in the typed error channel. A contract test demonstrates that it does not isolate ordinary side effects, preventing it from being mistaken for a security feature.

## Plugin Layers and durable delivery

Webhook, S3, and Chatwoot expose capability services through scoped Layers. Their plugin adapters create a `ManagedRuntime`, borrow the service for handlers, and dispose the runtime with the plugin. Webhook and S3 finalizers drain their bounded queues before closing; community Promise plugins remain adapters at the external plugin boundary.

Durable webhooks use `node:sqlite` with WAL and full synchronization. Enqueue is idempotent, attempts and next-run times are persisted before sleep, replay is ordered, corrupt payloads are quarantined to dead letter, successful delivery is terminal, retry exhaustion becomes dead letter, and shutdown leaves interrupted work pending. Remote requests carry the stable delivery identifier in `Idempotency-Key`.

## Observability and replacement decisions

The in-memory observability service is the baseline implementation and a bridge point for OpenTelemetry/exporters. It records queue depth/drops/failures, active queue fibers, rate and retry decisions, session/browser memory, startup phase and critical-path durations, and fatal Causes. Attributes identify the queue, component, phase, and session where available.

The direct keep/replace decisions for Schema, HttpApi, RPC, logging, and events live in `architecture/effect-v4-spikes.md`; executable Schema, HttpApi, RPC, PubSub, and Stream contracts live in `packages/runtime-core/src/effect-spikes.test.ts`. Unstable imports remain visibly under `effect/unstable/*`, behind open-wa-owned declarations, so a coordinated beta bump cannot leak churn through the public SDK.

## Upgrade contract

Every Effect beta update must change the catalog and lockfile together, then pass exact-family validation, portable-import checks, runtime package builds/typechecks/tests, the same portable capability program under Node and Bun, browser/edge negative capability tests, lifecycle/finalizer tests, queue semantics, durable webhook crash/replay tests, sandbox adversarial tests, and the startup benchmark. A failure blocks the upgrade rather than allowing mixed beta versions or runtime-specific imports into portable code.
