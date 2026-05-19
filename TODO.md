# TODO

## Release Pipeline Setup (remaining)

- [ ] Set `NPM_TOKEN` secret in GitHub repo settings (Settings → Secrets → Actions)
- [ ] Create a `release` branch from `main`
- [ ] Install [changeset-bot](https://github.com/apps/changeset-bot) on the repo (optional but recommended — reminds PRs to add changesets)
- [ ] Delete old root `release-image.js` (replaced by `tools/release-image.js`)

## Before First Release

- [ ] Align all package versions (run `pnpm changeset` → select all → patch, then `pnpm version-packages`)
- [ ] Verify `pnpm publish-packages --dry-run` works for all public packages
- [ ] Test full flow: changeset → version → publish on `release` branch

## General

- [ ] Upgrade turbo to v2+ (`pnpm add -Dw turbo@latest`) and rename `pipeline` → `tasks` in `turbo.json`
- [ ] When ready for stable: run `pnpm changeset pre exit`

## Research: Management Plane / Orchestrator

- [ ] Reconcile the documented `@open-wa/orchestrator` design with current `master`: verify whether it should be created, removed from docs, or represented by existing `@open-wa/api` / `@open-wa/core` lifecycle surfaces.
- [ ] Research multi-key API auth for the current architecture: roles, key hashing, expiry, CIDR allowlists, session scoping, and whether this belongs in the planned orchestrator management plane versus the per-session Easy API.
- [ ] Research webhook management improvements in the current architecture: keep delivery as a plugin/integration, but add HMAC signing, deterministic idempotency keys, delivery IDs, and observability on top of the existing retry/concurrency implementation.
- [ ] Research audit logging using existing infrastructure: define an audit event schema and writer that reuses `@open-wa/logger`, core events, Hono middleware, and Elastic/file transports instead of creating a greenfield audit subsystem.
- [ ] Research aggregated operational stats as a management-plane concern: decide what belongs in per-session `/health` versus a future orchestrator-level multi-session stats surface.
