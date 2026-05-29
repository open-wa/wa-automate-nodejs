# @open-wa v5.0.0 — Pre-Release Checklist

> **Purpose**: Walk through every item before publishing v5 to npmjs and GitHub Packages. Each section has a ✅/❌ status. Fix all ❌ (blockers) and decide on ⚠️ (warnings) before releasing.
>
> **How to use**: A reviewer (human or AI) should go through each section, run the listed commands, and check off items as they pass.

---

## 1. 📦 Package Metadata (npm DX)

Every public package needs these fields in `package.json` for a good npmjs and GitHub Packages listing.

> [!IMPORTANT]
> The project license is **Hippocratic + Do Not Harm (H-DNH) Version 1.1** as defined in `/LICENSE.md`. All packages MUST use `"license": "H-DNH V1.0"` in their `package.json`.

### Resolution: `cf-proxy`

`@open-wa/cf-proxy` is a **self-deployable Cloudflare Worker** tool, not an npm package. It has been marked `"private": true` and removed from the changeset fixed group. **No further action needed.**

---

### 1a. `description` — what shows on npmjs.com search results

| Status | Package                      |
| ------ | ---------------------------- |
| ❌     | @open-wa/session-sync        |
| ❌     | @open-wa/ui-components       |
| ✅     | All other 24 public packages |

**Fix**: Add `"description"` to `session-sync/package.json` and `ui-components/package.json`.

---

### 1b. `exports` — proper ESM/CJS entry points

| Status | Package                |
| ------ | ---------------------- |
| ❌     | @open-wa/logger        |
| ❌     | @open-wa/orchestrator  |
| ❌     | @open-wa/session-sync  |
| ❌     | @open-wa/ui-components |
| ❌     | @open-wa/wa-automate   |

**Why it matters**: Without `exports`, bundlers and TypeScript `moduleResolution: "bundler"` can't resolve the package correctly. Users get red squiggles in their IDE.

**Fix**: Add an `"exports"` field pointing to the built entry file(s). Example:

```json
"exports": {
  ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" }
}
```

---

### 1c. `types` — TypeScript type declarations

| Status | Package               |
| ------ | --------------------- |
| ❌     | @open-wa/plugin-sdk   |
| ❌     | @open-wa/screencaster |

**Fix**: Add `"types"` field or include `"types"` in the `"exports"` map.

---

### 1d. `license` — required for npm and corporate users

> [!IMPORTANT]
> Every package MUST have `"license": "H-DNH V1.0"` matching the root `LICENSE.md` (Hippocratic + Do Not Harm Version 1.1).

| Status | Package                          | Current                       |
| ------ | -------------------------------- | ----------------------------- |
| ✅     | @open-wa/hyperemitter            | Apache-2.0 (own license — OK) |
| ✅     | @open-wa/plugin-sdk              | H-DNH V1.0                    |
| ✅     | @open-wa/socket-client           | H-DNH V1.0                    |
| ✅     | @open-wa/wa-automate-types-only  | H-DNH V1.0                    |
| ❌     | **All other 22 public packages** | MISSING                       |

**Why it matters**: npmjs shows "UNLICENSED" on the package page. Corporate users may be blocked from installing. GitHub shows a warning.

**Fix** — batch script:

```bash
for pkg in packages/*/package.json; do
  node -e "
    const fs=require('fs');
    const p=JSON.parse(fs.readFileSync('$pkg','utf8'));
    if(!p.license && !p.private){
      p.license='H-DNH V1.0';
      fs.writeFileSync('$pkg',JSON.stringify(p,null,2)+'\n');
      console.log('✅ Added license to '+p.name);
    }
  "
done
```

---

### 1e. `repository` — links package pages back to GitHub

| Status | Package                |
| ------ | ---------------------- |
| ✅     | All 28 public packages |

All public packages under `packages/*` and `integrations/*` now have a `repository` field. Most point to `https://github.com/open-wa/wa-automate-nodejs.git`; package-specific repositories such as `@open-wa/socket-client`, `@open-wa/node-red`, and `@open-wa/wa-automate-types-only` keep their existing values.

