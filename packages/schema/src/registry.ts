import { z } from 'zod';
import { ActionType, LicenseTier, FunctionalityScope, HttpMethod } from './enums';

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
    functionName: string; // Required now
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
    aliases?: AliasMetadata;
    namespacedName?: string;
    allAliases?: string[];
    deprecatedAliases?: string[];
    
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

export type OpenWAMethodSchema<
    T extends z.ZodObject<any>,
    R extends z.ZodTypeAny
> = z.ZodFunction<z.ZodUnion<[z.ZodTuple<[T]>, z.ZodTuple<any>]>, R> & {
    openWAInput: T;
    openWAOutput: R;
    openWAFunctionName: string;
};

/**
 * Metadata for individual parameters
 * Used for documentation and example generation
 */
export interface ParameterMetadata {
    example: string | number | boolean | string[];
    brandedType?: string;
    formatDescription?: string;
    pattern?: string;
    additionalExamples?: Record<string, string>;
    keyAliases?: string[];
    deprecatedKeyAliases?: string[];
}

export interface AliasMetadata {
    verb?: string;
    noun?: string;
    extra?: string;
    explicit?: string[];
    deprecated?: string[];
    namespacedName?: string;
}

export const parameterRegistry = z.registry<ParameterMetadata>();

const STRIP_NAMESPACE_NOUN = true;

const namespaceNounMap: Record<string, string[]> = {
    chats: ['Chats', 'Chat'],
    messages: ['Messages', 'Message'],
    contacts: ['Contacts', 'Contact'],
    groups: ['Groups', 'Group'],
    communities: ['Communities', 'Community'],
    status: ['Statuses', 'Status'],
    labels: ['Labels', 'Label'],
    business: ['Businesses', 'Business'],
    media: ['Media'],
    session: ['Session'],
};

function uniqueStrings(values: Array<string | undefined>): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
        if (!value) {
            continue;
        }

        const normalized = value.trim();
        if (!normalized || seen.has(normalized)) {
            continue;
        }

        seen.add(normalized);
        result.push(normalized);
    }

    return result;
}

function getNamespaceNouns(namespace?: string): string[] {
    if (!namespace) {
        return [];
    }

    return namespaceNounMap[namespace] ?? [namespace.charAt(0).toUpperCase() + namespace.slice(1)];
}

export function deriveNamespacedMethodName(functionName: string, namespace?: string): string {
    if (!namespace || !STRIP_NAMESPACE_NOUN) {
        return functionName;
    }

    const nouns = getNamespaceNouns(namespace).sort((left, right) => right.length - left.length);

    for (const noun of nouns) {
        if (functionName.endsWith(noun)) {
            const stripped = functionName.slice(0, -noun.length);
            if (stripped) {
                return stripped;
            }
        }
    }

    for (const noun of nouns) {
        const index = functionName.indexOf(noun);
        if (index > 0) {
            const stripped = `${functionName.slice(0, index)}${functionName.slice(index + noun.length)}`;
            if (stripped) {
                return stripped;
            }
        }
    }

    return functionName;
}

function isFlatAlias(alias: string): boolean {
    return !alias.includes('.');
}

function toNamespacedAlias(alias: string, namespace?: string): string | undefined {
    if (!namespace) {
        return undefined;
    }

    if (alias.includes('.')) {
        return alias;
    }

    return `${namespace}.${deriveNamespacedMethodName(alias, namespace)}`;
}

function getResolvedNamespacedName(meta: ClientFunctionMetadata): string {
    return meta.aliases?.namespacedName ?? deriveNamespacedMethodName(meta.functionName, meta.namespace);
}

function getFlatAliases(meta: ClientFunctionMetadata): { aliases: string[]; deprecated: string[] } {
    const explicit = uniqueStrings(meta.aliases?.explicit ?? []);
    const deprecated = uniqueStrings(meta.aliases?.deprecated ?? []);
    const aliases: string[] = [...explicit, ...deprecated];

    if (meta.functionName.startsWith('getAll')) {
        const suffix = meta.functionName.slice('getAll'.length);
        if (suffix) {
            aliases.push(`list${suffix}`);
        }
    }

    return {
        aliases: uniqueStrings(aliases),
        deprecated,
    };
}

