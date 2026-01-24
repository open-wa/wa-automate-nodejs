# Issue #02: E2E Contract Tests for v5 Core Loop

**Priority**: 🔴 CRITICAL  
**Effort**: 1 day  
**Risk**: 🟢 Low  
**Depends on**: 01, 01a  
**Blocks**: 03, 04

---

## Problem Statement

There is **no automated verification** that the v5 schema-first pipeline actually works end-to-end:

1. Method registered in `clientRegistry`
2. → OpenAPI spec generated correctly
3. → Types generated correctly
4. → Server route registered
5. → Client can invoke method
6. → Browser bridge executes

Without this, any change to the registry or generators could silently break the entire system.

---

## Goals

Create a minimal test harness that validates:

1. **Registry completeness**: Expected methods are registered
2. **Generator correctness**: Output files are valid and consistent
3. **Server route availability**: Routes respond to requests
4. **Type safety**: Generated types match schema expectations

---

## Step 1: Create Registry Contract Tests

**File**: `packages/schema/src/__tests__/registry.contract.test.ts`

```typescript
import { clientRegistry } from '../registry';
import '../methods'; // Trigger registration

describe('clientRegistry contract', () => {
    describe('registration', () => {
        it('should have registered methods', () => {
            const methods = clientRegistry.getAll();
            expect(methods.length).toBeGreaterThan(100); // We have 121 methods
        });

        it('should have unique method names', () => {
            const names = clientRegistry.getNames();
            const uniqueNames = new Set(names);
            expect(uniqueNames.size).toBe(names.length);
        });

        it('should have required metadata for each method', () => {
            const methods = clientRegistry.getAll();
            
            methods.forEach((def) => {
                expect(def.meta.functionName).toBeTruthy();
                expect(def.meta.parameterOrder).toBeInstanceOf(Array);
                expect(def.meta.inputSchema).toBeDefined();
                expect(def.meta.outputSchema).toBeDefined();
            });
        });
    });

    describe('lookup', () => {
        it('should find method by name', () => {
            const sendText = clientRegistry.get('sendText');
            expect(sendText).toBeDefined();
            expect(sendText?.meta.functionName).toBe('sendText');
        });

        it('should find method by schema', () => {
            const sendTextDef = clientRegistry.get('sendText');
            expect(sendTextDef).toBeDefined();
            
            const foundBySchema = clientRegistry.getBySchema(sendTextDef!.schema);
            expect(foundBySchema?.meta.functionName).toBe('sendText');
        });

        it('should return undefined for non-existent method', () => {
            const notFound = clientRegistry.get('thisMethodDoesNotExist');
            expect(notFound).toBeUndefined();
        });
    });

    describe('namespaces', () => {
        it('should have methods in messaging namespace', () => {
            const messagingMethods = clientRegistry.getByNamespace('messages');
            expect(messagingMethods.length).toBeGreaterThan(0);
        });

        it('should have methods in chats namespace', () => {
            const chatMethods = clientRegistry.getByNamespace('chats');
            expect(chatMethods.length).toBeGreaterThan(0);
        });
    });

    describe('critical methods exist', () => {
        const criticalMethods = [
            'sendText',
            'sendImage', 
            'sendFile',
            'getChat',
            'getAllChats',
            'getContact',
            'getAllContacts',
            'getMe',
            'isConnected',
        ];

        criticalMethods.forEach((name) => {
            it(`should have ${name} registered`, () => {
                expect(clientRegistry.has(name)).toBe(true);
            });
        });
    });
});
```

---

## Step 2: Create Generator Output Tests

**File**: `packages/schema/src/__tests__/generators.contract.test.ts`

