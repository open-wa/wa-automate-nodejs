# Issue #5: TypeScript Strictness Improvements

**Priority**: 🟢 MEDIUM  
**Effort**: 2-3 days (incremental)  
**Impact**: Improved type safety, fewer runtime errors

---

## Problem Statement

TypeScript is configured with relaxed settings for legacy compatibility:

```json
// Current tsconfig.json (various packages)
{
    "compilerOptions": {
        "strict": false,
        "noImplicitAny": false,
        // etc.
    }
}
```

This allows type errors to slip through, causing runtime issues.

---

## Strategy: Incremental Ratchet

Don't flip strict on globally. Use a phased approach:

1. **Phase 1**: Make `@open-wa/schema` strict (it's the boundary layer)
2. **Phase 2**: Add non-blocking strict checks to CI
3. **Phase 3**: Migrate packages one at a time
4. **Phase 4**: Require new files to be strict

---

## Step 1: Make @open-wa/schema Strict

**File**: `packages/schema/tsconfig.json`

### Current
```json
{
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src"
    },
    "include": ["src/**/*"]
}
```

### Proposed
```json
{
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src",
        "composite": true,
        "declaration": true,
        "declarationMap": true,
        
        // Strict settings (schema should be maximally type-safe)
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "strictBindCallApply": true,
        "strictPropertyInitialization": true,
        "noImplicitThis": true,
        "alwaysStrict": true,
        
        // Additional safety
        "noUncheckedIndexedAccess": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noImplicitOverride": true,
        
        // Import helpers
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

## Step 2: Fix Type Errors in Schema Package

After enabling strict mode, you'll likely see errors. Here are common patterns:

### Pattern 1: Implicit any in callbacks

```typescript
// Before (error: Parameter 'x' implicitly has 'any' type)
methods.forEach((method) => {
    // ...
});

// After
methods.forEach((method: CapabilityDefinition) => {
    // ...
});
```

### Pattern 2: Possible undefined

```typescript
// Before (error: Object is possibly 'undefined')
const name = meta.functionName;

// After (option 1: assert)
const name = meta.functionName!;

// After (option 2: check)
if (!meta.functionName) throw new Error('Missing functionName');
const name = meta.functionName;
```

### Pattern 3: Index signatures

```typescript
// Before (error: Element implicitly has 'any' type)
const value = obj[key];

// After
const value = obj[key as keyof typeof obj];

// Or use Map instead of object
const map = new Map<string, T>();
const value = map.get(key);
```

---

## Step 3: Add Strict tsconfig for CI

Create a strict config that can be run in CI without breaking builds:

**File**: `packages/*/tsconfig.strict.json`

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "noUncheckedIndexedAccess": true,
        "noEmit": true
    }
}
```

**Add to CI workflow**:

```yaml
# .github/workflows/ci.yml
jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      
      # Non-blocking strict check
      - name: Strict TypeScript Check (informational)
        run: pnpm exec tsc -p packages/schema/tsconfig.strict.json || true
        continue-on-error: true
```

---

## Step 4: Package-by-Package Migration Order

Migrate in order of criticality and dependency:

| Order | Package | Reason |
|-------|---------|--------|
| 1 | `@open-wa/schema` | Boundary layer, most critical |
| 2 | `@open-wa/logger` | Small, standalone |
| 3 | `@open-wa/wa-decrypt` | Small, focused |
| 4 | `@open-wa/hyperemitter` | New code, should be clean |
| 5 | `@open-wa/socket-client` | Client-facing |
| 6 | `@open-wa/session-sync` | Relatively small |
| 7 | `@open-wa/core` | Large, complex (defer) |
| 8 | `@open-wa/wa-automate` | Large, server code (defer) |
| 9 | `@open-wa/orchestrator` | Legacy code (defer) |

---

## Step 5: Require Strict for New Files

Use ESLint to enforce stricter typing on new code:

**File**: `.eslintrc.json`

```json
{
    "parser": "@typescript-eslint/parser",
    "plugins": ["@typescript-eslint"],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "rules": {
        // Warn on any usage in new code
        "@typescript-eslint/no-explicit-any": "warn",
        
        // Error on implicit any
        "@typescript-eslint/no-implicit-any": "error",
        
        // Require explicit return types on public methods
        "@typescript-eslint/explicit-function-return-type": ["warn", {
            "allowExpressions": true,
            "allowTypedFunctionExpressions": true
        }],
        
        // Prevent unused variables
        "@typescript-eslint/no-unused-vars": ["error", {
            "argsIgnorePattern": "^_"
        }]
    },
    "overrides": [
        {
            // More lenient for legacy files
            "files": ["packages/core/**/*.ts", "packages/orchestrator/**/*.ts"],
            "rules": {
                "@typescript-eslint/no-explicit-any": "off",
                "@typescript-eslint/explicit-function-return-type": "off"
            }
        }
    ]
}
```

---

## Step 6: Common Type Safety Improvements

### Use Zod for Runtime Validation

Instead of `as any` casts, use Zod parsing:

```typescript
// Before (unsafe)
function handleRequest(body: any) {
    const chatId = body.chatId as string;
}

