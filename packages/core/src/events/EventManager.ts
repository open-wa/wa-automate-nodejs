import PQueue from 'p-queue';
import { EventEmitter } from 'events';

export interface QueueOptions {
    concurrency?: number;
    intervalCap?: number;
    interval?: number;
    timeout?: number;
    priority?: number;
}

export interface EventDefinition {
    meta: {
        eventName: string;
        payloadSchema?: any;
        defaultQueueOptions?: QueueOptions;
    };
}

export interface EventRegistry {
    get(name: string): EventDefinition | undefined;
}

let cachedRegistry: EventRegistry = {
    get: () => undefined
};

let registryLoadPromise: Promise<void> | null = null;

function ensureRegistryLoaded(): void {
    if (!registryLoadPromise) {
        registryLoadPromise = (async () => {
            try {
                const schema = await import('@open-wa/schema');
                cachedRegistry = schema.eventRegistry as EventRegistry;
            } catch {}
        })();
    }
}

export interface EventContext {
    sessionId: string;
    timestamp: number;
    raw?: any;
}

export type EventHandler<T> = (payload: T, ctx: EventContext) => void | Promise<void>;

export interface ListenerHandle {
    id: string;
    event: string;
    off: () => void;
    active: boolean;
}

export class EventManager {
    private emitter = new EventEmitter();
    private handles = new Map<string, ListenerHandle>();
    private queues = new Map<string, PQueue>();
    private handleCounter = 0;
    private sessionId: string;
    
    constructor(sessionId: string) {
        this.sessionId = sessionId;
        this.emitter.setMaxListeners(100);
        ensureRegistryLoaded();
    }
    
    on<T>(
        eventName: string,
        handler: EventHandler<T>,
        options?: QueueOptions
    ): ListenerHandle {
        const id = `listener_${++this.handleCounter}`;
        
        const eventDef = cachedRegistry.get(eventName);
        const mergedOptions = {
            ...eventDef?.meta.defaultQueueOptions,
            ...options,
        };
        
        let queue: PQueue | undefined;
        if (mergedOptions && Object.keys(mergedOptions).length > 0) {
            const queueKey = `${eventName}_${id}`;
            queue = new PQueue({
                concurrency: mergedOptions.concurrency ?? 1,
                intervalCap: mergedOptions.intervalCap,
                interval: mergedOptions.interval,
                timeout: mergedOptions.timeout,
            });
            this.queues.set(queueKey, queue);
        }
        
        const wrappedHandler = async (rawPayload: any) => {
            const ctx: EventContext = {
                sessionId: this.sessionId,
                timestamp: Date.now(),
                raw: rawPayload,
            };
            
            let payload: T;
            if (eventDef?.meta.payloadSchema) {
                try {
                    payload = eventDef.meta.payloadSchema.parse(rawPayload);
                } catch (e) {
                    console.error(`[EventManager] Payload validation failed for ${eventName}:`, e);
                    return;
                }
            } else {
                payload = rawPayload;
            }
            
            const execute = async () => {
                try {
                    await handler(payload, ctx);
                } catch (error) {
                    console.error(`[EventManager] Handler error for ${eventName}:`, error);
                }
            };
            
            if (queue) {
                await queue.add(execute, {
                    priority: options?.priority ?? 0,
                });
            } else {
                await execute();
            }
        };
        
        this.emitter.on(eventName, wrappedHandler);
        
        const handle: ListenerHandle = {
            id,
            event: eventName,
            active: true,
            off: () => {
                this.emitter.off(eventName, wrappedHandler);
                this.queues.delete(`${eventName}_${id}`);
                handle.active = false;
                this.handles.delete(id);
            },
        };
        
        this.handles.set(id, handle);
        return handle;
    }
    
    emit(eventName: string, payload: any): void {
        this.emitter.emit(eventName, payload);
    }
    
    listeners(eventName: string): ListenerHandle[] {
        return Array.from(this.handles.values())
            .filter(h => h.event === eventName && h.active);
    }
    
    removeAllListeners(eventName?: string): void {
        if (eventName) {
            this.listeners(eventName).forEach(h => h.off());
        } else {
            this.handles.forEach(h => h.off());
        }
    }
    
    async drain(): Promise<void> {
        await Promise.all(
            Array.from(this.queues.values()).map(q => q.onIdle())
        );
    }
    
    getQueueStats(): Map<string, { size: number; pending: number }> {
        const stats = new Map<string, { size: number; pending: number }>();
        this.queues.forEach((queue, key) => {
            stats.set(key, {
                size: queue.size,
                pending: queue.pending,
            });
        });
        return stats;
    }
}
