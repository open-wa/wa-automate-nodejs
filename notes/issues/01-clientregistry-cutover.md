# Issue #01: Switch Generators and Server to clientRegistry

**Priority**: 🔴 CRITICAL  
**Effort**: 1 day  
**Risk**: 🟡 Medium  
**Depends on**: None  
**Blocks**: 01a, 02, 03, 04, 05b

---

## Problem Statement

The V2 schema system (`defineMethodV2` + `clientRegistry`) has 121 methods, but the code that **consumes** these schemas still uses the legacy `Registry`:

| File | Line | Current | Should Use |
|------|------|---------|------------|
| `packages/schema/scripts/gen-openapi.ts` | 15 | `Registry.getAllMethods()` | `clientRegistry.getAll()` |
| `packages/schema/scripts/gen-types.ts` | 21 | `Registry.getAllMethods()` | `clientRegistry.getAll()` |
| `packages/wa-automate/src/server/hono-server.ts` | 116, 128 | `Registry.getAllMethods()` | `clientRegistry.getAll()` |
| `packages/wa-automate/src/server/socket-manager.ts` | 34 | `Registry.getAllMethods()` | `clientRegistry.getAll()` |

**Note**: `gen-client-implementation.ts` already uses `clientRegistry.getAll()` ✅

---

## Pre-Migration Checklist

```bash
# 1. Snapshot current generated outputs for comparison
mkdir -p /tmp/schema-backup
cp packages/schema/src/generated/openapi.json /tmp/schema-backup/
cp packages/schema/src/generated/types.ts /tmp/schema-backup/
cp packages/schema/src/generated/BaseClient.ts /tmp/schema-backup/

# 2. Verify current state
cd packages/schema
pnpm generate  # Should work with legacy Registry
```

---

## Step 1: Update gen-openapi.ts

**File**: `packages/schema/scripts/gen-openapi.ts`

### Current Code (lines 1-42)

```typescript
import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import fs from 'fs';
import path from 'path';
import { Registry } from '../src/registry';
import '../src/methods';

const generatedDir = path.join(__dirname, '../src/generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

const registry = new OpenAPIRegistry();

const methods = Registry.getAllMethods();

methods.forEach((method) => {
    registry.registerPath({
        method: 'post',
        path: `/${method.name}`,
        description: method.metadata.description,
        // ...
    });
});
```

### Updated Code

```typescript
import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import fs from 'fs';
import path from 'path';
import { clientRegistry } from '../src/registry';
import '../src/methods'; // Trigger registration side-effects

const generatedDir = path.join(__dirname, '../src/generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

const openApiRegistry = new OpenAPIRegistry();

// Get all V2 methods from clientRegistry
const methods = clientRegistry.getAll();

methods.forEach(([schema, meta]) => {
    if (!meta.functionName) {
        console.warn('Skipping method without functionName');
        return;
    }
    
    // Determine HTTP method from metadata
    let httpMethod: 'get' | 'post' | 'put' | 'delete' = 'post';
    if (meta.httpMethod && meta.httpMethod !== 'AUTO') {
        httpMethod = meta.httpMethod.toLowerCase() as any;
    } else if (meta.action === 'read') {
        httpMethod = 'get';
    } else if (meta.action === 'delete') {
        httpMethod = 'delete';
    } else if (meta.action === 'update') {
        httpMethod = 'put';
    }
    
    // Build path with namespace
    const apiPath = meta.api_slug 
        || (meta.namespace ? `/${meta.namespace}/${meta.functionName}` : `/${meta.functionName}`);
    
    // Extract input/output schemas from ZodFunction
    // ZodFunction structure: args = ZodUnion<[ZodTuple<[InputObject]>, ZodTuple<positional>]>
    const inputUnion = schema._def.args;
    const inputSchema = inputUnion._def.options[0]._def.items[0]; // First option, first item
    const outputSchema = schema._def.returns;
    
    openApiRegistry.registerPath({
        method: httpMethod,
        path: apiPath,
        description: meta.description || meta.functionName,
        tags: meta.namespace ? [meta.namespace] : ['core'],
        request: httpMethod !== 'get' ? {
            body: {
                content: {
                    'application/json': {
                        schema: inputSchema as any,
                    },
                },
            },
        } : undefined,
        responses: {
            200: {
                description: 'Successful response',
                content: {
                    'application/json': {
                        schema: outputSchema as any,
                    },
                },
            },
            400: {
                description: 'Validation error',
            },
            500: {
                description: 'Internal server error',
            },
        },
    });
});

const generator = new OpenApiGeneratorV3(openApiRegistry.definitions);

const document = generator.generateDocument({
    openapi: '3.0.0',
    info: {
        title: 'Open WA API',
        version: '5.0.0',
        description: 'API definition for Open WA v5 - Schema-first design',
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Local development' },
    ],
});

fs.writeFileSync(
    path.join(generatedDir, 'openapi.json'),
    JSON.stringify(document, null, 2)
);

console.log(`Successfully generated openapi.json with ${methods.length} methods`);
```

