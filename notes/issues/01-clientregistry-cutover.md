# Issue #1: Switch Generators and Server to clientRegistry

**Priority**: 🔴 CRITICAL  
**Effort**: 1-2 days  
**Impact**: Makes v5 schema-first promise real

---

## Problem Statement

The V2 schema system (`defineMethodV2` + `clientRegistry`) is complete with 121 methods, but the code that **consumes** these schemas still uses the legacy `Registry`:

| File | Current | Should Use |
|------|---------|------------|
| `gen-openapi.ts` | `Registry.getAllMethods()` | `clientRegistry.getAll()` |
| `gen-types.ts` | `Registry.getAllMethods()` | `clientRegistry.getAll()` |
| Hono server | Legacy patterns | `clientRegistry.getAll()` |

This means v5's "schema-first" promise isn't actually delivered.

---

## Step 1: Extend ClientFunctionMetadata to Store Schemas

**File**: `packages/schema/src/registry.ts`

### Current Code (lines 85-99)

```typescript
export interface ClientFunctionMetadata {
    functionName?: string;
    wapiOverride?: string;
    id?: string;
    slug?: string;
    namespace?: string;
    action?: ActionType;
    api_slug?: string;
    description?: string;
    deprecated?: boolean;
    license?: LicenseTier;
    functionality?: FunctionalityScope;
    httpMethod?: HttpMethod;
    parameterOrder: string[];
}
```

### Proposed Change

```typescript
export interface ClientFunctionMetadata {
    functionName?: string;
    wapiOverride?: string;
    id?: string;
    slug?: string;
    namespace?: string;
    action?: ActionType;
    api_slug?: string;
    description?: string;
    deprecated?: boolean;
    license?: LicenseTier;
    functionality?: FunctionalityScope;
    httpMethod?: HttpMethod;
    parameterOrder: string[];
    
    // NEW: Store schemas directly for generator access
    inputSchema?: z.ZodObject<any>;
    outputSchema?: z.ZodTypeAny;
}
```

---

## Step 2: Update defineMethodV2 to Store Schemas

**File**: `packages/schema/src/registry.ts`

### Current Code (lines 172-207)

```typescript
export function defineMethodV2<
    T extends z.ZodObject<any>,
    R extends z.ZodTypeAny
>(
    name: string,
    params: {
        meta: Omit<ClientFunctionMetadata, 'functionName' | 'parameterOrder'>;
        input: T;
        parameterOrder: Array<keyof T['shape']>;
        output: R;
    }
): z.ZodFunction<z.ZodUnion<[z.ZodTuple<[T]>, z.ZodTuple<any>]>, R> {
    // ... existing code ...
    
    // 4. Register Metadata
    clientRegistry.set(funcSchema, {
        functionName: name,
        parameterOrder: params.parameterOrder as string[],
        ...params.meta
    });

    return funcSchema;
}
```

### Proposed Change

```typescript
export function defineMethodV2<
    T extends z.ZodObject<any>,
    R extends z.ZodTypeAny
>(
    name: string,
    params: {
        meta: Omit<ClientFunctionMetadata, 'functionName' | 'parameterOrder' | 'inputSchema' | 'outputSchema'>;
        input: T;
        parameterOrder: Array<keyof T['shape']>;
        output: R;
    }
): z.ZodFunction<z.ZodUnion<[z.ZodTuple<[T]>, z.ZodTuple<any>]>, R> {
    // ... existing code ...
    
    // 4. Register Metadata WITH schemas
    clientRegistry.set(funcSchema, {
        functionName: name,
        parameterOrder: params.parameterOrder as string[],
        inputSchema: params.input,      // NEW: Store input schema
        outputSchema: params.output,    // NEW: Store output schema
        ...params.meta
    });

    return funcSchema;
}
```

---

## Step 3: Update gen-openapi.ts

**File**: `packages/schema/scripts/gen-openapi.ts`

### Current Code

```typescript
import { Registry } from '../src/registry';
import '../src/methods';

// ...

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

### Proposed Change

```typescript
import { clientRegistry } from '../src/registry';
import '../src/methods';

// ...

const methods = clientRegistry.getAll();

methods.forEach(([_schema, meta]) => {
    if (!meta.inputSchema || !meta.outputSchema) {
        console.warn(`Skipping ${meta.functionName}: missing schemas`);
        return;
    }
    
    // Determine HTTP method from metadata or default to POST
    const httpMethod = (meta.httpMethod === 'AUTO' || !meta.httpMethod) 
        ? 'post' 
        : meta.httpMethod.toLowerCase();
    
    // Build API path from namespace + slug
    const apiPath = meta.api_slug 
        || (meta.namespace ? `/${meta.namespace}/${meta.functionName}` : `/${meta.functionName}`);
    
    registry.registerPath({
        method: httpMethod as any,
        path: apiPath,
        description: meta.description || meta.functionName,
        tags: meta.namespace ? [meta.namespace] : undefined,
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: meta.inputSchema as any,
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Successful response',
                content: {
                    'application/json': {
                        schema: meta.outputSchema as any,
                    },
                },
            },
        },
    });
});
```

---

## Step 4: Update gen-types.ts

**File**: `packages/schema/scripts/gen-types.ts`

### Current Code

```typescript
import { printNode, zodToTs } from 'zod-to-ts';
// Uses Registry.getAllMethods() (implied from pattern)
```

### Proposed Change

```typescript
import fs from 'fs';
import path from 'path';
import { printNode, zodToTs } from 'zod-to-ts';
import { clientRegistry } from '../src/registry';
import '../src/methods';

