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

The executable contracts live in `packages/runtime-core/src/effect-spikes.test.ts`. All unstable APIs stay behind open-wa-owned declarations, so beta stability affects one internal boundary instead of the SDK.

## Measured replacement boundary

`tools/bench-effect-replacements.mjs` records repeatable performance and minified standalone browser-bundle measurements in `architecture/benchmarks/effect-replacements.json`; `tools/check-effect-evidence.mjs` rejects evidence recorded against a different Effect pin. On the 2026-07-22 Node 26/Apple M1 Pro run:

| Spike | Existing | Effect v4 | Consequence |
| --- | ---: | ---: | --- |
| Runtime contract decode | Zod 20.6m ops/s, 327,274 B | Schema 1.2m ops/s, 364,586 B | Adopt Schema where one definition removes wire/persistence/API drift. Keep decoding outside hot per-message loops and retain the Zod plugin boundary. |
| Internal event fan-out | HyperEmitter 12.4m ops/s, 6,002 B | PubSub 464k ops/s, 128,546 B | Adopt bounded PubSub where backpressure and scoped shutdown are correctness requirements. Keep HyperEmitter for the synchronous public event surface. |
| HTTP/RPC declaration | Hand-authored 190 B | HttpApi/RPC 428,676 B | Adopt definition-first declarations on server/runtime entrypoints that already load Effect. Do not pull them into browser clients until an incremental bundle report proves the shared runtime amortizes the cost. |

The bundle figures are standalone costs, so they deliberately represent the worst case rather than claiming that shared Effect modules are free. The performance figures are decision evidence rather than release thresholds; correctness contract tests and the exact beta pin remain the stability gates.

## Startup and memory evidence

`tools/bench-effect-startup.mjs` compares sequential startup with the dependency graph and records critical-path duration plus peak RSS for one and three sessions. The checked baseline shows 150 ms to 72 ms for one session and 454 ms to 70 ms for three concurrent sessions without a material synthetic RSS increase. `tools/bench-real-runtime.mjs` separately measures real browser process-tree RSS and cold/warm navigation; the Puppeteer/Chrome 150 Apple Silicon baseline is checked in as `architecture/benchmarks/puppeteer-browser-darwin-arm64.json` and covers one and three concurrent browser sessions. Authenticated session baselines remain environment-specific release artifacts because they require isolated WhatsApp profiles and credentials.
