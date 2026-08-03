# Repository Instructions

## Commit Policy

All commits created for this repository must use gitmoji-prefixed Conventional
Commit messages.

Format:

```text
<gitmoji> <type>(<scope>): <description>
```

The scope is optional. Keep the description imperative, concise, and no longer
than 72 characters when practical.

### No AI attribution

Never add AI attribution to commits or pull requests. Do **not** include
`Co-Authored-By: Claude`, `Generated with Claude Code`, `🤖`, or any similar
"written by AI" trailer, footer, or line in commit messages or PR
descriptions. Commits and PRs must read as authored by the human maintainer.

Examples:

- `✨ feat(api): add user authentication endpoints`
- `🐛 fix(webapp): resolve login redirect loop`
- `♻️ refactor(db): normalize user schema relations`
- `📝 docs: update API documentation`
- `⬆️ chore(deps): upgrade TanStack Query to v5.62`
- `🗃️ feat(db): add posts table with privacy levels`
- `✅ test(api): add auth middleware tests`

### Commit Grouping

When committing uncommitted work, analyze both staged and unstaged changes before
creating commits:

```bash
git status --porcelain
git diff --stat
git diff --cached --stat
```

Group changes into atomic commits in this priority order:

1. By feature or task.
2. By package or app.
3. By change type.
4. By file type or configuration purpose.

Use these grouping heuristics:

- Schema changes plus migrations belong in one database commit.
- API route changes and their tests belong in one commit.
- Multiple files in the same feature directory usually belong in one commit.
- Configuration files should be grouped by purpose.
- Documentation updates should usually be separate.
- Dependency changes should be separate, and lockfile changes must be committed
  with the corresponding manifest changes.

### Gitmoji Reference

| Emoji | Type | Use When |
| --- | --- | --- |
| ✨ | feat | New features, packages, API endpoints, or components |
| 🐛 | fix | Bug fixes |
| 🚑️ | fix | Critical production hotfixes |
| ♻️ | refactor | Code restructuring without behavior changes |
| 📝 | docs | README, comments, API docs, or other documentation |
| 🎨 | style | Code formatting or lint fixes |
| ⚡️ | perf | Performance optimizations |
| ✅ | test | Adding or updating tests |
| 🔧 | chore | Configuration changes |
| 🔨 | chore | Development scripts, build scripts, or tooling |
| ⬆️ | chore | Dependency upgrades |
| ⬇️ | chore | Dependency downgrades |
| ➕ | chore | Adding dependencies |
| ➖ | chore | Removing dependencies |
| 🗃️ | feat/fix | Database schema, migrations, seeds, or data fixes |
| 💄 | style | UI styling, CSS, or design token changes |
| 🏗️ | refactor | Major architectural changes |
| 🔥 | chore | Removing code or files |
| 🚚 | refactor | Moving or renaming files |
| 🏷️ | feat | Adding or updating TypeScript types |
| 🔒️ | fix | Security fixes |
| 👷 | chore | CI pipeline changes |
| 💚 | fix | Fixing CI/CD failures |
| 🚨 | style | Fixing linter or compiler warnings |
| 🩹 | fix | Minor non-critical fixes |
| 🧱 | chore | Infrastructure changes |
| 🌐 | feat | Internationalization or localization |
| 💡 | docs | Source code comments |
| 🙈 | chore | `.gitignore` updates |
| 🔖 | chore | Releases, versions, or tags |

Choose the most specific emoji for the change. Avoid `✨` unless the commit
really introduces a feature or package. Prefer `🗃️` for database changes and
`🏷️` for type-only changes. For mixed commits, choose the emoji that matches the
primary purpose.

### Commit Safety

- Never commit `.env` files, secrets, `node_modules/`, or generated build
  artifacts unless the user explicitly asks for a tracked artifact.
- Check staged content before committing so sensitive files are not included.
- Run `git status` after each commit to verify the remaining work.
- If pushing, check the current branch first and warn before pushing directly to
  `main` or `master`.
- Do not force push unless the user explicitly requests it.

### Push Workflow

When the user asks to commit and push all current work:

1. Inspect the full working tree, including staged and unstaged changes.
2. Split changes into the logical atomic commits described above.
3. Stage only the files for the current logical group.
4. Commit with the required gitmoji Conventional Commit message.
5. Verify `git status` after every commit.
6. Push after all commits are created.

If the current branch has no upstream, use:

```bash
git push -u origin <branch-name>
```

If the push fails because the remote has diverged or conflicts are required,
stop and report the issue instead of forcing a push.

## Release Process

Publishing is driven by Changesets and the `release` branch — **not** `master`.

- Development and changesets land on `master`. Merging PRs to `master` never
  publishes.
- The **`release`** branch is a publish-trigger mirror of `master`. A push to
  `release` runs `.github/workflows/release.yml`.
- To cut a release:
  1. Reconcile `release` to `master`: `git push origin origin/master:release --force`
     (release is a mirror; its only unique history is auto-generated version/
     changelog commits, which are safe to discard — npm versions are immutable).
  2. That push makes the Changesets action open a **"chore: version packages"**
     PR that bumps the fixed `@open-wa/*` group and consumes the changesets.
  3. Merging that version PR publishes to npm + GitHub Packages, tags, creates
     the GitHub Release (which also deploys the docs), and notifies Discord.
- The alpha train uses Changesets pre-mode (`.changeset/pre.json`, tag `alpha`).
  Do not edit `pre.json` casually.
- `tools/release/publish-packages-local.sh` is intentionally gitignored — it is
  a local-only helper. Do not commit it.

## Repository Gotchas

- **Over-broad `.gitignore` patterns can hide real source files.** A bare
  pattern like `session` matches every `session` path in the repo, silently
  untracking source such as `packages/wa-automate/src/session/`. The code builds
  locally (the file is on disk) but fails in CI's fresh checkout with
  `UNRESOLVED_IMPORT`. Anchor runtime-data ignores to the repo root
  (`/session/`, not `session`). When adding a `.gitignore` rule, run
  `git status --ignored` / `git check-ignore -v <path>` to confirm it does not
  catch tracked source.
- After adding a new source file that other tracked code imports, verify it is
  tracked (`git ls-files <path>`). A build that passes locally but fails only in
  CI is very often an untracked/gitignored file.
