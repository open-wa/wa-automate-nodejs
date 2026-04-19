# Release Tools

Scripts for testing and executing the `@open-wa` release pipeline.

## Quick Start: Dry Run

Test the entire release pipeline locally before going live on npm:

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

| Flag | Description |
|---|---|
| `--skip-build` | Skip `turbo build` (use existing `dist/`) |
| `--skip-image` | Skip release image generation |
| `--skip-install` | Skip test-install verification |
| `--keep-verdaccio` | Keep Verdaccio running after the script exits |
| `--port PORT` | Verdaccio port (default: 4873) |
| `--bump TYPE` | Version bump type: `patch` / `minor` / `major` |

### `generate-notes.ts`

AI-powered release notes generator. Reads git history and per-package changelogs, then produces a polished Markdown summary.

```bash
# With AI summary (requires GOOGLE_API_KEY)
GOOGLE_API_KEY=xxx pnpm tsx tools/release/generate-notes.ts

# Without AI (structured template)
pnpm tsx tools/release/generate-notes.ts

# Specify version
pnpm tsx tools/release/generate-notes.ts --version 5.0.0-alpha.2
```

**Output:** `RELEASE_BODY.md` (for GitHub Release) and `release-notes-detailed.md` (full commit log).

### `discord-notify.ts`

Posts a rich Discord embed with version info, highlights, and release image.

```bash
DISCORD_WEBHOOK_URL=xxx pnpm tsx tools/release/discord-notify.ts --version 5.0.0-alpha.2
```

### `ensure-changeset.ts`

Auto-creates a changeset file if none exists. Used by the CI release workflow to auto-generate changesets based on PR labels (`bump:major`, `bump:minor`, or default `patch`).

```bash
pnpm tsx tools/release/ensure-changeset.ts --bump minor
```

## CI/CD Workflows

### Release (`release.yml`)

Triggered on push to the `release` branch. Flow:

1. Detect version bump from merged PR labels (`bump:major`, `bump:minor`, or default `patch`)
2. Auto-create changeset if none exists
3. Run `changesets/action` to version and publish
4. Generate AI release notes (Gemini)
5. Generate release image (Puppeteer)
6. Create GitHub Release with notes + image
7. Post to Discord

**Required secrets:**
- `NPM_TOKEN` — npm publish token
- `GOOGLE_API_KEY` — Gemini API key for release notes
- `DISCORD_WEBHOOK_URL` — Discord webhook for notifications

### PR Docs Check (`pr-docs-check.yml`)

Runs on PRs targeting `release`. Posts a checklist comment checking:
- Changeset presence
- Version bump label
- README/description/exports for changed packages

## Version Strategy

All `@open-wa/*` packages are in a **fixed version group** (see `.changeset/config.json`). This means:

- **Every release bumps ALL packages** to the same version
- Users always know what works with what based on semver
- PR labels control the bump type:
  - No label → `patch` (default)
  - `bump:minor` → `minor`
  - `bump:major` → `major`

## Branch Strategy

```
main ───────────────────────── (latest development)
           \
            └──── release ──── (triggers CI release pipeline)
```

1. All development happens on `main`
2. When ready to release, merge `main` → `release` via PR
3. Add `bump:minor` or `bump:major` label to the PR if needed
4. Merge triggers the release workflow
