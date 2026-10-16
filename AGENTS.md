# Repository Instructions

## Immutable browser asset

`packages/core/src/transport/assets/wapi.js` is **IMMUTABLE**. Never edit it.
All new or changed injected WhatsApp runtime code belongs in the patches in
`/Users/Mohammed/projects/self/idkuno/smashahdotdev/functions/`, including bug
fixes and new WAPI methods. SDK client bindings, schemas and documentation can
change in this repository; the injected implementations must arrive through
the patch pipeline before WAPI is locked. Generate patch bundles from their
source files rather than editing generated bundles by hand.

## Backward compatibility

Backward compatibility is out of scope unless Mohammed explicitly requests or authorizes it for the task. Do not investigate, propose, implement, or preserve compatibility shims, legacy fallbacks, old-format readers, key-rotation contingencies, or migration paths solely to support previous behaviour without that instruction. Do not routinely raise compatibility concerns or ask whether compatibility is needed; assume the answer is no and implement the current design. A general request to implement, fix, or release is not authorization for compatibility work. This applies even when a project has existing users. Preserve unrelated work and data.

## Commit Policy

All commits created for this repository must use gitmoji-prefixed Conventional
Commit messages.

Format:

```text
<gitmoji> <type>(<scope>): <description>
```

The scope is optional. Keep the description imperative, concise, and no longer
than 72 characters when practical.

### Issue references

Every commit for work related to an issue must append that issue reference to
the commit message. Use a final `Refs #123` paragraph by default; use
`Fixes #123` only when the commit fully resolves that issue. Include all known
relevant issues, including for supporting documentation, tests, and follow-up
fixes. A reference on a PR alone is not sufficient.

```text
🐛 fix(session): recover unusable sessions with fresh QR pairing

Refs #3550
```

Use the full issue URL for an issue in another repository. Do not substitute
PR numbers for issue references, invent references, or create an issue merely
to give an unrelated commit a reference. Release notes must link the referenced
issues alongside the commits.

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
- Development commits go directly to `master`; do not create development PRs
  unless Mohammed asks for one. Check the current branch before pushing.
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

Publishing is driven by Bumpy and the `release` branch.

- Push development and bump files directly to `master`. Pushing there deploys affected
  docs, but does not publish packages.
- Put package bump intent in `.bumpy/*.md`; `.bumpy/_config.json` defines the
  fixed package group and publication settings.
- Post `/release` on an issue or run `gh workflow run comment-run.yml --ref master`.
  The Prepare release workflow consumes the bump files, commits versions and
  changelogs directly to `master`, and opens or reuses one `master` → `release` PR.
- Merge that normal promotion PR to publish using npm trusted publishing,
  publish GitHub Packages, and create the aggregate GitHub release. Versions
  already live on `master`; do not create separate Bumpy version or sync PRs.
  Preserve release-only history; do not force-push or bypass protections.
- Preparation, package publishing, availability tracking, release notes, and
  documentation deployment are separate actions. Publishing calls `bumpy publish`,
  never the Bumpy version-PR path. Bumps arriving during promotion are consumed
  directly and their versions are merged back to `master` without another PR.
- Generate standard release notes from commit messages between aggregate tags.
  Use plain section headings, an emoji per entry, an inline concern, commit links,
  and related issue links. Keep concerns together and sort concerns and entries
  newest first. Omit merge/version bookkeeping and deduplicate repeated changes.
  Do not automatically generate AI copy, blog posts, CMS entries, or release images.
  Significant editorial releases are authored directly with Mohammed.
- New aggregate releases normally announce on Discord. If the authorized
  release excludes announcements, include `[skip-discord]` in the release PR's
  **merge commit message**. The release notes action posts one concise announcement
  after npm availability and documentation deployment are confirmed. Save its
  message ID in `release-state.json`; reruns edit that message. An announcement
  failure does not republish packages.
- Confirm registry versions and the workflow conclusion before reporting a
  package as released. A merged development PR is not a published package.
- npm can accept a version while its public manifest and tarball still return 404.
  Track that validation in the availability action; do not reupload an accepted
  version. Record manifest, dist-tag, tarball and docs deployment completion in
  the aggregate release's `release-state.json` asset. Rerun the failed action for
  that version independently, without opening another PR or publishing again.
- Stable packages publish under npm's `latest` tag. Do not reintroduce
  Changesets pre-mode.
- `gh-signoff` can record checks Mohammed requested and actually ran. It does
  not run checks itself. Do not install a required signoff ruleset or add a
  release gate unless Mohammed explicitly asks for one.
- `tools/release/publish-packages-local.sh` is intentionally gitignored and
  local-only. Do not commit it.

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
