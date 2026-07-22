# Effect v4 replacement decisions

These spikes compile and run against the exact `4.0.0-beta.100` family. Because open-wa v5 is still alpha, these decisions optimize the target architecture instead of preserving transitional APIs.

| Area | Decision | Evidence and boundary |
| --- | --- | --- |
| Schema | Replace Zod for runtime, wire, persistence, and new public contracts. Keep a thin Zod decoder only at the third-party plugin input boundary. | One Effect Schema now drives the runtime decode and the HttpApi/RPC declaration. Decode failures are typed and prototype-safe; Schema tree-shakes with the runtime contract. The remaining Zod adapter is an external protocol boundary, not migration weighting. |
| HttpApi | Replace hand-authored route contracts with HttpApi, starting with health/runtime metadata, while Hono remains a replaceable server transport. | Reflection produces the endpoint model from the same Schema and strict handler typing catches drift. The unstable import is isolated behind an open-wa declaration; API contract and bundle checks gate each beta. |
| RPC | Replace the hand-authored `ask` protocol declaration with definition-first RPC while retaining HTTP/WebSocket as transports. | `OpenWaAskRpc` owns payload, success, typed error, and defect schemas. Reconnect, streaming, browser bundle size, and backpressure remain transport acceptance gates before the declaration expands. |
| Logging | Keep `@open-wa/logger` as the sink and replace runtime logging calls with an Effect bridge at composition roots. | Current transports remain useful on capability grounds, while Effect supplies spans, fiber annotations, retry/rate decisions, and nested Causes. A full sink replacement has no correctness or bundle advantage yet. |
| Events | Replace internal fan-out paths with bounded `PubSub`/`Stream`; keep HyperEmitter only as the public synchronous adapter. | The prototype proves bounded publish/consume and scoped shutdown. Wildcard ordering, synchronous listener behavior, rejection handling, throughput, and browser bundle size must match before the public adapter can be removed. |
| Error sandboxing | Use `Effect.sandbox` only to capture typed `Cause` values. | Security isolation is provided by the runtime-specific worker/process/container execution adapter, never by Cause sandboxing. |

The executable contracts live in `packages/runtime-core/src/effect-spikes.test.ts`. All unstable APIs stay behind open-wa-owned declarations, so beta stability affects one internal boundary instead of the SDK. `tools/bench-effect-startup.mjs` compares the old sequential startup shape with the dependency graph and reports peak RSS; CI should reject a material regression once real browser baselines are recorded per driver.
