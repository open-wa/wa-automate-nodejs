# Issue #06: TypeScript Strictness Improvements

**Priority**: LOW (after core stabilizes)  
**Effort**: 2-3 days (incremental)  
**Risk**: MEDIUM  
**Depends on**: 01, 01a, 02, 03 (core must stabilize first)  
**Blocks**: None

---

## Problem Statement

TypeScript is configured with relaxed settings for legacy compatibility:

```json
{
    "compilerOptions": {
        "strict": false,
        "noImplicitAny": false
    }
}
```

This allows type errors to slip through, causing runtime issues.

---

## Strategy: Incremental Ratchet

Don't flip strict on globally. Use a phased approach:

| Phase | Scope | Effort |
|-------|-------|--------|
| 1 | Make `@open-wa/schema` strict | 0.5 day |
| 2 | Add non-blocking strict checks to CI | 0.5 day |
| 3 | Migrate packages one at a time | 1-2 days |
| 4 | Require new files to be strict (ESLint) | 0.5 day |

---

## Phase 1: Make @open-wa/schema Strict

**File**: `packages/schema/tsconfig.json`

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

## Common Fix Patterns

### Pattern 1: Implicit any in callbacks

```typescript
// Before (error: Parameter 'x' implicitly has 'any' type)
methods.forEach((method) => { /* ... */ });

// After
methods.forEach((method: MethodDefinition) => { /* ... */ });
```

### Pattern 2: Possible undefined

```typescript
// Before (error: Object is possibly 'undefined')
const name = meta.functionName;

// After (option 1: assert - only when you KNOW it exists)
const name = meta.functionName!;

// After (option 2: check - preferred)
if (!meta.functionName) throw new Error('Missing functionName');
const name = meta.functionName;
```

### Pattern 3: Index signatures

```typescript
// Before (error: Element implicitly has 'any' type)
const value = obj[key];

// After (type-safe access)
const value = obj[key as keyof typeof obj];

// Or use Map instead of object
const map = new Map<string, T>();
const value = map.get(key);
```

---

## Phase 2: Non-Blocking CI Check

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
      
      # Non-blocking strict check (informational)
      - name: Strict TypeScript Check
        run: pnpm exec tsc -p packages/schema/tsconfig.strict.json || true
        continue-on-error: true
```

---

## Phase 3: Package Migration Order

Migrate in order of criticality and dependency:

| Order | Package | Reason | Effort |
|-------|---------|--------|--------|
| 1 | `@open-wa/schema` | Boundary layer, most critical | LOW |
| 2 | `@open-wa/logger` | Small, standalone | LOW |
| 3 | `@open-wa/wa-decrypt` | Small, focused | LOW |
| 4 | `@open-wa/hyperemitter` | New code, should be clean | LOW |
| 5 | `@open-wa/socket-client` | Client-facing | MEDIUM |
| 6 | `@open-wa/session-sync` | Relatively small | MEDIUM |
| 7 | `@open-wa/core` | Large, complex | HIGH (defer) |
| 8 | `@open-wa/wa-automate` | Large, server code | HIGH (defer) |
| 9 | `@open-wa/orchestrator` | Legacy code | HIGH (defer) |

---

## Phase 4: Enforce Strict for New Code

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
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/explicit-function-return-type": ["warn", {
            "allowExpressions": true,
            "allowTypedFunctionExpressions": true
        }],
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

## Type Safety Improvements

### Use Zod for Runtime Validation

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

### Use Branded Types for IDs

```typescript
// In @open-wa/schema
export type ChatId = string & { __brand: 'ChatId' };
export type ContactId = string & { __brand: 'ContactId' };
export type MessageId = string & { __brand: 'MessageId' };

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

## Progress Tracking

| Package | Strict Mode | No `any` | Tests Pass | Status |
|---------|:-----------:|:--------:|:----------:|--------|
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

## Verification

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

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Packages with strict mode | 0 | 6+ |
| `as any` usage in schema | Many | 0 |
| Type-related runtime errors | Some | Fewer |
| IDE autocomplete accuracy | ~80% | ~95% |
| CI catches type issues | No | Yes |
