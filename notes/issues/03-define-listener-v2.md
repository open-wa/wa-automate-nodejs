# Issue #03: Design and Implement defineListenerV2 Pattern

**Priority**: 🟡 HIGH  
**Effort**: 2-3 days  
**Risk**: 🟠 Major  
**Depends on**: 01, 01a, 02  
**Blocks**: Event transport strategy, Plugin architecture

---

## Problem Statement

30 listener methods need migration to the schema-first system:

- `onMessage`, `onAnyMessage`, `onMessageDeleted`
- `onAck`, `onReaction`, `onPollVote`
- `onChatState`, `onStateChanged`
- `onParticipantsChanged`, `onAddedToGroup`
- etc.

Unlike regular methods, listeners:
- Accept **callbacks** (not serializable for REST)
- Need **cleanup/unsubscription** support
- Often use **priority queues** for rate limiting
- Emit **typed payloads** (Message, Ack, etc.)

### Current Implementation (Client.ts lines 870-1163)

```typescript
public async onMessage(fn: (message: Message) => void, queueOptions ?: Options<PriorityQueue, DefaultAddOptions>) : Promise<Listener | boolean> {
    const _fn = async (message : Message) => fn(await this.preprocessMessage(message, 'onMessage'))
    return this.registerListener(SimpleListener.Message, _fn, queueOptions);
}
```

---

## Design Goals

1. **Symmetric with methods**: Same registry pattern (key by name, store schema)
2. **Type-safe payloads**: Zod validation at boundary
3. **Queue support**: PQueue integration for rate limiting
4. **Cleanup semantics**: Return unsubscribe function
5. **Generator-friendly**: Enable event docs/OpenAPI generation

---

## Step 1: Create Event Registry (Symmetric with Method Registry)

**File**: `packages/schema/src/events/registry.ts` (NEW)

```typescript
import { z } from 'zod';
import { Options as PQueueOptions, DefaultAddOptions } from 'p-queue';
import PriorityQueue from 'p-queue/dist/priority-queue';
import { LicenseTier } from '../enums';

// ============================================================================
// Event Metadata (Symmetric with ClientFunctionMetadata)
// ============================================================================

export type EventStatus = 'stable' | 'beta' | 'deprecated' | 'experimental';

export interface EventMetadata {
    /** Canonical event name (e.g., 'message', 'ack') */
    eventName: string;
    
    /** Legacy method name for backward compat (e.g., 'onMessage') */
    legacyName: string;
    
    /** Human-readable description */
    description?: string;
    
    /** Event namespace for grouping */
    namespace?: string;
    
    /** Stability status */
    status?: EventStatus;
    
    /** Deprecation reason if deprecated */
    deprecated?: string;
    
    /** License tier required */
    license?: LicenseTier;
    
    /** When this event was added */
    since?: string;
    
    /** Zod schema for the event payload */
    payloadSchema: z.ZodTypeAny;
    
    /** Default queue options */
    defaultQueueOptions?: PQueueOptions<PriorityQueue, DefaultAddOptions>;
}

// ============================================================================
// Event Definition (Symmetric with MethodDefinition)
// ============================================================================

export interface EventDefinition {
    /** The callback schema: (payload: T) => void | Promise<void> */
    callbackSchema: z.ZodFunction<any, any>;
    
    /** Event metadata */
    meta: EventMetadata;
}

// ============================================================================
// Event Registry (Same pattern as clientRegistry)
// ============================================================================

const eventsByName = new Map<string, EventDefinition>();
const nameByCallback = new WeakMap<z.ZodFunction<any, any>, string>();

export const eventRegistry = {
    /**
     * Register an event definition
     * @throws Error if event name is already registered
     */
    register(def: EventDefinition): z.ZodFunction<any, any> {
        const name = def.meta.eventName;
        
        if (eventsByName.has(name)) {
            throw new Error(`Event "${name}" already registered`);
        }
        
        eventsByName.set(name, def);
        nameByCallback.set(def.callbackSchema, name);
        
        return def.callbackSchema;
    },
    
    /**
     * Get event by name (primary lookup)
     */
    get(name: string): EventDefinition | undefined {
        return eventsByName.get(name);
    },
    
    /**
     * Get event by legacy name (e.g., 'onMessage')
     */
    getByLegacyName(legacyName: string): EventDefinition | undefined {
        for (const def of eventsByName.values()) {
            if (def.meta.legacyName === legacyName) return def;
        }
        return undefined;
    },
    
    /**
     * Check if event exists
     */
    has(name: string): boolean {
        return eventsByName.has(name);
    },
    
    /**
     * Get all registered events
     */
    getAll(): EventDefinition[] {
        return Array.from(eventsByName.values());
    },
    
    /**
     * Get events by namespace
     */
    getByNamespace(namespace: string): EventDefinition[] {
        return this.getAll().filter(def => def.meta.namespace === namespace);
    },
    
    /**
     * Clear registry (for testing)
     */
    clear(): void {
        eventsByName.clear();
    }
};
```

