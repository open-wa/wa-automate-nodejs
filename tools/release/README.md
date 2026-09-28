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

`generate-notes.ts` writes `RELEASE_BODY.md` and `release-notes-detailed.md`. `release-image.js` renders `release.png` from those notes and the package changelogs. The image is required for the aggregate GitHub release and Discord announcement, so a render failure stops the announcement after package publication instead of uploading a stale image. `discord-notify.ts` sends the notes and image together and requires Discord to return a message ID.

To repair or announce an existing GitHub release without republishing packages, dispatch `.github/workflows/release.yml` on the `release` branch with its `version` input (for example, `5.0.0`). It reads that release's body, replaces its image asset, and posts the image and notes to Discord. Dispatching it again posts another Discord message.
