# HyperEmitter (planning scaffold)

This package is a placeholder for the HyperEmitter benchmarks and developer tools. The emitter code will arrive later. This package records competitor performance and defines build and CI expectations.

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
- CI will enforce performance budgets after HyperEmitter arrives. The targets are a 5% tseep envelope for exact events and 10x EE2 for wildcards.