---

## Step 2: Update gen-types.ts

**File**: `packages/schema/scripts/gen-types.ts`

### Current Code (lines 1-44)

```typescript
import { printNode, zodToTs } from 'zod-to-ts';
import fs from 'fs';
import path from 'path';
import { Registry } from '../src/registry';
import '../src/methods';

// ...

const methods = Registry.getAllMethods();

methods.forEach((method) => {
    const inputIdentifier = `${capitalize(method.name)}Input`;
    const { node: inputNode } = zodToTs(method.inputSchema as any, inputIdentifier);
    // ...
});
```

### Updated Code

```typescript
import { printNode, zodToTs } from 'zod-to-ts';
import fs from 'fs';
import path from 'path';
import { clientRegistry } from '../src/registry';
import '../src/methods'; // Trigger registration side-effects

const generatedDir = path.join(__dirname, '../src/generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

let output = `/* eslint-disable */
/**
 * This file was automatically generated by packages/schema/scripts/gen-types.ts
 * Do not edit this file manually.
 */
`;

// Get all V2 methods from clientRegistry
const methods = clientRegistry.getAll();

methods.forEach(([schema, meta]) => {
    if (!meta.functionName) return;
    
    const methodName = meta.functionName;
    
    // Extract input/output schemas from ZodFunction
    const inputUnion = schema._def.args;
    const inputSchema = inputUnion._def.options[0]._def.items[0]; // Object schema
    const outputSchema = schema._def.returns;
    
    const inputIdentifier = `${capitalize(methodName)}Input`;
    const { node: inputNode } = zodToTs(inputSchema, inputIdentifier);
    const inputType = printNode(inputNode);

    const outputIdentifier = `${capitalize(methodName)}Output`;
    const { node: outputNode } = zodToTs(outputSchema, outputIdentifier);
    const outputType = printNode(outputNode);

    output += `
export type ${inputIdentifier} = ${inputType};
export type ${outputIdentifier} = ${outputType};
`;
});

// Write types.ts
fs.writeFileSync(path.join(generatedDir, 'types.ts'), output);
console.log(`Successfully generated types.ts with ${methods.length} method types`);

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
```

---

## Step 3: Update Hono Server Route Registration

**File**: `packages/wa-automate/src/server/hono-server.ts`

### Changes Required

```typescript
// Line 6: Update import
- import { Registry, Config } from '@open-wa/schema';
+ import { clientRegistry, Config } from '@open-wa/schema';
+ import '@open-wa/schema/methods'; // Trigger registration

// Line 116 (in registerRoutes method):
- const capabilities = Registry.getAllMethods();
+ const capabilities = clientRegistry.getAll();

// Lines 117-126 (endpoint listing):
- const endpoints = capabilities.map(cap => ({
+ const endpoints = capabilities.map(([_schema, meta]) => ({
      method: 'POST',
-     path: `/api/${cap.name}`,
-     name: cap.name,
-     description: cap.metadata.description,
-     category: cap.metadata.category,
+     path: `/api/${meta.functionName}`,
+     name: meta.functionName,
+     description: meta.description,
+     category: meta.namespace,
  }));

// Line 128:
- const capabilities = Registry.getAllMethods();
+ // Already have capabilities from above

// Lines 129-179 (route registration):
- capabilities.forEach((capability) => {
+ capabilities.forEach(([schema, meta]) => {
+     const methodName = meta.functionName!;
-     const path = `/api/${capability.name}`;
+     const path = `/api/${methodName}`;
      
+     // Extract input schema from ZodFunction
+     const inputUnion = schema._def.args;
+     const inputSchema = inputUnion._def.options[0]._def.items[0];
      
      this.app.post(path, async (c) => {
          const startTime = Date.now();
          try {
              const body = await c.req.json();
              
              if (!this.client) {
                  return c.json({ error: 'Client not initialized' }, 500);
              }

-             const validated = capability.inputSchema.parse(body);
+             const validated = inputSchema.parse(body);

-             const result = await this.client[capability.name](validated);
+             const result = await this.client[methodName](validated);

              if (this.elasticEmitter) {
                  this.elasticEmitter.log({
                      level: 'info',
                      component: 'api',
-                     method: capability.name,
+                     method: methodName,
                      // ... rest unchanged
                  });
              }

              return c.json({ success: true, data: result });
          } catch (error: any) {
              // ... error handling unchanged
          }
      });
  });
```

---

## Step 4: Update Socket Manager