---

## Step 2: Create defineListenerV2 Helper

**File**: `packages/schema/src/events/registry.ts` (continued)

```typescript
// ============================================================================
// Queue Options Schema (Reusable)
// ============================================================================

export const QueueOptionsSchema = z.object({
    concurrency: z.number().positive().optional(),
    intervalCap: z.number().positive().optional(),
    interval: z.number().positive().optional(),
    timeout: z.number().positive().optional(),
    priority: z.number().optional(),
}).optional();

export type QueueOptions = z.infer<typeof QueueOptionsSchema>;

// ============================================================================
// defineListenerV2 - Symmetric with defineMethodV2
// ============================================================================

/**
 * Define a typed event listener schema
 * 
 * @param name - Canonical event name (e.g., 'message', 'ack')
 * @param params - Configuration including metadata and payload schema
 * @returns The callback schema for this event
 * 
 * @example
 * export const messageEvent = defineListenerV2('message', {
 *     legacyName: 'onMessage',
 *     meta: {
 *         description: 'Fired when a new message is received',
 *         namespace: 'messages',
 *         license: 'none',
 *     },
 *     payload: MessageSchema,
 * });
 */
export function defineListenerV2<T extends z.ZodTypeAny>(
    name: string,
    params: {
        /** Legacy method name (e.g., 'onMessage') - defaults to on{Name} */
        legacyName?: string;
        
        /** Event metadata */
        meta: Omit<EventMetadata, 'eventName' | 'legacyName' | 'payloadSchema'>;
        
        /** Zod schema for event payload */
        payload: T;
        
        /** Default queue options */
        defaultQueueOptions?: PQueueOptions<PriorityQueue, DefaultAddOptions>;
    }
): z.ZodFunction<z.ZodTuple<[T, QueueOptions?]>, z.ZodUnion<[z.ZodBoolean, z.ZodPromise<z.ZodBoolean>, z.ZodFunction<any, any>]>> {
    
    // Auto-generate legacy name if not provided
    const legacyName = params.legacyName || `on${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    
    // Create callback schema: (payload: T, options?: QueueOptions) => Unsubscribe
    const callbackSchema = z.function()
        .args(params.payload, QueueOptionsSchema)
        .returns(z.union([
            z.boolean(),                           // Legacy: true/false
            z.promise(z.boolean()),                // Legacy: Promise<boolean>
            z.function().returns(z.void()),        // Modern: unsubscribe function
        ]));
    
    // Register in event registry
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
```

---

## Step 3: Define Core Events

**File**: `packages/schema/src/events/messaging.ts` (NEW)

```typescript
import { z } from 'zod';
import { defineListenerV2 } from './registry';
import { MessageSchema, AckSchema } from '../common-types';

// ============================================================================
// Message Events
// ============================================================================

export const messageEvent = defineListenerV2('message', {
    legacyName: 'onMessage',
    meta: {
        description: 'Fired when a new message is received (excluding own messages)',
        namespace: 'messages',
        status: 'stable',
        license: 'none',
    },
    payload: MessageSchema,
    defaultQueueOptions: { concurrency: 1 },
});

export const anyMessageEvent = defineListenerV2('anyMessage', {
    legacyName: 'onAnyMessage',
    meta: {
        description: 'Fired for any message including own messages',
        namespace: 'messages',
        status: 'stable',
        license: 'none',
    },
    payload: MessageSchema,
    defaultQueueOptions: { concurrency: 1 },
});

export const messageDeletedEvent = defineListenerV2('messageDeleted', {
    legacyName: 'onMessageDeleted',
    meta: {
        description: 'Fired when a message is deleted',
        namespace: 'messages',
        status: 'stable',
        license: 'none',
    },
    payload: MessageSchema,
});

export const ackEvent = defineListenerV2('ack', {
    legacyName: 'onAck',
    meta: {
        description: 'Fired when a message acknowledgment is received',
        namespace: 'messages',
        status: 'stable',
        license: 'none',
    },
    payload: AckSchema,
});

export const reactionEvent = defineListenerV2('reaction', {
    legacyName: 'onReaction',
    meta: {
        description: 'Fired when a reaction is added to a message',
        namespace: 'messages',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        messageId: z.string(),
        reaction: z.string(),
        senderId: z.string(),
        timestamp: z.number(),
    }),
});
```

**File**: `packages/schema/src/events/state.ts` (NEW)

```typescript
import { z } from 'zod';
import { defineListenerV2 } from './registry';

