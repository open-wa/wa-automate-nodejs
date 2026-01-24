# Issue #01a: Registry Design Fix - Key by Name, Not Schema

**Priority**: 🔴 CRITICAL  
**Effort**: 0.5 day  
**Risk**: 🟡 Medium  
**Depends on**: 01 (conceptually, but can be done in parallel)  
**Blocks**: 02, 03, 04

---

## Problem Statement

The current `clientRegistry` design uses Zod schemas as Map keys:

```typescript
// Current (problematic)
const clientMetadataMap = new Map<z.ZodFunction<any, any>, ClientFunctionMetadata>();
```

### Issues with Schema-as-Key Approach

1. **Lookup is awkward**: Most consumers want to find by `functionName`, not by "schema object identity"
2. **Can't use WeakMap**: Generators need iteration, but WeakMap doesn't allow it
3. **No duplicate detection by name**: Two methods with same name but different schemas would be allowed
4. **Memory concern**: Strong references to schemas live forever (minor issue since schemas are module-level)

---

## Solution: Key by Function Name, Store Schema Inside

Restructure the registry to use function name as the key, with schema stored in the value:

```typescript
export type MethodDefinition = {
    schema: z.ZodFunction<any, any>;
    meta: ClientFunctionMetadata & {
        inputSchema: z.ZodObject<any>;
        outputSchema: z.ZodTypeAny;
    };
};

const methodsByName = new Map<string, MethodDefinition>();

// Optional: Reverse lookup for implementMethod() ergonomics
const nameBySchema = new WeakMap<z.ZodFunction<any, any>, string>();
```

---

## Step 1: Update ClientFunctionMetadata

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

### Updated Code

```typescript
export interface ClientFunctionMetadata {
    functionName: string; // Required now
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
    
    // Stored directly for generator access
    inputSchema: z.ZodObject<any>;
    outputSchema: z.ZodTypeAny;
}

/**
 * Complete method definition with schema and metadata
 */
export interface MethodDefinition {
    schema: z.ZodFunction<any, any>;
    meta: ClientFunctionMetadata;
}
```

---

## Step 2: Rewrite clientRegistry

**File**: `packages/schema/src/registry.ts`

### Current Code (lines 127-140)

```typescript
const clientMetadataMap = new Map<z.ZodFunction<any, any>, ClientFunctionMetadata>();

export const clientRegistry = {
    set<T extends z.ZodFunction<any, any>>(schema: T, metadata: ClientFunctionMetadata): T {
        clientMetadataMap.set(schema, metadata);
        return schema;
    },
    get<T extends z.ZodFunction<any, any>>(schema: T): ClientFunctionMetadata | undefined {
        return clientMetadataMap.get(schema);
    },
    getAll(): Array<[z.ZodFunction<any, any>, ClientFunctionMetadata]> {
        return Array.from(clientMetadataMap.entries());
    }
};
```

### Updated Code

```typescript
/**
 * Primary registry: keyed by function name
 */
const methodsByName = new Map<string, MethodDefinition>();

/**
 * Reverse lookup: for implementMethod() ergonomics
 * WeakMap so dynamically-created schemas don't leak
 */
const nameBySchema = new WeakMap<z.ZodFunction<any, any>, string>();

export const clientRegistry = {
    /**
     * Register a method definition
     * @throws Error if method name is already registered
     */
    register(def: MethodDefinition): z.ZodFunction<any, any> {
        const name = def.meta.functionName;
        
        if (methodsByName.has(name)) {
            throw new Error(`Method "${name}" already registered`);
        }
        
        methodsByName.set(name, def);
        nameBySchema.set(def.schema, name);
        
        return def.schema;
    },
    
    /**
     * Get method by name (primary lookup)
     */
    get(name: string): MethodDefinition | undefined {
        return methodsByName.get(name);
    },
    
    /**
     * Get method by schema (for implementMethod compatibility)
     */
    getBySchema(schema: z.ZodFunction<any, any>): MethodDefinition | undefined {
        const name = nameBySchema.get(schema);
        return name ? methodsByName.get(name) : undefined;
    },
    
    /**
     * Check if method exists
     */
    has(name: string): boolean {
        return methodsByName.has(name);
    },
    
    /**
     * Get all registered methods
     */
    getAll(): MethodDefinition[] {
        return Array.from(methodsByName.values());
    },
    
    /**
     * Get all method names
     */
    getNames(): string[] {
        return Array.from(methodsByName.keys());
    },
    
    /**
     * Get methods by namespace
     */
    getByNamespace(namespace: string): MethodDefinition[] {
        return this.getAll().filter(def => def.meta.namespace === namespace);
    },
    
    /**
     * Clear registry (for testing)
     */
    clear(): void {
        methodsByName.clear();
    }
};

// Legacy compatibility alias
export const clientMetadataMap = {
    get: clientRegistry.getBySchema,
};
```

---