export function getMethodAliases(meta: ClientFunctionMetadata): string[] {
    const namespace = meta.namespace;
    const namespacedName = getResolvedNamespacedName(meta);
    const defaultNamespacedName = deriveNamespacedMethodName(meta.functionName, namespace);
    const namespacedAliases = namespace ? [`${namespace}.${namespacedName}`] : [];

    if (namespace && defaultNamespacedName !== namespacedName) {
        namespacedAliases.push(`${namespace}.${defaultNamespacedName}`);
    }

    const { aliases: flatAliases } = getFlatAliases(meta);
    const derivedNamespacedAliases = flatAliases
        .map((alias) => toNamespacedAlias(alias, namespace))
        .filter((alias): alias is string => Boolean(alias));

    if (namespace && meta.functionName.startsWith('getAll')) {
        namespacedAliases.push(`${namespace}.all`);
        namespacedAliases.push(`${namespace}.list`);
    }

    return uniqueStrings([
        ...flatAliases,
        ...namespacedAliases,
        ...derivedNamespacedAliases,
    ]).filter((alias) => alias !== meta.functionName);
}

function getDeprecatedAliases(meta: ClientFunctionMetadata): string[] {
    const namespace = meta.namespace;
    const deprecated = uniqueStrings(meta.aliases?.deprecated ?? []);

    return uniqueStrings([
        ...deprecated,
        ...deprecated
            .map((alias) => toNamespacedAlias(alias, namespace))
            .filter((alias): alias is string => Boolean(alias)),
    ]);
}

function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
    let current = schema;

    while (true) {
        const candidate = current as {
            unwrap?: () => z.ZodTypeAny;
            removeDefault?: () => z.ZodTypeAny;
            _def?: { innerType?: z.ZodTypeAny };
        };

        if (parameterRegistry.get(current)) {
            return current;
        }

        if (typeof candidate.unwrap === 'function') {
            current = candidate.unwrap();
            continue;
        }

        if (typeof candidate.removeDefault === 'function') {
            current = candidate.removeDefault();
            continue;
        }

        if (candidate._def?.innerType) {
            current = candidate._def.innerType;
            continue;
        }

        return current;
    }
}

export function getParameterMetadata(schema: z.ZodTypeAny): ParameterMetadata | undefined {
    return parameterRegistry.get(schema) ?? parameterRegistry.get(unwrapSchema(schema));
}

export function buildKeyAliasMap(inputShape: Record<string, z.ZodTypeAny>): Record<string, string> {
    const keyAliasMap: Record<string, string> = {};

    for (const [canonicalKey, schema] of Object.entries(inputShape)) {
        const metadata = getParameterMetadata(schema);

        for (const alias of metadata?.keyAliases ?? []) {
            keyAliasMap[alias] = canonicalKey;
        }

        for (const alias of metadata?.deprecatedKeyAliases ?? []) {
            keyAliasMap[alias] = canonicalKey;
        }
    }

    return keyAliasMap;
}

export function normalizeParameterKeys(
    data: unknown,
    keyAliasMap: Record<string, string>
): unknown {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return data;
    }

    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
        const canonicalKey = keyAliasMap[key] ?? key;
        if (!(canonicalKey in normalized)) {
            normalized[canonicalKey] = value;
        }
    }

    return normalized;
}

/**
 * Primary registry: keyed by function name
 */
const methodsByName = new Map<string, MethodDefinition>();
const methodsByAlias = new Map<string, string>();

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

        def.meta.namespacedName = getResolvedNamespacedName(def.meta);
        def.meta.allAliases = getMethodAliases(def.meta);
        def.meta.deprecatedAliases = getDeprecatedAliases(def.meta);

        for (const alias of def.meta.allAliases) {
            const existing = methodsByAlias.get(alias);
            if (existing && existing !== name) {
                throw new Error(
                    `Alias collision: "${alias}" is claimed by both "${existing}" and "${name}"`
                );
            }

            methodsByAlias.set(alias, name);
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

    resolve(nameOrAlias: string): MethodDefinition | undefined {
        const primary = methodsByAlias.get(nameOrAlias) ?? nameOrAlias;
        return methodsByName.get(primary);
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

    getAliasMap(): Record<string, string> {
        return Object.fromEntries(methodsByAlias.entries());
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
        methodsByAlias.clear();
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
        meta: Omit<ClientFunctionMetadata, 'functionName' | 'parameterOrder' | 'inputSchema' | 'outputSchema'>;
        input: T;
        parameterOrder: Array<keyof T['shape']>;
        output: R;
    }
): OpenWAMethodSchema<T, R> {
    const tupleSchema = zObjectToTuple(params.input, params.parameterOrder as any);

    const inputUnion = z.union([
        z.tuple([params.input]),
        tupleSchema
    ]);

    const funcSchema = Object.assign(
        z.function({
            input: inputUnion,
            output: params.output
        }),
        {
            openWAInput: params.input,
            openWAOutput: params.output,
            openWAFunctionName: name,
        }
    ) as OpenWAMethodSchema<T, R>;

    clientRegistry.register({
        schema: funcSchema,
        meta: {
            functionName: name,
            parameterOrder: params.parameterOrder as string[],
            inputSchema: params.input,
            outputSchema: params.output,
            ...params.meta
        }
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