const generatedDir = path.join(__dirname, '../src/generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

let output = `/* eslint-disable */
/**
 * Auto-generated types from @open-wa/schema
 * Do not edit manually.
 */

`;

const methods = clientRegistry.getAll();

methods.forEach(([_schema, meta]) => {
    if (!meta.inputSchema || !meta.outputSchema) return;
    
    const name = meta.functionName!;
    const inputName = `${name}Input`;
    const outputName = `${name}Output`;
    
    // Generate input type
    const { node: inputNode } = zodToTs(meta.inputSchema, inputName);
    output += `export type ${inputName} = ${printNode(inputNode)};\n\n`;
    
    // Generate output type
    const { node: outputNode } = zodToTs(meta.outputSchema, outputName);
    output += `export type ${outputName} = ${printNode(outputNode)};\n\n`;
});

fs.writeFileSync(path.join(generatedDir, 'types.ts'), output);
console.log('Successfully generated types.ts');
```

---

## Step 5: Update gen-client-implementation.ts

**File**: `packages/schema/scripts/gen-client-implementation.ts`

### Current Issue

The generated `BaseClient.ts` has a broken `pup` method:

```typescript
protected async pup(_func: any, args: any): Promise<any> {
    return this.execute('unknown', args);  // BUG: 'unknown' is wrong
}
```

### Proposed Fix

```typescript
import fs from 'fs';
import path from 'path';
import { clientRegistry } from '../src/registry';
import '../src/methods';

console.log('Loading schemas and generating client...');

const generatedDir = path.join(__dirname, '../src/generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

let output = `/* eslint-disable */
/**
 * Auto-generated BaseClient from @open-wa/schema
 * Do not edit manually.
 */
import { implementMethod } from '../implementor';
import * as Methods from '../methods';

export abstract class BaseClient {
    /**
     * Execute a WAPI method via the browser bridge
     * @param methodName - The WAPI method name
     * @param args - Arguments to pass
     */
    protected abstract execute(methodName: string, args: any): Promise<any>;

`;

const methods = clientRegistry.getAll();
methods.forEach(([_schema, meta]) => {
    const name = meta.functionName!;
    const description = meta.description || name;
    const deprecated = meta.deprecated ? '@deprecated' : '';
    const license = meta.license !== 'none' ? `@license ${meta.license}` : '';
    
    output += `
    /**
     * ${description}
     * ${deprecated}
     * ${license}
     */
    public ${name} = implementMethod(Methods.${name});
`;
});

output += `}
`;

fs.writeFileSync(path.join(generatedDir, 'BaseClient.ts'), output);
console.log('Successfully generated BaseClient.ts with', methods.length, 'methods');
```

---

## Step 6: Update Hono Server Route Registration

**File**: `packages/wa-automate/src/server/` (locate the Hono setup file)

### Proposed Pattern

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { clientRegistry } from '@open-wa/schema';

export function registerSchemaRoutes(app: Hono, client: Client) {
    const methods = clientRegistry.getAll();
    
    methods.forEach(([_schema, meta]) => {
        if (!meta.inputSchema || !meta.functionName) return;
        
        const httpMethod = (meta.httpMethod === 'AUTO' || !meta.httpMethod)
            ? 'post'
            : meta.httpMethod.toLowerCase();
        
        const path = meta.api_slug 
            || (meta.namespace ? `/${meta.namespace}/${meta.functionName}` : `/${meta.functionName}`);
        
        // Register route with Zod validation
        app[httpMethod](path, zValidator('json', meta.inputSchema), async (c) => {
            const params = c.req.valid('json');
            
            try {
                const result = await client[meta.functionName!](params);
                return c.json({ success: true, data: result });
            } catch (error) {
                return c.json({ success: false, error: error.message }, 500);
            }
        });
    });
    
    console.log(`Registered ${methods.length} schema-driven routes`);
}
```

---

## Verification Steps

After making these changes:

1. **Rebuild the schema package**:
   ```bash
   cd packages/schema
   pnpm build
   ```

2. **Check generated files**:
   ```bash
   ls -la src/generated/
   # Should see: BaseClient.ts, types.ts, openapi.json
   ```

3. **Verify OpenAPI spec**:
   ```bash
   cat src/generated/openapi.json | jq '.paths | keys | length'
   # Should output: 121 (or close to it)
   ```

4. **Check for namespace grouping**:
   ```bash
   cat src/generated/openapi.json | jq '.paths | keys | .[:10]'
   # Should see paths like /messages/sendText, /chats/getChat, etc.
   ```

---

## Expected Outcomes

After this change:

| Before | After |
|--------|-------|
| OpenAPI has legacy methods only | OpenAPI has all 121 V2 methods |
| Types don't match V2 schemas | Types generated from V2 schemas |
| Routes manually registered | Routes auto-generated from clientRegistry |
| No namespace grouping | Methods grouped by namespace |
| httpMethod always POST | httpMethod respects metadata (GET, POST, DELETE, etc.) |

---

## Rollback Plan

If something breaks:

1. Keep the legacy `Registry` functional (don't delete it yet)
2. Add a feature flag: `USE_V2_REGISTRY=true`
3. Generators check flag and use appropriate registry
4. Once stable, remove legacy path