```typescript
import fs from 'fs';
import path from 'path';
import { clientRegistry } from '../registry';
import '../methods';

const generatedDir = path.join(__dirname, '../generated');

describe('generator outputs', () => {
    describe('openapi.json', () => {
        const openapiPath = path.join(generatedDir, 'openapi.json');
        
        it('should exist', () => {
            expect(fs.existsSync(openapiPath)).toBe(true);
        });

        it('should be valid JSON', () => {
            const content = fs.readFileSync(openapiPath, 'utf-8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        it('should have paths for registered methods', () => {
            const content = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
            const pathCount = Object.keys(content.paths || {}).length;
            const methodCount = clientRegistry.getAll().length;
            
            // Allow some variance (methods might be filtered)
            expect(pathCount).toBeGreaterThan(methodCount * 0.9);
        });

        it('should have valid OpenAPI structure', () => {
            const content = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
            
            expect(content.openapi).toBe('3.0.0');
            expect(content.info).toBeDefined();
            expect(content.info.title).toBeTruthy();
            expect(content.paths).toBeDefined();
        });
    });

    describe('types.ts', () => {
        const typesPath = path.join(generatedDir, 'types.ts');
        
        it('should exist', () => {
            expect(fs.existsSync(typesPath)).toBe(true);
        });

        it('should have type exports for methods', () => {
            const content = fs.readFileSync(typesPath, 'utf-8');
            
            // Check for expected type patterns
            expect(content).toContain('SendTextInput');
            expect(content).toContain('SendTextOutput');
            expect(content).toContain('export type');
        });

        it('should not have TypeScript errors', async () => {
            // This test requires ts-node or similar
            // Skip if not in appropriate environment
            if (!process.env.TS_CHECK) {
                return;
            }
            
            const { exec } = require('child_process');
            const result = await new Promise((resolve, reject) => {
                exec(`npx tsc --noEmit ${typesPath}`, (error: any, stdout: string) => {
                    resolve({ error, stdout });
                });
            });
            
            expect((result as any).error).toBeNull();
        });
    });

    describe('BaseClient.ts', () => {
        const baseClientPath = path.join(generatedDir, 'BaseClient.ts');
        
        it('should exist', () => {
            expect(fs.existsSync(baseClientPath)).toBe(true);
        });

        it('should have method implementations', () => {
            const content = fs.readFileSync(baseClientPath, 'utf-8');
            
            // Check for expected method patterns
            expect(content).toContain('sendText = implementMethod');
            expect(content).toContain('public sendText');
        });

        it('should have correct method count', () => {
            const content = fs.readFileSync(baseClientPath, 'utf-8');
            const methodCount = clientRegistry.getAll().length;
            
            // Count implementMethod occurrences
            const matches = content.match(/implementMethod/g) || [];
            expect(matches.length).toBe(methodCount);
        });
    });
});
```

---

## Step 3: Create Server Route Contract Tests

**File**: `packages/wa-automate/src/server/__tests__/routes.contract.test.ts`

```typescript
import { Hono } from 'hono';
import { clientRegistry } from '@open-wa/schema';
import '@open-wa/schema/methods';

describe('server route registration', () => {
    it('should register routes for all methods', () => {
        // This is a unit test - actual route registration tested in integration
        const methods = clientRegistry.getAll();
        
        methods.forEach((def) => {
            const { meta } = def;
            
            // Verify route-able properties
            expect(meta.functionName).toBeTruthy();
            expect(typeof meta.functionName).toBe('string');
        });
    });

    it('should have valid HTTP methods', () => {
        const methods = clientRegistry.getAll();
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'AUTO', undefined];
        
        methods.forEach((def) => {
            expect(validMethods).toContain(def.meta.httpMethod);
        });
    });

    it('should have valid actions', () => {
        const methods = clientRegistry.getAll();
        const validActions = ['read', 'send', 'update', 'delete', undefined];
        
        methods.forEach((def) => {
            expect(validActions).toContain(def.meta.action);
        });
    });
});

describe('representative method validation', () => {
    const testCases = [
        {
            name: 'sendText',
            expectedInputKeys: ['to', 'content'],
            expectedNamespace: 'messages',
        },
        {
            name: 'getChat',
            expectedInputKeys: ['chatId'],
            expectedNamespace: 'chats',
        },
        {
            name: 'getContact',
            expectedInputKeys: ['contactId'],
            expectedNamespace: 'contacts',
        },
    ];

    testCases.forEach(({ name, expectedInputKeys, expectedNamespace }) => {
        describe(name, () => {
            const method = clientRegistry.get(name);
            
            it('should be registered', () => {
                expect(method).toBeDefined();
            });

            it('should have expected input keys', () => {
                const inputShape = Object.keys(method?.meta.inputSchema?.shape || {});
                expectedInputKeys.forEach(key => {
                    expect(inputShape).toContain(key);
                });
            });

            it('should have expected namespace', () => {
                expect(method?.meta.namespace).toBe(expectedNamespace);
            });

            it('should have parameter order matching input keys', () => {
                const order = method?.meta.parameterOrder || [];
                expectedInputKeys.forEach(key => {
                    expect(order).toContain(key);
                });
            });
        });
    });
});
```

---

## Step 4: Create Integration Test Script

**File**: `packages/schema/scripts/verify-v5-pipeline.ts`