export const StateEnum = z.enum([
    'CONNECTED',
    'DISCONNECTED', 
    'SYNCING',
    'CONFLICT',
    'UNLAUNCHED',
    'PAIRING',
    'TIMEOUT',
]);

export const stateChangedEvent = defineListenerV2('stateChanged', {
    legacyName: 'onStateChanged',
    meta: {
        description: 'Fired when connection state changes',
        namespace: 'state',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        state: StateEnum,
        previousState: StateEnum.optional(),
    }),
});

export const chatStateEvent = defineListenerV2('chatState', {
    legacyName: 'onChatState',
    meta: {
        description: 'Fired when someone is typing or recording',
        namespace: 'state',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        chatId: z.string(),
        state: z.enum(['typing', 'recording', 'paused']),
        senderId: z.string(),
    }),
});

export const logoutEvent = defineListenerV2('logout', {
    legacyName: 'onLogout',
    meta: {
        description: 'Fired when the session is logged out',
        namespace: 'state',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        reason: z.string().optional(),
        timestamp: z.number(),
    }),
});
```

**File**: `packages/schema/src/events/groups.ts` (NEW)

```typescript
import { z } from 'zod';
import { defineListenerV2 } from './registry';

export const participantsChangedEvent = defineListenerV2('participantsChanged', {
    legacyName: 'onParticipantsChanged',
    meta: {
        description: 'Fired when group participants change',
        namespace: 'groups',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        groupId: z.string(),
        action: z.enum(['add', 'remove', 'promote', 'demote']),
        participantIds: z.array(z.string()),
        by: z.string().optional(),
    }),
});

export const addedToGroupEvent = defineListenerV2('addedToGroup', {
    legacyName: 'onAddedToGroup',
    meta: {
        description: 'Fired when you are added to a group',
        namespace: 'groups',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        groupId: z.string(),
        groupName: z.string(),
        addedBy: z.string().optional(),
    }),
});
```

**File**: `packages/schema/src/events/index.ts` (NEW)

```typescript
// Re-export registry
export * from './registry';

// Re-export all event definitions
export * from './messaging';
export * from './state';
export * from './groups';
```

---

## Step 4: Runtime Event Manager in Core

**File**: `packages/core/src/events/EventManager.ts` (NEW)

```typescript
import PQueue from 'p-queue';
import { EventEmitter } from 'events';
import { z } from 'zod';
import { EventDefinition, eventRegistry, QueueOptions } from '@open-wa/schema/events';

// ============================================================================
// Types
// ============================================================================

export interface EventContext {
    sessionId: string;
    timestamp: number;
    raw?: any;
}

export type EventHandler<T> = (payload: T, ctx: EventContext) => void | Promise<void>;

export interface ListenerHandle {
    /** Unique listener ID */
    id: string;
    
    /** Event name */
    event: string;
    
    /** Unsubscribe function */
    off: () => void;
    
    /** Whether still active */
    active: boolean;
}

// ============================================================================
// EventManager
// ============================================================================

export class EventManager {
    private emitter = new EventEmitter();
    private handles = new Map<string, ListenerHandle>();
    private queues = new Map<string, PQueue>();
    private handleCounter = 0;
    private sessionId: string;
    
    constructor(sessionId: string) {
        this.sessionId = sessionId;
        this.emitter.setMaxListeners(100);
    }
    
