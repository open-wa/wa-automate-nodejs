import { z } from 'zod';
export type CapabilityType = 'method' | 'event';
export type CapabilityStatus = 'stable' | 'deprecated' | 'experimental' | 'beta';
export interface CapabilityMetadata {
    description: string;
    tags?: string[];
    since?: string;
    status?: CapabilityStatus;
    deprecated?: string;
    example?: any;
    requiresSession?: boolean;
}
export interface CapabilityDefinition<Input extends z.ZodTypeAny = z.ZodTypeAny, Output extends z.ZodTypeAny = z.ZodTypeAny> {
    name: string;
    type: CapabilityType;
    metadata: CapabilityMetadata;
    inputSchema: Input;
    outputSchema: Output;
}
export declare class Registry {
    private static methods;
    private static events;
    static registerMethod<Input extends z.ZodTypeAny, Output extends z.ZodTypeAny>(def: CapabilityDefinition<Input, Output>): CapabilityDefinition<Input, Output>;
    static registerEvent<Input extends z.ZodTypeAny, Output extends z.ZodTypeAny>(def: CapabilityDefinition<Input, Output>): CapabilityDefinition<Input, Output>;
    static getMethod(name: string): CapabilityDefinition<z.ZodTypeAny, z.ZodTypeAny>;
    static getEvent(name: string): CapabilityDefinition<z.ZodTypeAny, z.ZodTypeAny>;
    static getAllMethods(): CapabilityDefinition<z.ZodTypeAny, z.ZodTypeAny>[];
    static getAllEvents(): CapabilityDefinition<z.ZodTypeAny, z.ZodTypeAny>[];
}
export declare function defineMethod<Input extends z.ZodTypeAny, Output extends z.ZodTypeAny>(name: string, params: {
    meta: CapabilityMetadata;
    input: Input;
    output: Output;
}): CapabilityDefinition<Input, Output>;
export declare function defineEvent<Input extends z.ZodTypeAny, Output extends z.ZodTypeAny>(name: string, params: {
    meta: CapabilityMetadata;
    input: Input;
    output: Output;
}): CapabilityDefinition<Input, Output>;
export type InferInput<T extends CapabilityDefinition> = z.infer<T['inputSchema']>;
export type InferOutput<T extends CapabilityDefinition> = z.infer<T['outputSchema']>;
export { z };
//# sourceMappingURL=registry.d.ts.map