## Step 3: Update defineMethodV2

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
    // ... create schema ...
    
    // 4. Register Metadata
    clientRegistry.set(funcSchema, {
        functionName: name,
        parameterOrder: params.parameterOrder as string[],
        ...params.meta
    });

    return funcSchema;
}
```

### Updated Code

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
    // 1. Create Tuple Schema from Object + Order
    const tupleSchema = zObjectToTuple(params.input, params.parameterOrder as any);

    // 2. Create the Union Input: (ParamsObject) | (...PositionalArgs)
    const inputUnion = z.union([
        z.tuple([params.input]), // Case A: func({ a: 1, b: 2 })
        tupleSchema              // Case B: func(1, 2)
    ]);

    // 3. Create Function Schema
    const funcSchema = z.function({
        input: inputUnion,
        output: params.output
    }) as z.ZodFunction<z.ZodUnion<[z.ZodTuple<[T]>, z.ZodTuple<any>]>, R>;

    // 4. Register as MethodDefinition (new pattern)
    clientRegistry.register({
        schema: funcSchema,
        meta: {
            functionName: name,
            parameterOrder: params.parameterOrder as string[],
            inputSchema: params.input,   // Store directly
            outputSchema: params.output, // Store directly
            ...params.meta
        }
    });

    return funcSchema;
}
```

---

## Step 4: Update Generator Consumption

After this change, generators become simpler:

### gen-openapi.ts (simplified)

```typescript
const methods = clientRegistry.getAll();

methods.forEach((def) => {
    const { schema, meta } = def;
    
    // No need to extract from ZodFunction internals!
    const inputSchema = meta.inputSchema;
    const outputSchema = meta.outputSchema;
    
    openApiRegistry.registerPath({
        method: resolveHttpMethod(meta),
        path: buildApiPath(meta),
        description: meta.description,
        request: {
            body: {
                content: {
                    'application/json': { schema: inputSchema as any },
                },
            },
        },
        responses: {
            200: {
                content: {
                    'application/json': { schema: outputSchema as any },
                },
            },
        },
    });
});
```

### gen-types.ts (simplified)

```typescript
const methods = clientRegistry.getAll();

methods.forEach((def) => {
    const { meta } = def;
    
    // Direct access to schemas!
    const { node: inputNode } = zodToTs(meta.inputSchema, `${capitalize(meta.functionName)}Input`);
    const { node: outputNode } = zodToTs(meta.outputSchema, `${capitalize(meta.functionName)}Output`);
    
    output += `export type ${capitalize(meta.functionName)}Input = ${printNode(inputNode)};\n`;
    output += `export type ${capitalize(meta.functionName)}Output = ${printNode(outputNode)};\n`;
});
```

---

## Step 5: Update implementMethod

**File**: `packages/schema/src/implementor.ts` (or wherever it's defined)

```typescript
/**
 * Create a method implementation bound to its schema
 */
export function implementMethod<
    T extends z.ZodFunction<any, any>
>(
    schema: T
): (...args: z.infer<T['_def']['args']>) => Promise<z.infer<T['_def']['returns']>> {
    const def = clientRegistry.getBySchema(schema);
    
    if (!def) {
        throw new Error('Method not registered in clientRegistry');
    }
    
    const { meta } = def;
    const wapiName = meta.wapiOverride || meta.functionName;
    
    return async function(this: any, ...args: any[]) {
        // Normalize args (positional or named)
        let params: any;
        
        if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
            // Named params: { to: '...', content: '...' }
            params = args[0];
        } else {
            // Positional params: ('...', '...')
            params = {};
            meta.parameterOrder.forEach((key, index) => {
                if (args[index] !== undefined) {
                    params[key] = args[index];
                }
            });
        }
        
        // Validate with input schema
        const validated = meta.inputSchema.parse(params);
        
        // Call WAPI via pup
        return this.pup(
            (p: any) => (window as any).WAPI[wapiName](p),
            validated
        );
    };
}
```

---

## Verification Steps

```bash
# 1. Run type check
cd packages/schema
pnpm exec tsc --noEmit

# 2. Regenerate files
pnpm generate

# 3. Verify method count
node -e "require('./dist/registry').clientRegistry.getAll().length" 
# Should output: 121

# 4. Verify lookup works
node -e "console.log(require('./dist/registry').clientRegistry.get('sendText')?.meta.functionName)"
# Should output: sendText

# 5. Build everything
cd ../..
pnpm build
```

---

## Migration Notes

### API Surface Changes

| Before | After |
|--------|-------|
| `clientRegistry.set(schema, meta)` | `clientRegistry.register({ schema, meta })` |
| `clientRegistry.get(schema)` | `clientRegistry.getBySchema(schema)` |
| `clientRegistry.getAll()` returns `[schema, meta][]` | `clientRegistry.getAll()` returns `MethodDefinition[]` |

### Backward Compatibility

If needed, add legacy wrappers:

```typescript
// Legacy compatibility (deprecated)
export const clientRegistryLegacy = {
    set<T extends z.ZodFunction<any, any>>(schema: T, meta: ClientFunctionMetadata): T {
        console.warn('clientRegistry.set() is deprecated, use clientRegistry.register()');
        return clientRegistry.register({ schema, meta: meta as any });
    },
    get<T extends z.ZodFunction<any, any>>(schema: T): ClientFunctionMetadata | undefined {
        return clientRegistry.getBySchema(schema)?.meta;
    },
    getAll(): Array<[z.ZodFunction<any, any>, ClientFunctionMetadata]> {
        return clientRegistry.getAll().map(def => [def.schema, def.meta]);
    }
};
```

---

## Expected Outcomes

| Before | After |
|--------|-------|
| Lookup by schema identity only | Lookup by name (primary) or schema |
| Must extract schemas from ZodFunction | Direct access via `meta.inputSchema` |
| No duplicate detection by name | Throws error on duplicate registration |
| Awkward iteration pattern | Clean `getAll()` returning definitions |
| No namespace filtering | `getByNamespace()` helper |
