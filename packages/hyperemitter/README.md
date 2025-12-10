# HyperEmitter (planning scaffold)

This package placeholder exists to host the benchmarking + DX scaffolding for the upcoming HyperEmitter implementation. The real emitter code will land later; for now we capture performance baselines for competitor libraries and set up build/CI expectations.

## Baseline benchmarks

Run competitor baselines (Node EventEmitter, eventemitter2/3, emittery, mitt, tseep):

```bash
pnpm --filter @open-wa/hyperemitter bench:baseline
```

Options:
- `--iterations <n>` to adjust emit count (default: 500000)
- `--output <file>` to override output path
- `--ci` to suppress console tables

Outputs JSON to `packages/hyperemitter/benchmarks/baseline/results/baseline-node-<version>.json`.

> If some competitors are not installed, the runner will skip them and record the reason. Install this package’s devDeps to populate all baselines.

## Build/interop contract (snapshot)

- Dual ESM/CJS outputs with typed entrypoints.
- Adapters for `EventTarget`, Node `EventEmitter`, and worker threads.
- Optional plugins (TTL/maxListeners/tracing) kept out of the hot path.
- Perf budgets enforced via CI once HyperEmitter lands (5% envelope vs tseep for exact; ≥10x EE2 for wildcards).