---

## 2. 📝 README Files

Only **3 out of 26** public packages have a README. npmjs and GitHub Packages render the README as the package homepage — a missing README means users see a blank page.

| Status | Package                          |
| ------ | -------------------------------- |
| ✅     | hyperemitter                     |
| ✅     | orchestrator                     |
| ✅     | socket-client                    |
| ❌     | **All other 23 public packages** |

### Priority READMEs (MUST have before release)

These are user-facing entry points — they NEED a real README:

1. **`wa-automate`** — the main package users install
2. **`core`** — the engine
3. **`cli`** — the CLI tool
4. **`client`** — the client library

### Minimum viable README for other packages:

```markdown
# @open-wa/<name>

<one-line description from package.json>

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Install

\`\`\`bash
pnpm add @open-wa/<name>
\`\`\`

## Documentation

See the [docs site](https://docs.openwa.dev).

## License

[H-DNH V1.0](https://github.com/open-wa/wa-automate-nodejs/blob/main/LICENSE.md) — Hippocratic + Do Not Harm
```

---

## 3. 📖 Documentation Coverage (apps/docs)

Every public package should have at least a docs page at `docs.openwa.dev`. Check the docs site for coverage:

### How to verify

```bash
# 1. Build and check the docs locally
cd apps/docs && pnpm dev

# 2. Visit http://localhost:3000 and verify each package has a page
# 3. Check sitemap for package references
curl -s http://localhost:3000/sitemap.xml | grep -i "package\|api\|guide"
```

### Checklist

- [ ] **Getting Started** guide exists and references v5
- [ ] **`@open-wa/wa-automate`** has a dedicated page (install, basic usage, examples)
- [ ] **`@open-wa/cli`** has a dedicated page (commands, flags, examples)
- [ ] **`@open-wa/client`** has a dedicated page (API reference or at least usage)
- [ ] **`@open-wa/core`** is documented (at least architecture overview)
- [ ] **Migration from v4** guide exists (if applicable)
- [ ] **Package overview page** lists all public packages with one-line descriptions
- [ ] **API Reference** links to generated typedocs (if available)
- [ ] Every package's README links back to `docs.openwa.dev`

> [!TIP]
> The docs site at `apps/docs` uses file-based routing. Add new pages in `apps/docs/src/routes/docs/`.

---

## 4. 🔨 Build Output

| Status | Package                          | Notes                                  |
| ------ | -------------------------------- | -------------------------------------- |
| ⚠️     | ui-components                    | No `dist/` — must build before publish |
| ✅     | **All other 25 public packages** | Have `dist/`                           |

**Note**: `cf-proxy` is now private and excluded from releases.

**Action**: Ensure `ui-components` builds. If it has no build script, add one. If it can't produce a `dist/`, it may need to stay private temporarily.

---

## 5. 🏗️ Build & Types Verification

Run these commands and confirm they pass:

```bash
# Full build
pnpm turbo build --filter='!@open-wa/legacy' --filter='!@open-wa/legacy-documented'

# Type check (if tsc is configured)
pnpm turbo typecheck --filter='!@open-wa/legacy' --filter='!@open-wa/legacy-documented'
```

- [ ] Build completes without errors
- [ ] No TypeScript errors in public API surfaces

---

## 6. 🧪 Dry Run Pipeline

```bash
./tools/release/dry-run.sh --keep-verdaccio
```

- [ ] Verdaccio starts and all packages publish
- [ ] Release notes generate (check RELEASE_BODY.md printed in terminal)
- [ ] Release image opens in Preview
- [ ] Changeset content shown in terminal
- [ ] Test install resolves `@open-wa/wa-automate` and its inter-deps
- [ ] Browse http://localhost:4873 and verify package pages look correct

---

## 7. 📋 Changeset & Versioning

```bash
cat .changeset/config.json
```

