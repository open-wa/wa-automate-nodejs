# Contributing to open-wa (v5)

This repo is a pnpm + Turborepo monorepo containing the v5 runtime, Easy API,
schema/registry, drivers, integrations, docs, and orchestrator.

## Toolchain

| Tool | Version | Why |
| --- | --- | --- |
| Node.js | `>=22.21.1` | root `engines.node` |
| pnpm | `11.9.x` | root `packageManager` |

The exact versions are pinned in [`mise.toml`](./mise.toml). If you use
[mise](https://mise.jdx.dev):

```bash
mise install     # installs the pinned Node + pnpm
mise run install # pnpm install
```

Without mise, install Node 22.21+ and pnpm 11.9 yourself (e.g. via Corepack:
`corepack enable && corepack prepare pnpm@11.9.0 --activate`).

## Common commands

```bash
pnpm install     # install dependencies
pnpm build       # build all packages (excludes docs)
pnpm typecheck   # typecheck all packages
pnpm test        # run the test suite
pnpm lint        # oxlint
```

The docs site is built separately: `pnpm --filter docs build`.

## Browser automation dependencies

The runtime drives a real browser, so some packages need system-level browser
support:

- **Puppeteer / Playwright** download or use a Chromium build. On CI and
  Docker the browser download is skipped (`PUPPETEER_SKIP_DOWNLOAD=1`) and a
  system Chrome is used instead (`WA_EXECUTABLE_PATH`).
- On Linux you need the usual headless-Chrome shared libraries. The full list
  is in [`apps/docker/Dockerfile`](./apps/docker/Dockerfile) — the simplest way
  to get a known-good browser environment is to build and run that image, or
  use it as the base for a devcontainer.
- **Do not pass `--single-process` / `--no-zygote`** as Chromium args. They
  crash WhatsApp Web with `Navigating frame was detached` on modern Chrome
  (the runtime strips them by default; see the browser-args guidance in the
  docs).

## Docker

`apps/docker/Dockerfile` builds the full runtime image (Node 22 + Google
Chrome). Use it when you want a reproducible browser-ready environment or as a
devcontainer base.

## Commit convention

Commits follow the gitmoji Conventional Commit policy in [`AGENTS.md`](./AGENTS.md).

Example:

```text
🐛 fix(core): strip --single-process from chromiumArgs
```

## Before opening a PR

Run the baseline locally and make sure it passes:

```bash
pnpm install && pnpm build && pnpm typecheck && pnpm test && pnpm lint
```

If a docs-affecting change touches the schema/registry or generated reference,
regenerate docs (`pnpm --filter @open-wa/schema generate`) and commit the
result — do not hand-edit generated files.
