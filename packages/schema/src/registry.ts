import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { ActionType, LicenseTier, FunctionalityScope, HttpMethod } from './enums';

extendZodWithOpenApi(z as any);

// ============================================================================
// Legacy Registry (Kept for backward compatibility)
// ============================================================================

export type CapabilityType = 'method' | 'event';
export type CapabilityStatus = 'stable' | 'deprecated' | 'experimental' | 'beta';

export interface CapabilityMetadata {
    description: string;
    tags?: string[];
    since?: string;
    status?: CapabilityStatus;
    deprecated?: string; // Reason
    category?: string;
    example?: any;
    requiresSession?: boolean; // Default true
}

export interface CapabilityDefinition<
    Input extends z.ZodTypeAny = z.ZodTypeAny,
    Output extends z.ZodTypeAny = z.ZodTypeAny
> {
    name: string;
    type: CapabilityType;
    metadata: CapabilityMetadata;
    inputSchema: Input;
    outputSchema: Output;
}

export class Registry {
    private static methods = new Map<string, CapabilityDefinition>();
    private static events = new Map<string, CapabilityDefinition>();

    static registerMethod<Input extends z.ZodTypeAny, Output extends z.ZodTypeAny>(
        def: CapabilityDefinition<Input, Output>
    ) {
        if (this.methods.has(def.name)) {
            throw new Error(`Method ${def.name} already registered`);
        }
        this.methods.set(def.name, def);
        return def;
    }

    static registerEvent<Input extends z.ZodTypeAny, Output extends z.ZodTypeAny>(
        def: CapabilityDefinition<Input, Output>
    ) {
        if (this.events.has(def.name)) {
            throw new Error(`Event ${def.name} already registered`);
        }
        this.events.set(def.name, def);
        return def;
    }

    static getMethod(name: string) {
        return this.methods.get(name);
    }

    static getEvent(name: string) {
        return this.events.get(name);
    }

    static getAllMethods() {
        return Array.from(this.methods.values());
    }

    static getAllEvents() {
        return Array.from(this.events.values());
    }
}

// ============================================================================
// V2 Registry Infrastructure (Dual-Mode Support)
// ============================================================================

/**
 * Metadata for client function capabilities
 * Supports RBAC, licensing, and automation features
 */
export interface ClientFunctionMetadata {
    functionName?: string;
    wapiOverride?: string; // If the functionName is different from the WAPI name
    id?: string; // Fallback to functionName
    slug?: string; // Fallback to kebab-case(functionName)
    namespace?: string; // e.g., "chats", "contacts", "stories"
    action?: ActionType; // RBAC action type, defaults to 'read'
    api_slug?: string; // Default to namespace ? namespace/slug : slug
    description?: string; // Markdown TSDoc
    deprecated?: boolean; // Whether the function is deprecated
    license?: LicenseTier; // Defaults to 'none'
    functionality?: FunctionalityScope; // Default to 'both'
    httpMethod?: HttpMethod; // Defaults to 'AUTO'
    parameterOrder: string[]; // Critical for mapping positional args to object keys
}

/**
 * Metadata for individual parameters
 * Used for documentation and example generation
 */
export interface ParameterMetadata {
    example?: any; // Example value for the parameter
}

/**
 * Global registry for parameter metadata using WeakMap
 */
const parameterMetadataMap = new WeakMap<z.ZodTypeAny, ParameterMetadata>();

export const parameterRegistry = {
    set<T extends z.ZodTypeAny>(schema: T, metadata: ParameterMetadata): T {
        parameterMetadataMap.set(schema, metadata);
        return schema;
    },
    get<T extends z.ZodTypeAny>(schema: T): ParameterMetadata | undefined {
        return parameterMetadataMap.get(schema);
    }
};

/**
 * Global registry for client function capabilities using a regular Map to allow iteration
 */
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

/**
 * Helper to convert a Zod Object shape into a Zod Tuple based on key order
 * This enables positional argument support while maintaining type safety
 * 
 * @param zodObj - The Zod object schema
 * @param keys - The order of keys for positional arguments
 * @returns A Zod tuple schema matching the key order
 */
export function zObjectToTuple<
    Shape extends z.ZodRawShape,
    Keys extends readonly [keyof Shape, ...Array<keyof Shape>]
>(
    zodObj: z.ZodObject<Shape>,
    keys: Keys
): z.ZodTuple<[Shape[Keys[0]], ...{ [K in keyof Keys]: K extends 0 ? never : Shape[Keys[K]] }[number][]]> {
    // Runtime: Map the keys to the actual schemas in the object
    const schemas = keys.map((k) => zodObj.shape[k]);

    // Cast to any because TS struggles to map the array runtime to the tuple type
    return z.tuple(schemas as any) as any;
}

/**
 * V2 defineMethod - Creates a dual-mode function schema
 * Supports both positional arguments and named object parameters
 * 
 * @param name - Function name
 * @param params - Configuration including metadata, input schema, parameter order, and output schema
 * @returns A Zod function schema with dual-mode input support
 */
export function defineMethodV2<
    T extends z.ZodObject<any>,
    R extends z.ZodTypeAny
>(
    name: string,
    params: {
        meta: Omit<ClientFunctionMetadata, 'functionName' | 'parameterOrder'>;
        input: T;
        parameterOrder: Array<keyof T['shape']>; // Type-safe keys
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

    // 4. Register Metadata
    clientRegistry.set(funcSchema, {
        functionName: name,
        parameterOrder: params.parameterOrder as string[],
        ...params.meta
    });

    return funcSchema;
}

// ============================================================================
// Legacy defineMethod (Backward Compatibility)
// ============================================================================

export function defineMethod<
    Input extends z.ZodTypeAny,
    Output extends z.ZodTypeAny
>(
    name: string,
    params: {
        meta: CapabilityMetadata;
        input: Input;
        output: Output;
    }
): CapabilityDefinition<Input, Output> {
    return Registry.registerMethod({
        name,
        type: 'method',
        metadata: params.meta,
        inputSchema: params.input,
        outputSchema: params.output,
    });
}

export function defineEvent<
    Input extends z.ZodTypeAny,
    Output extends z.ZodTypeAny
>(
    name: string,
    params: {
        meta: CapabilityMetadata;
        input: Input;
        output: Output;
    }
): CapabilityDefinition<Input, Output> {
    return Registry.registerEvent({
        name,
        type: 'event',
        metadata: params.meta,
        inputSchema: params.input,
        outputSchema: params.output,
    });
}

export type InferInput<T extends CapabilityDefinition> = z.infer<T['inputSchema']>;
export type InferOutput<T extends CapabilityDefinition> = z.infer<T['outputSchema']>;

export { z };
