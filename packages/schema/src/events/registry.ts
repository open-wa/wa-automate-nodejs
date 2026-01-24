import { z } from 'zod';
import { Options as PQueueOptions, DefaultAddOptions } from 'p-queue';
import PriorityQueue from 'p-queue/dist/priority-queue';
import { LicenseTier } from '../enums';

export type EventStatus = 'stable' | 'beta' | 'deprecated' | 'experimental';

export interface EventMetadata {
    eventName: string;
    legacyName: string;
    description?: string;
    namespace?: string;
    status?: EventStatus;
    deprecated?: string;
    license?: LicenseTier;
    since?: string;
    payloadSchema: z.ZodTypeAny;
    defaultQueueOptions?: PQueueOptions<PriorityQueue, DefaultAddOptions>;
}

export interface EventDefinition {
    callbackSchema: z.ZodFunction<any, any>;
    meta: EventMetadata;
}

const eventsByName = new Map<string, EventDefinition>();
const nameByCallback = new WeakMap<z.ZodFunction<any, any>, string>();

export const eventRegistry = {
    register(def: EventDefinition): z.ZodFunction<any, any> {
        const name = def.meta.eventName;
        
        if (eventsByName.has(name)) {
            throw new Error(`Event "${name}" already registered`);
        }
        
        eventsByName.set(name, def);
        nameByCallback.set(def.callbackSchema, name);
        
        return def.callbackSchema;
    },
    
    get(name: string): EventDefinition | undefined {
        return eventsByName.get(name);
    },
    
    getByLegacyName(legacyName: string): EventDefinition | undefined {
        for (const def of eventsByName.values()) {
            if (def.meta.legacyName === legacyName) return def;
        }
        return undefined;
    },
    
    has(name: string): boolean {
        return eventsByName.has(name);
    },
    
    getAll(): EventDefinition[] {
        return Array.from(eventsByName.values());
    },
    
    getByNamespace(namespace: string): EventDefinition[] {
        return this.getAll().filter(def => def.meta.namespace === namespace);
    },
    
    clear(): void {
        eventsByName.clear();
    }
};

export const QueueOptionsSchema = z.object({
    concurrency: z.number().positive().optional(),
    intervalCap: z.number().positive().optional(),
    interval: z.number().positive().optional(),
    timeout: z.number().positive().optional(),
    priority: z.number().optional(),
}).optional();

export type QueueOptions = z.infer<typeof QueueOptionsSchema>;

export function defineListenerV2<T extends z.ZodTypeAny>(
    name: string,
    params: {
        legacyName?: string;
        meta: Omit<EventMetadata, 'eventName' | 'legacyName' | 'payloadSchema'>;
        payload: T;
        defaultQueueOptions?: PQueueOptions<PriorityQueue, DefaultAddOptions>;
    }
): z.ZodFunction<any, any> {
    
    const legacyName = params.legacyName || `on${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    
    const callbackSchema = z.function({
        input: z.tuple([params.payload, QueueOptionsSchema]),
        output: z.union([
            z.boolean(),
            z.promise(z.boolean()),
            z.function({ input: z.tuple([]), output: z.void() }),
        ])
    });
    
    eventRegistry.register({
        callbackSchema,
        meta: {
            eventName: name,
            legacyName,
            payloadSchema: params.payload,
            defaultQueueOptions: params.defaultQueueOptions,
            ...params.meta
        }
    });
    
    return callbackSchema as any;
}
