# Issue #4: Build Cleanup and Generated File Hygiene

**Priority**: 🟡 HIGH  
**Effort**: 0.5-1 day  
**Impact**: Professional polish, reduces confusion

---

## Problem Statement

Build artifacts are mixed with source files:

1. Generated files in `packages/schema/src/generated/`
2. Compiled `.js` and `.d.ts` files appearing in `src/` directories
3. Inconsistent `.gitignore` patterns

This causes:
- Git noise (generated files showing as changes)
- Confusion about source of truth
- Potential build issues

---

## Step 1: Clean Generated Files from Git

```bash
# Remove generated files from git tracking (but keep on disk)
cd /Users/Mohammed/projects/tools/wa

# Schema package generated files
git rm --cached packages/schema/src/generated/*.ts 2>/dev/null || true
git rm --cached packages/schema/src/generated/*.json 2>/dev/null || true

# Any .js/.d.ts/.map files in src directories
find packages -path "*/src/*.js" -type f -exec git rm --cached {} \; 2>/dev/null || true
find packages -path "*/src/*.d.ts" -type f -exec git rm --cached {} \; 2>/dev/null || true
find packages -path "*/src/*.js.map" -type f -exec git rm --cached {} \; 2>/dev/null || true
```

---

## Step 2: Update Root .gitignore

**File**: `/Users/Mohammed/projects/tools/wa/.gitignore`

Add these patterns:

```gitignore
# Build outputs
dist/
build/
*.tsbuildinfo

# Generated files (regenerated on build)
**/generated/
packages/schema/src/generated/

# Compiled JS in source directories (should only be in dist/)
packages/**/src/**/*.js
packages/**/src/**/*.js.map
packages/**/src/**/*.d.ts
apps/**/src/**/*.js
apps/**/src/**/*.js.map
apps/**/src/**/*.d.ts

# Test coverage
coverage/

# Dependencies
node_modules/

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Environment
.env
.env.local
.env.*.local

# Session data (demo files)
demo/*.data.json
demo/_IGNORE_*

# Turbo
.turbo/
```

---

## Step 3: Move Generated Files Out of src/

Currently: `packages/schema/src/generated/`
Proposed: `packages/schema/generated/`

### Update gen-client-implementation.ts

```typescript
// Change from:
const generatedDir = path.join(__dirname, '../src/generated');

// To:
const generatedDir = path.join(__dirname, '../generated');
```

### Update gen-openapi.ts

```typescript
// Change from:
const generatedDir = path.join(__dirname, '../src/generated');

// To:
const generatedDir = path.join(__dirname, '../generated');
```

### Update gen-types.ts

```typescript
// Change from:
const generatedDir = path.join(__dirname, '../src/generated');

// To:
const generatedDir = path.join(__dirname, '../generated');
```

### Update package.json exports

**File**: `packages/schema/package.json`

```json
{
    "exports": {
        ".": {
            "require": "./dist/index.js",
            "import": "./dist/index.js",
            "types": "./dist/index.d.ts"
        },
        "./generated": {
            "require": "./generated/index.js",
            "import": "./generated/index.js",
            "types": "./generated/index.d.ts"
        }
    }
}
```

### Create generated/index.ts

**File**: `packages/schema/generated/index.ts`

```typescript
// Re-export all generated content
export * from './BaseClient';
export * from './types';

// Note: openapi.json should be imported directly if needed
```

---

## Step 4: Update tsconfig.json for Schema Package

**File**: `packages/schema/tsconfig.json`

```json
{
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src",
        "composite": true,
        "declaration": true,
        "declarationMap": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "generated", "**/*.test.ts"]
}
```

Create a separate config for generated files if needed:

**File**: `packages/schema/tsconfig.generated.json`

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "rootDir": "./generated",
        "outDir": "./generated"
    },
    "include": ["generated/**/*"]
}
```

---

## Step 5: Update Build Script

**File**: `packages/schema/package.json`

```json
{
    "scripts": {
        "clean": "rm -rf dist generated",
        "generate": "ts-node scripts/gen-types.ts && ts-node scripts/gen-openapi.ts && ts-node scripts/gen-client-implementation.ts",
        "build:generated": "tsc -p tsconfig.generated.json",
        "build:src": "tsc",
        "build": "pnpm clean && pnpm generate && pnpm build:src",
        "dev": "tsc --watch",
        "lint": "eslint src --ext .ts",
        "test": "jest"
    }
}
```

---

## Step 6: Add Generated Directory to .gitignore (Package Level)

**File**: `packages/schema/.gitignore`

```gitignore
# Build output
dist/

# Generated files (regenerated on each build)
generated/

# Test output
coverage/
```

---

## Step 7: Clean Existing Artifacts

Run this cleanup script:

```bash
#!/bin/bash
# cleanup-build-artifacts.sh

cd /Users/Mohammed/projects/tools/wa

echo "Cleaning build artifacts from source directories..."

# Remove .js files from src directories (except demo)
find packages -path "*/src/*.js" -type f -delete
find apps -path "*/src/*.js" -type f -delete

# Remove .d.ts files from src directories
find packages -path "*/src/*.d.ts" -type f -delete
find apps -path "*/src/*.d.ts" -type f -delete

# Remove .js.map files from src directories
find packages -path "*/src/*.js.map" -type f -delete
find apps -path "*/src/*.js.map" -type f -delete

# Remove .d.ts.map files from src directories
find packages -path "*/src/*.d.ts.map" -type f -delete
find apps -path "*/src/*.d.ts.map" -type f -delete

echo "Cleaning old generated directories..."
rm -rf packages/schema/src/generated

echo "Done!"
```

---

## Step 8: Verify Clean Build

```bash
cd /Users/Mohammed/projects/tools/wa

# Clean everything
pnpm clean

# Rebuild
pnpm build

# Check that generated files are in the right place
ls packages/schema/generated/
# Should show: BaseClient.ts, types.ts, openapi.json, index.ts

# Check that src has no compiled files
find packages/schema/src -name "*.js" -o -name "*.d.ts" | wc -l
# Should show: 0
```

---

## Verification Checklist

- [ ] No `.js` files in `packages/*/src/`
- [ ] No `.d.ts` files in `packages/*/src/`
- [ ] `packages/schema/generated/` exists and contains generated files
- [ ] `packages/schema/src/generated/` does NOT exist
- [ ] `git status` shows no generated files as changes
- [ ] `pnpm build` succeeds
- [ ] Imports from `@open-wa/schema/generated` work

---

## Before/After

| Before | After |
|--------|-------|
| `src/generated/BaseClient.ts` | `generated/BaseClient.ts` |
| `.js` files in `src/` | `.js` files only in `dist/` |
| Generated files tracked in git | Generated files ignored |
| 73+ modified files in `git status` | Clean working directory |
