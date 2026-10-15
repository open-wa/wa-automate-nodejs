# HyperEmitter Effect benchmark

Run from the repository root:

```sh
node --expose-gc packages/hyperemitter/benchmarks/run-effect.mjs \
  --output /tmp/hyperemitter-effect.json
```

The runner compiles the current TypeScript source, its public emitter adapter, and a Git baseline into temporary ESM bundles, then executes them under plain Node. It uses the real installed Effect and logger dependencies, and removes the temporary bundles on completion. It does not use an existing `dist` bundle, Bun, or a test runner.

The default Git baseline is `edf0e755da222b162d88980ba39dc0b1bc0e7419`, before the Effect changes. Override it with `--baseline-ref <commit>`. Add `--compare-source /path/to/frozen/src` for the earlier Effect-aware implementation, `--prototype-source /path/to/frozen/src` for the first full-Effect prototype, or `--optimized-aware-source /path/to/frozen/src` for the tuned hybrid comparison. Results record source SHA-256 hashes, complete source snapshots, and the baseline commit. Each source is frozen again before compilation so edits cannot change a running comparison.

Each scenario gets two full untimed warmup batches and seven measured batches. Implementations rotate their measurement order. Each batch checks its completed delivery count and payload checksum after timing; scope churn also checks that registrations return to zero. The scoped Effect scenario starts never-ending listener work, closes its scope, and counts completed finalizers. Emitter construction, registration, teardown, and explicit GC sit outside timing except when measuring subscription churn. Unsupported features are omitted.

Synchronous hybrid scenarios invoke callbacks directly; the full dispatcher enters Effect per `emit`. Awaited scenarios run a batch inside one root Effect and await each event's listeners. Elapsed and process CPU time are both recorded. Values are batch medians per emitted event or scope cycle, rather than individual callback latency or WhatsApp end-to-end latency.

See the [fair comparison](./results/effect-fair-comparison-node-2026-10-14.json) for the tuned full-Effect dispatcher and a tuned hybrid with the same routing, scopes, and `emitEffect` implementation. Their intentional difference is synchronous `emit`: the full dispatcher enters Effect once, while the hybrid invokes callbacks directly and enters Effect when listener work needs a fiber. Differences in their shared awaited path reflect runtime/JIT variation rather than distinct algorithms.

The tuning batches ordinary callbacks in one deferred Effect, removes per-listener wrapper allocations, starts scoped fibers only for Promise or Effect results, and joins those fibers as one group. The group is interrupted on failure or cancellation using public `Fiber.joinAll` and `Fiber.interruptAll` APIs. It uses neither private runtime internals nor disabled scheduler fairness.

The [first prototype results](./results/effect-node-2026-10-14.json), [generator-loop candidate](./results/effect-generator-node-2026-10-14.json), and [tuned full-Effect comparison](./results/effect-optimized-node-2026-10-14.json) retain the earlier measurements. The older [competitor baseline](./baseline/README.md) covers other emitter libraries separately.

## PubSub and the exported API

```sh
node --expose-gc packages/hyperemitter/benchmarks/run-pubsub.mjs
node packages/hyperemitter/benchmarks/probe-pubsub.mjs
node packages/hyperemitter/checks/public-api.mjs
```

The [PubSub report](./results/pubsub-node-2026-10-14.json) uses a bounded hub
with capacity 256, replay disabled, backpressure, and one scoped consumer fiber
per listener. It compares single-message consumers with consumers that drain up
to 256 messages at a time. Every timed batch waits for completed listener work,
then checks counts, checksums, and per-listener FIFO order. Queue submission
alone is never counted as listener completion. The per-event mode waits after
each event; the pipeline mode uses one completion barrier per chunk of 256.
The hybrid pipelines through direct `emit`, so both implementations can have
asynchronous work in flight. Consumer fibers are interrupted and subscriptions
released after each batch. The report embeds the source snapshots and records
a probe of whether listeners have run when `publish` returns. A ready consumer
can run before publication returns; this isn't a dispatch guarantee. The
separate busy-subscriber probe starts a listener waiting on a Deferred, publishes
another event, then releases it. It verifies that the PubSub consumer queues the
second callback, while the public emitter invokes it immediately even with
previous async work outstanding. It updates probe evidence without rerunning
or modifying the recorded timing measurements.

The [final source report](./results/final-hybrid-node-2026-10-14.json) also
measures the public adapter, including its variadic packet and listener-context
overhead. Its bare HyperEmitter figures should not be presented as global `ev`
figures. `--full-source /path/to/frozen/src` adds the tuned full dispatcher; its
source can be reconstructed from the earlier fair comparison's embedded files.

The manual API checker loads EventEmitter2 6.4.9 only as a development reference.
If it isn't present locally, pass `--reference /absolute/path/to/eventemitter2`
for a separately installed copy; it is absent from SDK dependencies. The checks
compare wildcard behavior, variadic delivery, listener context and ordering,
removal and subscription helpers, async results, and errors. They also cover
Effect scope cleanup, session alias payloads, current-source ESM/CJS global
exports, a TypeScript consumer fixture, and assignability to the full EventEmitter2
instance interface. They do not establish behavior of
a published registry package or a live WhatsApp session.

The benchmark uses only public Effect APIs. The batching strategy is informed
by [Effect's PubSub documentation](https://effect.website/docs/v4/concurrency/pubsub),
which documents asynchronous broadcast, scoped subscriptions, backpressure,
and `publishAll`. These local Node timings are directional, not a latency or
throughput guarantee for a WhatsApp application.

The final runner also includes optional PubSub observation. Queued burst
scenarios enable a native hub and a Stream consumer before emitting 10,000
events, wait for both callback and queued work, and check observer count,
checksum, and FIFO order. They measure one extra observer alongside a callback
and a queued-only case. These are finite burst/drain measurements, rather than
per-event latency or bounds on an indefinitely slow consumer. The callback
contract checker runs its differential cases with the hub both disabled and
enabled, and separately verifies replay, finite loss policies, reentrant order,
raw native access, and global forwarding.

## Release package entries and documentation examples

After building the affected packages and their runtime dependencies, run:

```sh
node packages/hyperemitter/checks/package-exports.mjs
# Choose a specific Node runtime, for example the issue's Node 24.21.0:
node packages/hyperemitter/checks/package-exports.mjs --node /path/to/node
```

This manual check packs HyperEmitter, core, SocketClient, and the main SDK with
pnpm, then loads those tarballs through their published `import` and `require`
exports. It checks shared `ev` identity, callback and queued delivery, socket
emitter construction, and absence of direct EventEmitter2 imports/dependencies.
It also executes the standalone examples extracted from the Effect event guide
and checks the typed stream example against the packaged declarations.

Transitive workspace dependencies use local built outputs, and third-party
dependencies come from the installed checkout. The
[package report](./results/package-exports-node-2026-10-14.json) establishes
that local tarball boundary, rather than a fresh registry installation or a live
WhatsApp session. Package builds, API contract checks, and event benchmarks have
separate scopes and evidence.
