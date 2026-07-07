# v4 compatibility benchmark

Executable definition of "v4 compatible" for v5, per issue
[#3339](https://github.com/open-wa/wa-automate-nodejs/issues/3339).

Three layers (only the first is built so far):

- **`static/`** — no WhatsApp required, runs in CI. Compares the v4 public
  Client surface against the v5 schema registry.
- `capture/` — _(planned, task C2)_ one-time capture of golden fixtures from a
  real `@open-wa/wa-automate@4.76.0` run (CLI `--help`, HTTP envelopes, webhook
  bodies, message corpus).
- `live/` — _(planned, task C5)_ runs the scenario scripts against a live v5
  session; gated behind `WA_BENCH_LIVE=1`.

## Static parity matrix (task C1)

`static/parity.ts` extracts the v4 public method surface from
`packages/legacy/src/api/Client.ts` (which *is* the v4 implementation) with
ts-morph, and diffs it against `@open-wa/schema`'s `clientRegistry.getAll()`.

It classifies every v4 method as:

- **covered** — a v5 method has the same `functionName`.
- **aliased** — the v4 name is a registered alias of a v5 method (e.g.
  `contactBlock` → `blockContact`).
- **missing** — no v5 method or alias matches. This list mixes genuine gaps
  (e.g. `createCommunity`, `editMessage`) with v4-internal utility methods that
  were never part of the schema surface (e.g. `gc`, `download`, `forceRefocus`).
  Triage each into a T0/T1/T2 decision in #3339.
- **arityMismatch** — covered, but v4 requires more positional args than the v5
  `parameterOrder` documents (informational; often an extra optional flag).

### Commands

```bash
# regenerate the committed report
pnpm --filter @open-wa/schema build   # the tool reads the built schema dist
pnpm tsx tools/v4-compat-bench/static/parity.ts

# CI gate: fail if `missing` or `arityMismatch` grew vs the committed report
pnpm tsx tools/v4-compat-bench/static/parity.ts --check
```

`static/v4-parity-report.json` is the committed baseline and doubles as the
living migration checklist. If a v5 change legitimately drops a method (an
agreed T2 decision), regenerate and commit the new report in the same PR.