**File**: `packages/wa-automate/src/server/socket-manager.ts`

### Changes Required

```typescript
// Line 2: Update import
- import { Registry, CapabilityDefinition, z } from '@open-wa/schema';
+ import { clientRegistry, z } from '@open-wa/schema';
+ import '@open-wa/schema/methods';

// Line 34:
- const capabilities = Registry.getAllMethods();
+ const capabilities = clientRegistry.getAll();

// Lines 36-69:
- capabilities.forEach((capability) => {
+ capabilities.forEach(([schema, meta]) => {
+     const methodName = meta.functionName!;
+     const inputUnion = schema._def.args;
+     const inputSchema = inputUnion._def.options[0]._def.items[0];
      
-     socket.on(capability.name, async (data: any, callback: Function) => {
+     socket.on(methodName, async (data: any, callback: Function) => {
          try {
              let input = data;

-             if (data && Array.isArray(data.args) && capability.inputSchema instanceof z.ZodObject) {
-                 const shape = (capability.inputSchema as any).shape;
+             if (data && Array.isArray(data.args) && inputSchema instanceof z.ZodObject) {
+                 const shape = inputSchema.shape;
                  const keys = Object.keys(shape);
                  const args = data.args;
                  input = {};
                  keys.forEach((key, index) => {
                      if (args[index] !== undefined) {
                          input[key] = args[index];
                      }
                  });
              }

-             const validated = capability.inputSchema.parse(input);
+             const validated = inputSchema.parse(input);

-             const result = await this.executeCapability(capability, validated);
+             const result = await this.executeMethod(methodName, validated);

              if (callback && typeof callback === 'function') {
                  callback({ success: true, data: result });
              }
          } catch (error: any) {
              // ... error handling unchanged
          }
      });
  });
}

- private async executeCapability(capability: CapabilityDefinition, input: any): Promise<any> {
+ private async executeMethod(methodName: string, input: any): Promise<any> {
      if (!this.client) {
          throw new Error('Client not initialized');
      }

-     const method = this.client[capability.name];
+     const method = this.client[methodName];
      if (typeof method !== 'function') {
-         throw new Error(`Method ${capability.name} not implemented on Client`);
+         throw new Error(`Method ${methodName} not implemented on Client`);
      }

      const result = await method(input);
      return result;
  }
```

---

## Step 5: Fix Duplicate `stop` Method

**File**: `packages/wa-automate/src/server/hono-server.ts`

**Delete lines 224-228** (duplicate stop method):

```typescript
// DELETE THIS BLOCK (lines 224-228):
    public async stop() {
        if (this.elasticEmitter) {
            await this.elasticEmitter.stop();
        }
    }
```

Keep only the first `stop` method at lines 210-214.

---

## Verification Steps

After making these changes:

```bash
# 1. Rebuild the schema package
cd packages/schema
pnpm generate

# 2. Compare generated files
diff /tmp/schema-backup/openapi.json src/generated/openapi.json
diff /tmp/schema-backup/types.ts src/generated/types.ts

# 3. Check method count
cat src/generated/openapi.json | jq '.paths | keys | length'
# Should output: 121 (or close to it)

# 4. Check for namespace grouping
cat src/generated/openapi.json | jq '.paths | keys | .[0:10]'
# Should see paths like /messages/sendText or /sendText

# 5. Rebuild everything
cd ../..
pnpm build

# 6. Run tests (if available)
pnpm test
```

---

## Breaking Changes

| Change | Impact | Mitigation |
|--------|--------|------------|
| Path structure may change | API clients need updating | Set `api_slug` to match legacy `name` |
| Schema extraction uses internal APIs | May break on Zod updates | Add fallback checks |
| Type names unchanged | Low impact | None needed |

---

## Rollback Plan

If something breaks:

1. **Immediate Rollback**:
   ```bash
   git stash
   # or
   git checkout -- packages/schema/scripts/
   git checkout -- packages/wa-automate/src/server/
   ```

2. **Restore Generated Files**:
   ```bash
   cp /tmp/schema-backup/* packages/schema/src/generated/
   ```

3. **Feature Flag Option** (if needed):
   ```typescript
   const USE_V2_REGISTRY = process.env.USE_V2_REGISTRY === 'true';
   const methods = USE_V2_REGISTRY 
       ? clientRegistry.getAll() 
       : Registry.getAllMethods();
   ```

---

## Expected Outcomes

| Before | After |
|--------|-------|
| OpenAPI has legacy methods only | OpenAPI has all 121 V2 methods |
| Types don't match V2 schemas | Types generated from V2 schemas |
| Routes manually use legacy Registry | Routes auto-generated from clientRegistry |
| No namespace grouping | Methods grouped by namespace (optional) |
| httpMethod always POST | httpMethod respects metadata |