// After (safe)
import { z } from 'zod';

const RequestSchema = z.object({
    chatId: z.string(),
});

function handleRequest(body: unknown) {
    const parsed = RequestSchema.parse(body);
    const chatId = parsed.chatId; // typed as string
}
```

### Use Type Guards

```typescript
// Type guard for Message
function isMessage(obj: unknown): obj is Message {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'id' in obj &&
        'body' in obj
    );
}

// Usage
function processItem(item: unknown) {
    if (isMessage(item)) {
        console.log(item.body); // TypeScript knows it's a Message
    }
}
```

### Use Branded Types

For IDs that shouldn't be mixed:

```typescript
// In @open-wa/schema
export type ChatId = string & { __brand: 'ChatId' };
export type ContactId = string & { __brand: 'ContactId' };
export type MessageId = string & { __brand: 'MessageId' };

// Helper to create branded values
export function toChatId(raw: string): ChatId {
    return raw as ChatId;
}

// Now TypeScript prevents mixing:
function sendMessage(to: ChatId, text: string) { /* ... */ }

const chatId: ChatId = toChatId('123@c.us');
const contactId: ContactId = '123@c.us' as ContactId;

sendMessage(chatId, 'Hello');     // OK
sendMessage(contactId, 'Hello');  // ERROR: ContactId != ChatId
```

---

## Step 7: Verification

After making changes:

```bash
# Run type check on specific package
cd packages/schema
pnpm exec tsc --noEmit

# Run type check on all packages
cd /Users/Mohammed/projects/tools/wa
pnpm typecheck

# Check for any remaining explicit `any` usage
grep -r "as any" packages/schema/src --include="*.ts" | wc -l
# Goal: 0 or close to it
```

---

## Progress Tracking

Track migration progress per package:

| Package | Strict Mode | No `any` | Tests Pass | Status |
|---------|-------------|----------|------------|--------|
| schema | ⬜ | ⬜ | ⬜ | Not started |
| logger | ⬜ | ⬜ | ⬜ | Not started |
| wa-decrypt | ⬜ | ⬜ | ⬜ | Not started |
| hyperemitter | ⬜ | ⬜ | ⬜ | Not started |
| socket-client | ⬜ | ⬜ | ⬜ | Not started |
| session-sync | ⬜ | ⬜ | ⬜ | Not started |
| core | ⬜ | ⬜ | ⬜ | Deferred |
| wa-automate | ⬜ | ⬜ | ⬜ | Deferred |
| orchestrator | ⬜ | ⬜ | ⬜ | Deferred |

---

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Packages with strict mode | 0 | 6+ |
| `as any` usage in schema | Many | 0 |
| Type-related runtime errors | Some | Fewer |
| IDE autocomplete accuracy | ~80% | ~95% |
| CI catches type issues | No | Yes |
