# Issue #05a: Build Cleanup - Gitignore Hygiene

**Priority**: HIGH  
**Effort**: 0.5 day  
**Risk**: LOW  
**Depends on**: None  
**Blocks**: Clean commits, CI reliability

---

## Problem Statement

Build artifacts are tracked in git, causing:
- 73+ modified files showing in `git status` after any build
- Confusion about source of truth (is this file hand-written or generated?)
- Merge conflicts on generated files
- Bloated repository size

---

## Step 1: Update Root .gitignore

**File**: `/Users/Mohammed/projects/tools/wa/.gitignore`

Add/update these patterns:

```gitignore
# ============================================================================
# Build Outputs
# ============================================================================
dist/
build/
*.tsbuildinfo

# ============================================================================
# Generated Files (regenerated on build)
# ============================================================================
**/generated/
packages/schema/src/generated/
packages/schema/generated/

# ============================================================================
# Compiled JS in Source Directories
# These should only exist in dist/, not src/
# ============================================================================
packages/**/src/**/*.js
packages/**/src/**/*.js.map
packages/**/src/**/*.d.ts
packages/**/src/**/*.d.ts.map
apps/**/src/**/*.js
apps/**/src/**/*.js.map
apps/**/src/**/*.d.ts
apps/**/src/**/*.d.ts.map

# ============================================================================
# Dependencies
# ============================================================================
node_modules/
.pnpm-store/

# ============================================================================
# Test Coverage
# ============================================================================
coverage/
.nyc_output/

# ============================================================================
# IDE and Editor
# ============================================================================
.idea/
.vscode/
*.swp
*.swo
*~

# ============================================================================
# OS Files
# ============================================================================
.DS_Store
Thumbs.db

# ============================================================================
# Environment
# ============================================================================
.env
.env.local
.env.*.local
*.env

# ============================================================================
# Session Data (demo files)
# ============================================================================
demo/*.data.json
demo/_IGNORE_*

# ============================================================================
# Turbo Cache
# ============================================================================
.turbo/

# ============================================================================
# Logs
# ============================================================================
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

---

## Step 2: Add Package-Level .gitignore

**File**: `packages/schema/.gitignore`

```gitignore
# Build output
dist/

# Generated files (regenerated on each build)
generated/
src/generated/

# Test output
coverage/
```

**File**: `packages/core/.gitignore`

```gitignore
# Build output
dist/

# Test output
coverage/
```

**File**: `packages/wa-automate/.gitignore`

```gitignore
# Build output
dist/

# Test output
coverage/
```

---

## Step 3: Remove Tracked Generated Files

```bash
#!/bin/bash
# cleanup-git-tracking.sh

cd /Users/Mohammed/projects/tools/wa

echo "Removing generated files from git tracking..."

# Schema package generated files
git rm --cached packages/schema/src/generated/*.ts 2>/dev/null || true
git rm --cached packages/schema/src/generated/*.json 2>/dev/null || true
git rm --cached -r packages/schema/src/generated 2>/dev/null || true

# Any .js/.d.ts/.map files in src directories
find packages -path "*/src/*.js" -type f -exec git rm --cached {} \; 2>/dev/null || true
find packages -path "*/src/*.d.ts" -type f -exec git rm --cached {} \; 2>/dev/null || true
find packages -path "*/src/*.js.map" -type f -exec git rm --cached {} \; 2>/dev/null || true
find packages -path "*/src/*.d.ts.map" -type f -exec git rm --cached {} \; 2>/dev/null || true

echo "Done! Now commit with: git commit -m 'chore: remove generated files from tracking'"
```

---

## Step 4: Clean Build Artifacts from Disk

```bash
#!/bin/bash
# cleanup-build-artifacts.sh

cd /Users/Mohammed/projects/tools/wa

echo "Cleaning build artifacts from source directories..."

# Remove .js files from src directories
find packages -path "*/src/*.js" -type f -delete
find apps -path "*/src/*.js" -type f -delete

# Remove .d.ts files from src directories
find packages -path "*/src/*.d.ts" -type f -delete
find apps -path "*/src/*.d.ts" -type f -delete

# Remove .map files from src directories
find packages -path "*/src/*.js.map" -type f -delete
find packages -path "*/src/*.d.ts.map" -type f -delete

echo "Done!"
```

---

## Verification Checklist

- [ ] `git status` shows only intentional changes
- [ ] `pnpm build` succeeds
- [ ] No `.js` files in `packages/*/src/`
- [ ] No `.d.ts` files in `packages/*/src/`
- [ ] Generated files are not tracked in git
- [ ] Fresh clone + `pnpm install && pnpm build` works

---

## Expected Outcomes

| Before | After |
|--------|-------|
| 73+ modified files after build | Clean working directory |
| Generated files in git history | Generated files ignored |
| Merge conflicts on generated files | No more conflicts |
| Confusion about source of truth | Clear: src = source, dist = output |