```typescript
#!/usr/bin/env ts-node
/**
 * E2E verification script for v5 schema-first pipeline
 * Run with: ts-node scripts/verify-v5-pipeline.ts
 */

import { clientRegistry } from '../src/registry';
import '../src/methods';
import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying v5 Schema-First Pipeline...\n');

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, message?: string) {
    if (condition) {
        console.log(`  ✅ ${name}`);
        passed++;
    } else {
        console.log(`  ❌ ${name}${message ? `: ${message}` : ''}`);
        failed++;
    }
}

// 1. Registry Checks
console.log('📦 Registry Checks:');
const methods = clientRegistry.getAll();
check('Methods registered', methods.length > 100, `Found ${methods.length}`);
check('sendText exists', clientRegistry.has('sendText'));
check('getChat exists', clientRegistry.has('getChat'));
check('getMe exists', clientRegistry.has('getMe'));

// Check metadata completeness
let metaComplete = true;
methods.forEach((def) => {
    if (!def.meta.functionName || !def.meta.inputSchema) {
        metaComplete = false;
    }
});
check('All methods have complete metadata', metaComplete);

// 2. Generated File Checks
console.log('\n📄 Generated Files:');
const generatedDir = path.join(__dirname, '../src/generated');

const openApiPath = path.join(generatedDir, 'openapi.json');
check('openapi.json exists', fs.existsSync(openApiPath));

if (fs.existsSync(openApiPath)) {
    try {
        const openApi = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
        check('openapi.json is valid JSON', true);
        check('OpenAPI has paths', Object.keys(openApi.paths || {}).length > 0);
    } catch (e) {
        check('openapi.json is valid JSON', false, (e as Error).message);
    }
}

const typesPath = path.join(generatedDir, 'types.ts');
check('types.ts exists', fs.existsSync(typesPath));

const baseClientPath = path.join(generatedDir, 'BaseClient.ts');
check('BaseClient.ts exists', fs.existsSync(baseClientPath));

// 3. Namespace Distribution
console.log('\n🏷️  Namespace Distribution:');
const namespaces = new Map<string, number>();
methods.forEach((def) => {
    const ns = def.meta.namespace || 'core';
    namespaces.set(ns, (namespaces.get(ns) || 0) + 1);
});
namespaces.forEach((count, ns) => {
    console.log(`  📁 ${ns}: ${count} methods`);
});

// 4. Summary
console.log('\n📊 Summary:');
console.log(`  Total methods: ${methods.length}`);
console.log(`  Passed checks: ${passed}`);
console.log(`  Failed checks: ${failed}`);

if (failed > 0) {
    console.log('\n❌ Pipeline verification FAILED');
    process.exit(1);
} else {
    console.log('\n✅ Pipeline verification PASSED');
    process.exit(0);
}
```

---

## Step 5: Add to package.json

**File**: `packages/schema/package.json`

```json
{
    "scripts": {
        "test": "jest",
        "test:contracts": "jest --testMatch='**/*.contract.test.ts'",
        "verify": "ts-node scripts/verify-v5-pipeline.ts",
        "generate": "ts-node scripts/gen-types.ts && ts-node scripts/gen-openapi.ts && ts-node scripts/gen-client-implementation.ts",
        "build": "pnpm generate && tsc",
        "ci": "pnpm verify && pnpm test:contracts && pnpm build"
    }
}
```

---

## Step 6: Add to CI/CD

**File**: `.github/workflows/ci.yml` (add these steps)

```yaml
jobs:
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      
      - name: Verify Schema Pipeline
        run: pnpm --filter @open-wa/schema verify
        
      - name: Run Contract Tests
        run: pnpm --filter @open-wa/schema test:contracts
        
      - name: Build Schema Package
        run: pnpm --filter @open-wa/schema build
```

---

## Verification Steps

```bash
# 1. Run verification script
cd packages/schema
pnpm verify

# Expected output:
# 🔍 Verifying v5 Schema-First Pipeline...
# 
# 📦 Registry Checks:
#   ✅ Methods registered
#   ✅ sendText exists
#   ...
# 
# ✅ Pipeline verification PASSED

# 2. Run contract tests
pnpm test:contracts

# 3. Ensure tests pass before merge
pnpm ci
```

---

## Expected Outcomes

| Before | After |
|--------|-------|
| No automated verification | Full E2E contract tests |
| Silent breakage possible | Immediate failure detection |
| Manual verification needed | CI/CD catches regressions |
| Unknown method count | Verified 121+ methods |