    /**
     * Subscribe to an event with type-safe payload
     */
    on<T>(
        eventName: string,
        handler: EventHandler<T>,
        options?: QueueOptions
    ): ListenerHandle {
        const id = `listener_${++this.handleCounter}`;
        
        // Merge with default queue options from event definition
        const eventDef = eventRegistry.get(eventName);
        const mergedOptions = {
            ...eventDef?.meta.defaultQueueOptions,
            ...options,
        };
        
        // Create queue if options provided
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
        
        // Wrap handler with queue, context, and error handling
        const wrappedHandler = async (rawPayload: any) => {
            const ctx: EventContext = {
                sessionId: this.sessionId,
                timestamp: Date.now(),
                raw: rawPayload,
            };
            
            // Parse payload using event schema (fail loud)
            let payload: T;
            if (eventDef?.meta.payloadSchema) {
                try {
                    payload = eventDef.meta.payloadSchema.parse(rawPayload);
                } catch (e) {
                    console.error(`[EventManager] Payload validation failed for ${eventName}:`, e);
                    return; // Drop invalid payload
                }
            } else {
                payload = rawPayload;
            }
            
            const execute = async () => {
                try {
                    await handler(payload, ctx);
                } catch (error) {
                    console.error(`[EventManager] Handler error for ${eventName}:`, error);
                    // Fail loud but isolate - log error, keep process alive
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
        
        // Subscribe to emitter
        this.emitter.on(eventName, wrappedHandler);
        
        // Create handle with unsubscribe
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
    
    /**
     * Emit an event (typically called from WAPI bridge)
     */
    emit(eventName: string, payload: any): void {
        this.emitter.emit(eventName, payload);
    }
    
    /**
     * Get all active listeners for an event
     */
    listeners(eventName: string): ListenerHandle[] {
        return Array.from(this.handles.values())
            .filter(h => h.event === eventName && h.active);
    }
    
    /**
     * Remove all listeners for an event
     */
    removeAllListeners(eventName?: string): void {
        if (eventName) {
            this.listeners(eventName).forEach(h => h.off());
        } else {
            this.handles.forEach(h => h.off());
        }
    }
    
    /**
     * Wait for all queued handlers to complete
     */
    async drain(): Promise<void> {
        await Promise.all(
            Array.from(this.queues.values()).map(q => q.onIdle())
        );
    }
    
    /**
     * Get queue statistics
     */
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
```

---

## Step 5: Add Legacy Wrapper Methods to Client

**File**: `packages/core/src/api/Client.ts` (modifications)

```typescript
import { EventManager, ListenerHandle, EventHandler } from '../events/EventManager';
import { QueueOptions } from '@open-wa/schema/events';
import { Message, Ack } from './model';

export class Client {
    // ... existing properties ...
    
    /** Event manager for schema-driven events */
    public events: EventManager;
    
    constructor(/* ... */) {
        // ... existing code ...
        this.events = new EventManager(this._createConfig.sessionId || 'session');
    }
    
    // ========================================================================
    // Legacy Listener Wrappers (backward compatible)
    // ========================================================================
    
    /**
     * Listen for new messages
     * @param callback - Handler function
     * @param options - Queue options
     * @returns Listener handle with off() method
     */
    public onMessage(
        callback: (message: Message) => void | Promise<void>,
        options?: QueueOptions
    ): ListenerHandle {
        return this.events.on('message', async (msg, ctx) => {
            const processed = await this.preprocessMessage(msg, 'onMessage');
            await callback(processed);
        }, options);
    }
    
    /**
     * Listen for any message (including own)
     */
    public onAnyMessage(
        callback: (message: Message) => void | Promise<void>,
        options?: QueueOptions
    ): ListenerHandle {
        return this.events.on('anyMessage', async (msg, ctx) => {
            const processed = await this.preprocessMessage(msg, 'onAnyMessage');
            await callback(processed);
        }, options);
    }
    
    /**
     * Listen for message deletions
     */
    public onMessageDeleted(
        callback: (message: Message) => void | Promise<void>
    ): ListenerHandle {
        return this.events.on('messageDeleted', callback);
    }
    
    /**
     * Listen for message acknowledgments
     */
    public onAck(
        callback: (ack: Ack) => void | Promise<void>,
        options?: QueueOptions
    ): ListenerHandle {
        return this.events.on('ack', callback, options);
    }
    
    /**
     * Listen for connection state changes
     */
    public onStateChanged(
        callback: (state: { state: string; previousState?: string }) => void | Promise<void>
    ): ListenerHandle {
        return this.events.on('stateChanged', callback);
    }
    
    /**
     * Listen for logout events
     */
    public onLogout(
        callback: () => void | Promise<void>
    ): ListenerHandle {
        return this.events.on('logout', callback);
    }
    
    // ... more listeners following same pattern ...
}
```

---

## Step 6: Wire WAPI Events to EventManager

**File**: `packages/core/src/api/Client.ts` (in initialization)

```typescript
private async registerWapiListeners(): Promise<void> {
    // Message events
    await this._page.exposeFunction('__onMessage', (message: any) => {
        this.events.emit('message', message);
    });
    
    await this._page.exposeFunction('__onAnyMessage', (message: any) => {
        this.events.emit('anyMessage', message);
    });
    
    await this._page.exposeFunction('__onMessageDeleted', (message: any) => {
        this.events.emit('messageDeleted', message);
    });
    
    await this._page.exposeFunction('__onAck', (ack: any) => {
        this.events.emit('ack', ack);
    });
    
    await this._page.exposeFunction('__onStateChanged', (state: any) => {
        this.events.emit('stateChanged', state);
    });
    
    // Register with WAPI
    await this._page.evaluate(() => {
        (window as any).WAPI.waitNewMessages(false, (message: any) => {
            (window as any).__onMessage(message);
        });
        
        (window as any).WAPI.onStateChanged((state: any) => {
            (window as any).__onStateChanged(state);
        });
        
        // ... more registrations ...
    });
}
```

---

## Edge Cases to Handle

### 1. Handler Throws/Rejects

**Strategy**: Fail loud but isolate - log error, keep process alive

```typescript
try {
    await handler(payload, ctx);
} catch (error) {
    console.error(`[EventManager] Handler error for ${eventName}:`, error);
    // Don't re-throw - keep other handlers running
}
```

### 2. Backpressure (Queue Grows Unbounded)

**Strategy**: Document limits, expose metrics

```typescript
// Add to EventManager
getQueueStats(): Map<string, { size: number; pending: number }>;

// Users can monitor and drop events if needed
const stats = client.events.getQueueStats();
if (stats.get('message')?.pending > 1000) {
    console.warn('Message queue backlog detected');
}
```

### 3. Cleanup on Session End

**Strategy**: Auto-remove listeners on logout/disconnect

```typescript
// In Client.ts
this.events.on('logout', () => {
    this.events.removeAllListeners();
});
```

### 4. Payload Validation Failure

**Strategy**: Log and drop invalid payloads

```typescript
try {
    payload = eventDef.meta.payloadSchema.parse(rawPayload);
} catch (e) {
    console.error(`Payload validation failed for ${eventName}:`, e);
    return; // Drop invalid payload
}
```

---

## Migration Checklist

### Core Listeners (CRITICAL for v5.0.0)
- [ ] `onMessage`
- [ ] `onAnyMessage`
- [ ] `onAck`
- [ ] `onStateChanged`
- [ ] `onLogout`
- [ ] `onChatState`

### Group Listeners (HIGH priority)
- [ ] `onParticipantsChanged`
- [ ] `onAddedToGroup`
- [ ] `onGlobalParticipantsChanged`

### Nice-to-Have (defer to v5.1.0)
- [ ] `onButton`
- [ ] `onPollVote`
- [ ] `onReaction`
- [ ] `onBroadcast`
- [ ] `onOrder`
- [ ] `onNewProduct`
- [ ] `onStory`
- [ ] `onIncomingCall`
- [ ] `onCallState`
- [ ] `onBattery`
- [ ] `onPlugged`
- [ ] `onLabel`
- [ ] `onLiveLocation`

---

## Verification

```typescript
// Test: EventManager works
import { EventManager } from '@open-wa/core/events';
import '@open-wa/schema/events'; // Trigger registration

const manager = new EventManager('test-session');

const messages: any[] = [];
const handle = manager.on('message', (msg) => messages.push(msg));

manager.emit('message', { body: 'Hello' });

// Wait for queue
await new Promise(r => setTimeout(r, 10));

expect(messages).toHaveLength(1);

// Unsubscribe works
handle.off();
manager.emit('message', { body: 'World' });
await new Promise(r => setTimeout(r, 10));

expect(messages).toHaveLength(1); // Still 1, unsubscribed
```

---

## Expected Outcomes

| Before | After |
|--------|-------|
| No listener schema definitions | All listeners in eventRegistry |
| Callbacks not typed | Payload schemas provide type safety |
| No cleanup mechanism documented | ListenerHandle with explicit `off()` |
| Queue options scattered | Standardized QueueOptions |
| No event documentation | Events appear in OpenAPI/docs (future) |
