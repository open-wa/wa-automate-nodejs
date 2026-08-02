Baseline benchmark harness for competitor emitters. Runs before HyperEmitter lands to capture regression targets.

Usage:
- `pnpm --filter @open-wa/hyperemitter bench:baseline` (writes to `benchmarks/baseline/results/`)
- `node benchmarks/baseline/run-baseline.js --iterations 750000 --output custom.json`

Notes:
- The runner skips libraries that are not installed. Install this package's development dependencies to include all competitors.
- Includes exact-match (3 args) and wildcard runs where the library supports wildcards.
