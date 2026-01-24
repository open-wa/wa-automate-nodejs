# Issue #05b: Build Cleanup - Relocate Generated Files

**Priority**: MEDIUM  
**Effort**: 0.5 day  
**Risk**: LOW  
**Depends on**: 05a  
**Blocks**: Clean package structure

---

## Problem Statement

Generated files are currently in `packages/schema/src/generated/`, which:
- Mixes generated code with source code
- Makes it unclear what's hand-written vs generated
- Can cause IDE confusion and slow performance

---

## Step 1: Move Generated Directory

### Current Structure
```
packages/schema/
├── src/
│   ├── generated/          # BAD: generated files in src
│   │   ├── BaseClient.ts
│   │   ├── types.ts
│   │   └── openapi.json
│   ├── methods/
│   └── index.ts
└── dist/
```

### Proposed Structure
```
packages/schema/
├── src/                    # Hand-written source only
│   ├── methods/
│   └── index.ts
├── generated/              # GOOD: generated files separate
│   ├── BaseClient.ts
│   ├── types.ts
│   ├── openapi.json
│   └── index.ts
└── dist/
```

---

## Step 2: Update Generator Scripts

### gen-client-implementation.ts

**File**: `packages/schema/scripts/gen-client-implementation.ts`

```typescript
// Change from:
const generatedDir = path.join(__dirname, '../src/generated');

// To:
const generatedDir = path.join(__dirname, '../generated');
```

### gen-openapi.ts

**File**: `packages/schema/scripts/gen-openapi.ts`

```typescript
// Change from:
const generatedDir = path.join(__dirname, '../src/generated');

// To:
const generatedDir = path.join(__dirname, '../generated');
```

### gen-types.ts

**File**: `packages/schema/scripts/gen-types.ts`

```typescript
// Change from:
const generatedDir = path.join(__dirname, '../src/generated');

// To:
const generatedDir = path.join(__dirname, '../generated');
```

---

## Step 3: Create generated/index.ts

**File**: `packages/schema/generated/index.ts`

```typescript
// Re-export all generated content
export * from './BaseClient';
export * from './types';

// Note: openapi.json should be imported directly if needed
// import openapi from '@open-wa/schema/generated/openapi.json';
```

---

## Step 4: Update package.json Exports

**File**: `packages/schema/package.json`

```json
{
    "name": "@open-wa/schema",
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
        },
        "./generated/openapi.json": "./generated/openapi.json"
    },
    "scripts": {
        "clean": "rm -rf dist generated",
        "generate": "ts-node scripts/gen-types.ts && ts-node scripts/gen-openapi.ts && ts-node scripts/gen-client-implementation.ts",
        "build:generated": "tsc -p tsconfig.generated.json",
        "build:src": "tsc",
        "build": "pnpm clean && pnpm generate && pnpm build:src",
        "dev": "tsc --watch"
    }
}
```

---

## Step 5: Update tsconfig.json

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

**File**: `packages/schema/tsconfig.generated.json` (NEW)

```json
{
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "rootDir": "./generated",
        "outDir": "./generated",
        "declaration": true
    },
    "include": ["generated/**/*.ts"],
    "exclude": ["generated/**/*.d.ts"]
}
```

---

## Step 6: Update Imports

### In hono-server.ts

```typescript
// Change from:
import { BaseClient } from '@open-wa/schema/src/generated/BaseClient';

// To:
import { BaseClient } from '@open-wa/schema/generated';
```

### In other consuming packages

Search for `@open-wa/schema/src/generated` and replace with `@open-wa/schema/generated`.

---

## Step 7: Clean Up Old Location

```bash
#!/bin/bash
cd /Users/Mohammed/projects/tools/wa

# Remove old generated directory
rm -rf packages/schema/src/generated

# Remove from git tracking if still there
git rm -r --cached packages/schema/src/generated 2>/dev/null || true

echo "Old generated directory removed"
```

---

## Step 8: Verify Build

```bash
cd /Users/Mohammed/projects/tools/wa

# Clean everything
pnpm clean

# Rebuild
pnpm build

# Check that generated files are in the right place
ls packages/schema/generated/
# Should show: BaseClient.ts, types.ts, openapi.json, index.ts

# Check that src has no generated directory
ls packages/schema/src/generated 2>/dev/null && echo "ERROR: src/generated still exists!" || echo "OK: src/generated removed"

# Check that imports work
pnpm exec tsc --noEmit -p packages/wa-automate
```

---

## Verification Checklist

- [ ] `packages/schema/generated/` exists after build
- [ ] `packages/schema/src/generated/` does NOT exist
- [ ] `pnpm build` succeeds
- [ ] Imports from `@open-wa/schema/generated` work
- [ ] All consuming packages compile without errors
- [ ] OpenAPI JSON is accessible at `@open-wa/schema/generated/openapi.json`

---

## Expected Outcomes

| Before | After |
|--------|-------|
| `src/generated/BaseClient.ts` | `generated/BaseClient.ts` |
| Generated mixed with source | Clear separation |
| Confusing IDE indexing | Better IDE performance |
| Unclear what to edit | src = editable, generated = don't touch |
