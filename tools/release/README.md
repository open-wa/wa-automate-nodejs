# Release tools

The repository uses `@varlock/bumpy` 1.18.1 for package versions, changelogs, and npm publishing. Bump files live in `.bumpy/`; the configuration is `.bumpy/_config.json`.

## Release flow

1. Commit development and bump files to `master`. Use `pnpm bump` to create a bump file and `pnpm exec bumpy status` to inspect the release plan.
2. Reconcile the `release` branch to the intended `master` commit. A push to `release` runs `.github/workflows/release.yml`; merging a PR to `master` alone does not publish.
3. Bumpy creates or updates `chore: version packages` when bump files are present. Merge that PR into `release` to publish the versioned packages.
4. The publish job builds packages, packs with pnpm to resolve `workspace:` and `catalog:` ranges, and publishes to npm with the npm CLI and GitHub OIDC. It then publishes the same versions to GitHub Packages, creates package tags and releases, and runs the aggregate notes, image, release, and Discord steps when `@open-wa/core` is included.
5. Confirm the registry `latest` tags and the GitHub release. The release workflow's success alone is not proof that every registry read has propagated.

The 27 packages in Bumpy's `fixed` group retain one version. Other public packages can receive their own version updates through their dependencies. Stable releases use npm's `latest` tag.

## Publishing access

Each existing npm package has a Trusted Publisher connection to `open-wa/wa-automate-nodejs`, workflow `release.yml`, environment `Release`. The workflow grants `id-token: write` and uses npm 11 on Node 24. npm requires a package to exist before its Trusted Publisher can be configured, so first publication of a new package needs an authenticated maintainer publish.

The built-in `GITHUB_TOKEN` creates Bumpy's version PR and publishes to GitHub Packages. GitHub does not trigger other workflows from PRs created with this token; merging the version PR still triggers the release push. `GOOGLE_API_KEY` optionally adds an AI summary to release notes. Set `DISCORD_WEBHOOK_URL` in the repository or `Release` environment secrets before publishing; the aggregate release fails visibly without it.

## Local commands

```bash
pnpm bump                         # create a bump file
pnpm exec bumpy status            # inspect pending bumps
pnpm version-packages             # consume bump files locally
pnpm publish-packages             # publish unpublished versions locally
```

`tools/release/publish-github-packages.sh` is the CI step for GitHub Packages. It receives the package names from Bumpy's publish plan, skips versions already present, and packs each missing package with pnpm before publishing with `GITHUB_TOKEN`. When npm is already published, the step reconciles every public package so a failed GitHub Packages publish can be retried by pushing `release` again. The aggregate GitHub release is also resumed if its npm version exists but its `vX.Y.Z` release does not.

`generate-notes.ts` writes `RELEASE_BODY.md` and `release-notes-detailed.md`. `release-image.js` renders `release.png` and numbered pages from those notes and the package changelogs. The images are required for the aggregate GitHub release. New releases automatically announce on Discord: `discord-notify.ts` sends the cover and page batches as visible file attachments and checks that Discord returned every file.

To repair or announce an existing GitHub release without republishing packages, dispatch `.github/workflows/release.yml` on the `release` branch with its `version` input (for example, `5.0.0`). It reads that release's body and replaces its image assets. Review the notes and images first, then dispatch with `publish_discord=true` to post them to Discord. Pass every existing message ID in `discord_message_ids` (cover first, followed by each page batch) to update an announcement; omitting the IDs creates new messages. New releases published by a push to `release` post automatically. Manual dispatches keep `publish_discord=false` by default so rerendering alone does not repost the announcement. When editing, the notifier updates existing batches, adds any extra batches, and removes surplus supplied batches only after all replacement images are confirmed.

## Changelog articles

Write the release breakdown alongside the feature work in `apps/docs/content/docs/releases/`. Add `release` frontmatter with `version`, an ISO publication `date`, `headline`, ordered `highlights`, and optional `audience` and cover `image`. This gives the same MDX article a dated entry at `/changelog` and a permanent `/changelog/VERSION` URL; existing documentation links keep working.

Lead with the user-facing change, explain what it enables, include a short usable example and upgrade guidance, then cover limitations and smaller fixes. Group dependency sync and coordinated bumps at the end. Use the actual release changes as the source, and publish the article with the release. The site renders the checked-in explanation; it does not generate new claims at request time.

## Release image content

The cover leads with the feature headline. Set `headline`, `summary`, `badge`, and an optional ordered `packages` list for a release in `tools/release/image-highlights.json`. Without an editorial entry, the renderer uses the leading changelog heading or release title and the first change summary. Keep cover copy short enough to read in a Discord thumbnail.

Changes are ordered by security/breaking impact, then major, minor and patch significance; editorial package order breaks ties. Identical entries shared by several packages appear once with the affected packages. Version alignment and dependency-only entries are collected in one final section. Packages, integrations and SDKs are included, along with independently versioned companions changed since the preceding aggregate release.

Markdown is rendered by GitHub's `POST /markdown` API in GFM mode, including headings, nested lists, code fences, links, emphasis and tables. Local rendering uses `gh` authentication; the workflow supplies `GH_TOKEN`. Pagination measures the rendered HTML and keeps headings with their following content. Oversized blocks fail visibly rather than being silently cropped.
