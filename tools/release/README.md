# Release Tools

Scripts for testing and executing the `@open-wa` release pipeline.

## Quick Start: Dry Run

Test the entire release pipeline locally before going live on npmjs and GitHub Packages:

```bash
# Run the full dry run (build → publish to Verdaccio → generate notes → verify)
./tools/release/dry-run.sh

# Keep Verdaccio running to browse published packages
./tools/release/dry-run.sh --keep-verdaccio

# Skip build (use existing dist/ output)
./tools/release/dry-run.sh --skip-build

# Specify a different port
./tools/release/dry-run.sh --port 4874
```

Then open http://localhost:4873 to browse the locally published packages.

## Scripts

### `dry-run.sh`

Full pipeline orchestrator. Starts a local Verdaccio registry, builds all packages, publishes them, generates release notes + image, and runs a test install to verify everything resolves correctly.

**Options:**

| Flag               | Description                                    |
| ------------------ | ---------------------------------------------- |
| `--skip-build`     | Skip `turbo build` (use existing `dist/`)      |
| `--skip-image`     | Skip release image generation                  |
| `--skip-install`   | Skip test-install verification                 |
| `--keep-verdaccio` | Keep Verdaccio running after the script exits  |
| `--port PORT`      | Verdaccio port (default: 4873)                 |
| `--bump TYPE`      | Version bump type: `patch` / `minor` / `major` |

### `publish-packages.sh`

CI publish wrapper used by `pnpm publish-packages`. It builds once with `pnpm build`, then publishes changed packages through Changesets. Stable versions go to npm's `latest` tag. The script never edits the project `.npmrc`; it creates temporary npmrc files and deletes them on exit.

Publish order:

1. npmjs, when `NPM_TOKEN` is set.
2. GitHub Packages, when `GITHUB_TOKEN` is set.

GitHub Packages uses the `@open-wa` scope registry (`https://npm.pkg.github.com`) and `--no-git-tag` when the installed Changesets CLI supports it, so the second registry publish does not try to create the same git tags again. Prerelease tags are supplied by Changesets pre mode when it is active; the stable release has exited pre mode.

```bash
pnpm publish-packages
```

### `generate-notes.ts`

AI-powered release notes generator. Reads git history and per-package changelogs, then produces a polished Markdown summary.

```bash
# With AI summary (requires GOOGLE_API_KEY)
GOOGLE_API_KEY=xxx pnpm tsx tools/release/generate-notes.ts

# Without AI (structured template)
pnpm tsx tools/release/generate-notes.ts

# Specify version
pnpm tsx tools/release/generate-notes.ts --version 5.0.0
```

**Output:** `RELEASE_BODY.md` (for GitHub Release) and `release-notes-detailed.md` (full commit log).

### `discord-notify.ts`

Posts a rich Discord embed with version info, highlights, and release image.

```bash
DISCORD_WEBHOOK_URL=xxx pnpm tsx tools/release/discord-notify.ts --version 5.0.0
```

### `ensure-changeset.ts`

Legacy helper for creating a changeset from a bump type. The release workflow uses changesets committed on `master` and does not invoke this script.

```bash
pnpm tsx tools/release/ensure-changeset.ts --bump minor
```

## CI/CD Workflows

### Release (`release.yml`)

Triggered on push to the `release` branch. Flow:

1. Run `changesets/action` to create a version PR when changesets exist, or publish an already versioned package set through `pnpm publish-packages`
2. Generate release notes (Gemini when configured)
3. Generate the optional release image (Puppeteer)
4. Create the GitHub Release with notes and the image when available
5. Post to Discord

**Required secrets and permissions:**

- `NPM_TOKEN` — npmjs publish token with write access to `@open-wa/*`
- `GITHUB_TOKEN` — built in to GitHub Actions; used for GitHub Packages
- `packages: write` — required workflow permission for GitHub Packages publish
- `GOOGLE_API_KEY` — Gemini API key for release notes
- `DISCORD_WEBHOOK_URL` — Discord webhook for notifications

### PR Docs Check (`pr-docs-check.yml`)

Runs on PRs targeting `release`. Posts a checklist comment checking:

- Changeset presence
- Versioned manifests when no changeset remains
- README/description/exports for changed packages

## Version Strategy

The 27 packages listed in `.changeset/config.json` form a **fixed version group**. Other public packages can also receive version updates when their workspace dependencies change. For this v5 release, all 32 public packages are versioned `5.0.0`.

- Changeset frontmatter controls the bump type for the fixed group.
- Published packages must use compatible workspace dependency versions; inspect the packed manifests before release.

## Branch Strategy

```
master ─────────────────────── (latest development)
           \
            └──── release ──── (triggers CI release pipeline)
```

1. Commit development and changesets to `master`.
2. Merge the Changesets version PR so public packages receive their release versions.
3. Reconcile `release` to the intended `master` commit. A push to `release` triggers the publish workflow.
4. Verify npm `latest`, GitHub Packages, and the GitHub Release after the workflow finishes.
