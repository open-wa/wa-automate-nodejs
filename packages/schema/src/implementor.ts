import { z } from 'zod';
import { buildKeyAliasMap, clientRegistry, normalizeParameterKeys } from './registry';

/**
 * Creates a runtime method from a Zod Function Schema.
 * Handles argument normalization (Positional -> Object) automatically.
 * 
 * This function versions the schema definition to the actual runtime implementation,
 * leveraging native Zod function capabilities for built-in validation.
 * 
 * @param schema - The Zod function schema created by defineMethodV2
 * @param implementation - Optional custom implementation. If omitted, defaults to generic WAPI call via this.pup
 * @returns A validated async function that can be called with either positional or named arguments
 * 
 * @example
 * // Default implementation (auto-bridges to WAPI)
 * class Client {
 *   sendText = implementMethod(sendTextSchema);
 *   async pup(func: Function, args: any) { ... }
 * }
 */
export function implementMethod<
    Schema extends z.ZodFunction<any, any>
>(
    schema: Schema,
    implementation?: (this: any, params: any) => Promise<ReturnType<z.infer<Schema>>>
): (...args: Parameters<z.infer<Schema>>) => Promise<ReturnType<z.infer<Schema>>> {
    const def = clientRegistry.getBySchema(schema as any);
    if (!def) {
        throw new Error('Schema is not registered in clientRegistry');
    }

    const meta = def.meta;
    const keyAliasMap = buildKeyAliasMap(meta.inputSchema.shape);

    return (async function (this: any, ...args: any[]) {
        let resolvedParams: any = {};

        if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
            resolvedParams = args[0];
        } else {
            resolvedParams = (meta.parameterOrder || []).reduce((acc: any, key: string, index: number) => {
                if (index < args.length) {
                    acc[key] = args[index];
                }
                return acc;
            }, {} as any);
        }

        const normalizedParams = normalizeParameterKeys(resolvedParams, keyAliasMap);
        const validatedParams = await meta.inputSchema.parseAsync(normalizedParams);

        if (implementation) {
            return await implementation.call(this, validatedParams);
        }

        if (this && typeof this.execute === 'function') {
            return await this.execute(meta.wapiOverride || meta.functionName, validatedParams);
        }

        if (!this || typeof this.pup !== 'function') {
            throw new Error(`Method ${meta.functionName} requires this.pup() for default implementation`);
        }

        return await this.pup(
            (params: any) => (window as any).WAPI[meta.wapiOverride || meta.functionName](params),
            validatedParams
        );
    }) as (...args: Parameters<z.infer<Schema>>) => Promise<ReturnType<z.infer<Schema>>>;
}

/**
 * Alias for implementMethod
 */
export const implementMethodAsync = implementMethod;
