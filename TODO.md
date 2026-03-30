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
