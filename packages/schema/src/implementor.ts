import { z } from 'zod';
import { clientRegistry } from './registry';

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
    Schema extends z.ZodFunction<any, any>,
    ParamsObj = any
>(
    schema: Schema,
    // Optional override. If omitted, defaults to generic WAPI call via this.pup
    implementation?: (this: any, params: ParamsObj) => Promise<z.infer<Schema['_def']['returns']>>
) {
    const meta = clientRegistry.get(schema);
    if (!meta) {
        throw new Error('Schema is not registered in clientRegistry');
    }

    // Use native Zod implementation for built-in validation
    return schema.implementAsync(async function (this: any, ...args: any[]) {
        let resolvedParams: any = {};

        // 1. Argument Normalization (Already validated by Zod at this point)
        // Check if called with a single Object argument (Named style)
        if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
            resolvedParams = args[0];
        } else {
            // Positional arguments -> Map to keys using metadata
            resolvedParams = (meta.parameterOrder || []).reduce((acc, key, index) => {
                if (index < args.length) {
                    acc[key] = args[index];
                }
                return acc;
            }, {} as any);
        }

        // 2. Custom Implementation (if provided)
        if (implementation) {
            return await implementation.call(this, resolvedParams);
        }

        // 3. Default Fallback: Execute via this.pup()
        if (!this || typeof this.pup !== 'function') {
            throw new Error(`Method ${meta.functionName} requires this.pup() for default implementation`);
        }

        // Dynamically call WAPI on the browser side
        return await this.pup(
            (params: any) => (window as any).WAPI[meta.wapiOverride || meta.functionName!](params),
            resolvedParams
        );
    }) as any; // Cast as any because schema.implementAsync return type can sometimes be complex with ZodFunction
}

/**
 * Alias for implementMethod
 */
export const implementMethodAsync = implementMethod;
