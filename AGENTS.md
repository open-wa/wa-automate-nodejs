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
