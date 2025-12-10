import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

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
