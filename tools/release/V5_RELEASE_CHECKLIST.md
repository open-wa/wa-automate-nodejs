# v5.0.0 stable release checklist

This checklist describes the prepared v5.0.0 release. npm `latest` still selects v4 until the `release` workflow publishes v5 and the dist tag is verified.

## Package and dependency audit

- [x] All 32 public packages are versioned `5.0.0`, with no `-alpha` suffix or active `.changeset/pre.json`.
- [x] `pnpm outdated -r` reports only the Changesets CLI 2 and changelog plugin 0.7 pair. They remain pinned because the stable `changesets/action@v1` line uses Changesets CLI 2; action v2 is still prerelease.
- [x] `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm build`, `pnpm typecheck`, and `pnpm test` pass on Node 22.
- [x] Every public `pnpm pack --dry-run` contains its declared entry points, README, and license; a real main-package tarball rewrites workspace dependencies to `5.0.0`.
- [x] Package metadata and tarballs reflect the root H-DNH 1.1 text, with Apache-2.0 for HyperEmitter and the Node-RED upstream MIT notice retained alongside its H-DNH license file.

The dependency refresh includes the major migrations in [Vitest 5](https://vitest.dev/guide/migration/), [EventSource 5](https://github.com/EventSource/eventsource/blob/main/MIGRATION.md), [Cosmiconfig 10](https://github.com/cosmiconfig/cosmiconfig/blob/main/CHANGELOG.md), [Chalk 6](https://github.com/chalk/chalk/releases), [ts-morph 28](https://github.com/dsherret/ts-morph/releases), and [deepmerge-ts 8](https://github.com/RebeccaStevens/deepmerge-ts/releases/tag/v8.0.0). Cosmiconfig 10 requires separate synchronous loaders and excludes ESM config files from synchronous search. The config loader has a regression test for that behavior.

`pnpm audit --prod` currently reports no critical advisories. Remaining high advisories are transitive: the docs build chain's `nth-check` and `svgo`, Lightpanda Puppeteer's `extract-zip` (no patched release is listed), and `image-size` under the S3/session-sync `pico-s3` path. The latter's [patched version](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) is a new major incompatible with `datauri`'s exact 1.0.0 dependency; do not force that override without testing the integration. Review the residuals before publishing and track upstream fixes separately.

## Release path

1. Merge the v5 changes into `master` after CI and review.
2. Reconcile the `release` branch to that exact `master` commit. `release` currently has divergent generated history, so this requires an explicitly authorized force update under the repository commit policy.
3. The push to `release` runs `.github/workflows/release.yml`. With no pending changesets and unpublished `5.0.0` packages, Changesets publishes stable versions to npm `latest` and GitHub Packages.
4. Verify `npm view @open-wa/wa-automate dist-tags --json`, all package versions, the GitHub Release, and the workflow result. Keep Docker image tags separate from the npm dist tag; Docker has its own release path.

Never run `tools/release/dry-run.sh` on a dirty checkout: its cleanup uses `git checkout` to revert package manifests and changesets. Use an isolated clean checkout for that script.