- [ ] All public packages are in the `fixed` group (currently 27 packages, cf-proxy excluded)
- [ ] `baseBranch` is set to `"main"`
- [ ] `access` is `"public"`
- [ ] No stale test changesets in `.changeset/` (delete `lively-waves-calm.md` if present)

---

## 8. 🔐 Secrets & CI

Verify these exist in **GitHub repo Settings → Secrets** and workflow permissions:

- [ ] `NPM_TOKEN` — npmjs publish token with write access to `@open-wa/*`
- [ ] `GITHUB_TOKEN` — built in to GitHub Actions; no repo secret is needed
- [ ] `packages: write` — set in `.github/workflows/release.yml` for GitHub Packages publishing
- [ ] `GOOGLE_API_KEY` — Gemini API key for release notes
- [ ] `DISCORD_WEBHOOK_URL` — Discord channel webhook

Release publishing should use `pnpm publish-packages`, not manual registry switching. The script builds once, publishes changed packages to npmjs when `NPM_TOKEN` exists, then publishes the same changed `@open-wa/*` packages to GitHub Packages when `GITHUB_TOKEN` exists. It uses temporary npmrc files only, so the root `.npmrc` stays pnpm-only. `.changeset/pre.json` supplies the `alpha` prerelease tag while Changesets pre mode is active.

---

## 9. 🌳 Branch Setup

- [ ] `release` branch exists: `git branch -a | grep release`
- [ ] If not, create it: `git checkout -b release && git push -u origin release`
- [ ] GitHub labels exist: `bump:major`, `bump:minor` (create in repo Settings → Labels)

---

## 10. 📄 Root Project Files

- [ ] Root `README.md` mentions v5 and the monorepo structure
- [ ] Root `LICENSE.md` exists ✅ (H-DNH V1.1)
- [ ] Root `CHANGELOG.md` exists (changesets will update this)
- [ ] Root `package.json` has `"repository"`, `"license"`, and `"description"` fields

---

## 11. 🌐 User-Facing DX Smoke Test

After publishing, a user will run:

```bash
pnpm add @open-wa/wa-automate@5.0.0
```

Verify the following from their perspective:

- [ ] Package installs without peer dependency warnings
- [ ] Main export works: `import { create } from '@open-wa/wa-automate'` (or the actual entry)
- [ ] TypeScript autocomplete works in VS Code (hover over imports, check types)
- [ ] npmjs.com/package/@open-wa/wa-automate and the GitHub Packages page show: description, README, license badge, repository link, correct version

---

## 12. 🧹 Cleanup Before Release

Files to delete before merging to `release`:

```bash
rm -f RELEASE_BODY.md                     # smoke test artifact
rm -f release-notes-detailed.md           # smoke test artifact
rm -f .changeset/lively-waves-calm.md     # test changeset
```

---

## Severity Guide

| Icon | Meaning                                               | Action           |
| ---- | ----------------------------------------------------- | ---------------- |
| ❌   | **Blocker** — must fix before release                 | Fix immediately  |
| ⚠️   | **Warning** — acceptable for alpha, fix before stable | Track in issue   |
| ✅   | **Pass**                                              | No action needed |

---

## Summary of Blockers

| #   | Issue                                     | Impact                         | Fix Effort                    |
| --- | ----------------------------------------- | ------------------------------ | ----------------------------- |
| 1   | **License field missing** on 22 packages  | npm shows "UNLICENSED"         | 🟢 Batch script (1 min)       |
| 3   | **README missing** on 23 packages         | Blank npm homepage             | 🟡 Template + customise top 4 |
| 4   | **`exports` field missing** on 5 packages | Bundler/TS resolution broken   | 🟡 Manual per-package         |
| 5   | **`description` missing** on 2 packages   | Blank on npm search            | 🟢 Quick edit                 |
| 6   | **`types` missing** on 2 packages         | No autocomplete                | 🟡 Check build output         |
| 7   | **`ui-components` no dist/**              | Publish will fail              | 🟡 Add build or mark private  |
| 8   | **Docs coverage** unclear                 | Users can't find documentation | 🟡 Audit docs site            |
