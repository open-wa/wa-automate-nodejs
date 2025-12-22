# Schema Package v2 Migration Plan

This document outlines the steps to refactor the `@open-wa/wa-automate/schema` package to support "Dual-Mode" inputs (Positional Arguments + Named Objects), rich metadata for RBAC/Automation, and a runtime implementation bridge.

## Goals
1.  **Dual-Mode Inputs**: Support `method(a, b)` AND `method({ a: val, b: val })` automatically.
2.  **Rich Metadata**: Embed RBAC actions (`read`, `send`), licensing tiers, and functionality scopes directly into the Zod schema.
3.  **Runtime Normalization**: Provide a standard way to "implement" these schemas that automatically resolves mixed arguments into a single typed object.
4.  **Automatic WAPI Bridge**: Default implementation automatically bridges calls to `WAPI` via `this.pup`.

---

## Phase 1: Define Core Metadata Enums
Create `src/enums.ts`. These will drive the metadata validation.

1.  **`ActionEnum`**: `read`, `send`, `update`, `delete`.
2.  **`LicenseEnum`**: `none`, `insiders`, `restricted`.
3.  **`FunctionalityEnum`**: `both`, `business-only`, `personal-only`.
4.  **`HttpMethodEnum`**: `GET`, `POST`, `PUT`, `DELETE`, `AUTO`.

---

## Phase 2: Update Registry Infrastructure
Refactor `src/registry.ts`.

### 1. Switch to Native Zod Registry
Replace the custom `Registry` class with Zod's `z.registry()`.

```typescript
// src/registry.ts
import { z } from 'zod';

// Define the shape of our custom metadata
export interface ClientFunctionMetadata {
  functionName?: string;
  namespace?: string;
  action?: ActionEnum;
  description?: string;
  license?: LicenseEnum;
  parameterOrder?: string[]; // Critical for mapping positional args to object keys
  // ... other fields from PoC
}

// Global registry for client capabilities
export const clientRegistry = z.registry<ClientFunctionMetadata, z.ZodFunction>();
```

### 2. Add `zObjectToTuple` Helper
Add the utility function that converts a Zod Object shape into a Zod Tuple based on an array of keys.

```typescript
// Helper to convert object shape to tuple based on key order
export function zObjectToTuple<Shape extends z.ZodRawShape, Keys extends readonly [keyof Shape, ...Array<keyof Shape>]>(
  zodObj: z.ZodObject<Shape>,
  keys: Keys
): z.ZodTuple<...> { ... }
```

---

## Phase 3: The `defineMethod` Factory
Refactor `defineMethod` in `src/registry.ts` (or `src/dsl.ts`).

This function is the "Magic Maker". It takes a simple Object definition and returns a complex `z.function` that accepts **Both** formats.

**Input**:
- `name`: string
- `input`: z.ZodObject (The named parameters)
- `args`: Array of strings (The order of keys for positional arguments)
- `meta`: Metadata object

**Output**:
- A `z.function` schema where the `input` is a `z.union` of:
    1.  `z.tuple` (derived from `input` + `args` order)
    2.  `z.tuple([input])` (The object passed as a single argument)

```typescript
// Pseudo-implementation
export const defineMethod = <T extends z.ZodObject<any>>(
  name: string,
  params: {
    meta: ClientFunctionMetadata,
    input: T,
    parameterOrder: Array<keyof T['shape']>, // Type-safe keys
    output: z.ZodTypeAny
  }
) => {
  // 1. Create Tuple Schema from Object + Order
  const tupleSchema = zObjectToTuple(params.input, params.parameterOrder);
  
  // 2. Create the Union Input: (ParamsObject) | (...PositionalArgs)
  const inputUnion = z.union([
    z.tuple([params.input]), // Case A: func({ a: 1, b: 2 })
    tupleSchema              // Case B: func(1, 2)
  ]);

  // 3. Create Function Schema
  const funcSchema = z.function()
    .args(inputUnion as any) // Cast needed for complex union
    .returns(params.output);

  // 4. Register Metadata
  return funcSchema.register(clientRegistry, {
    functionName: name,
    parameterOrder: params.parameterOrder,
    ...params.meta
  });
}
```

---

## Phase 4: Runtime Implementation Helper (`implementAsync`)
Create `src/implementor.ts`.

We need a generic wrapper that the **Client** package will use to implement these schemas without boilerplate. It should support a default execution strategy (via `this.pup` -> `WAPI`) while allowing overrides.

```typescript
import { z } from 'zod';
import { clientRegistry } from './registry';

/**
 * Creates a runtime method from a Zod Schema.
 * It handles the argument normalization (Positional -> Object) automatically.
 */
export function implementMethod<
  Schema extends z.ZodFunction,
  ParamsObj = z.infer<Schema['parameters']['items'][0]>[0] // Extract the Object type
>(
  schema: Schema,
  // Optional override. If omitted, defaults to generic WAPI call via this.pup
  implementation?: (params: ParamsObj) => Promise<z.infer<Schema['returnType']>>
) {
  // Use a regular function (not arrow) to preserve 'this' context
  return schema.implementAsync(async function(this: any, ...args) {
    const meta = clientRegistry.get(schema);
    let resolvedParams: any = {};

    // 1. Detect if called with a single Object argument
    if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
       // It's the object style
       resolvedParams = args[0];
    } else {
       // 2. It's positional arguments -> Map to keys using metadata
       resolvedParams = args.reduce((acc, arg, index) => ({
         ...acc,
         [meta.parameterOrder![index]]: arg
       }), {});
    }

    // 3. Custom Implementation (if provided)
    if (implementation) {
        // Call with 'this' bound, in case the override needs class properties
        return implementation.call(this, resolvedParams);
    }

    // 4. Default Fallback: Execute via this.pup()
    // This assumes the class instance has a 'pup' method
    if (!this.pup) {
        throw new Error('Default implementation requires this.pup() method');
    }

    // Dynamically call WAPI on the browser side
    return await this.pup(
        (params: any) => (window as any).WAPI[meta.functionName!](params),
        resolvedParams
    );
  });
}
```

---

## Phase 5: Refactor `methods.ts`
Convert existing methods to the new format.

**Example: `sendText`**

```typescript
export const sendText = defineMethod('sendText', {
  meta: {
    description: 'Sends a text message',
    action: ActionEnum.SEND,
    functionality: FunctionalityEnum.BOTH
  },
  // Define params as a standard Object
  input: z.object({
    to: z.string(),
    content: z.string(),
    options: z.any().optional()
  }),
  // Explicitly define the positional order
  parameterOrder: ['to', 'content', 'options'], 
  output: MessageIdReturnSchema
});
```

## Phase 6: Client Usage (Future)
When the `@open-wa/wa-automate` client imports this, it can use the default behavior or override it.

```typescript
import { sendText, implementMethod } from '@open-wa/schema';

class Client {
    
  // 1. Default Implementation:
  // Automatically maps to: await this.pup((p) => WAPI.sendText(p), params)
  sendText = implementMethod(sendText);

  // 2. Custom Override:
  // useful for methods that need node-side logic before/after
  sendImage = implementMethod(sendImage, async (params) => {
      const base64 = await convertToBase64(params.file);
      // Manually call pup or do logic
      return this.pup((p) => WAPI.sendImage(p), { ...params, imgData: base64 });
  });

  // The bridge method required by the default implementation
  async pup(func: Function, args: any) {
      // Implementation that sends function to browser
  }
}
```
