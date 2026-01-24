# Issue #2: Design and Implement defineListenerV2 Pattern

**Priority**: 🔴 CRITICAL  
**Effort**: 2-3 days  
**Impact**: Enables core bot loop (onMessage → process → respond)

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

---

## Step 1: Create Event Registry

**File**: `packages/schema/src/events/registry.ts` (NEW)

```typescript
import { z } from 'zod';

// ============================================================================
// Event Metadata Types
// ============================================================================

export type EventStatus = 'stable' | 'beta' | 'deprecated' | 'experimental';

export interface ListenerMetadata {
    /** Human-readable description */
    description: string;
    
    /** Event namespace for grouping */
    namespace?: string;
    
    /** Stability status */
    status?: EventStatus;
    
    /** Deprecation reason if deprecated */
    deprecated?: string;
    
    /** License tier required */
    license?: 'none' | 'insiders' | 'restricted';
    
    /** When this event was added */
    since?: string;
}

export interface QueueOptionsSchema {
    /** Max concurrent handlers */
    concurrency?: number;
    
    /** Max handlers per interval */
    intervalCap?: number;
    
    /** Interval in ms */
    interval?: number;
    
    /** Handler timeout in ms */
    timeout?: number;
    
    /** Priority (lower = higher priority) */
    priority?: number;
}

// ============================================================================
// Event Definition
// ============================================================================

export interface EventDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> {
    /** Canonical event name (e.g., 'message', 'ack') */
    name: string;
    
    /** Legacy method name for backward compat (e.g., 'onMessage') */
    legacyName: string;
    
    /** Event metadata */
    meta: ListenerMetadata;
    
    /** Zod schema for the event payload */
    payloadSchema: T;
    
    /** Zod schema for subscription options */
    optionsSchema?: z.ZodObject<any>;
}

// ============================================================================
// Event Registry
// ============================================================================

const eventMap = new Map<string, EventDefinition>();

export const eventRegistry = {
    register<T extends z.ZodTypeAny>(def: EventDefinition<T>): EventDefinition<T> {
        if (eventMap.has(def.name)) {
            throw new Error(`Event ${def.name} already registered`);
        }
        eventMap.set(def.name, def);
        return def;
    },
    
    get(name: string): EventDefinition | undefined {
        return eventMap.get(name);
    },
    
    getByLegacyName(legacyName: string): EventDefinition | undefined {
        for (const def of eventMap.values()) {
            if (def.legacyName === legacyName) return def;
        }
        return undefined;
    },
    
    getAll(): EventDefinition[] {
        return Array.from(eventMap.values());
    },
    
    clear(): void {
        eventMap.clear();
    }
};

// ============================================================================
// defineListenerV2 Helper
// ============================================================================

export function defineListenerV2<T extends z.ZodTypeAny>(
    name: string,
    params: {
        /** Legacy method name (e.g., 'onMessage') */
        legacyName?: string;
        
        /** Event metadata */
        meta: ListenerMetadata;
        
        /** Zod schema for event payload */
        payload: T;
        
        /** Optional: Schema for queue/filter options */
        options?: z.ZodObject<any>;
    }
): EventDefinition<T> {
    const legacyName = params.legacyName || `on${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    
    return eventRegistry.register({
        name,
        legacyName,
        meta: params.meta,
        payloadSchema: params.payload,
        optionsSchema: params.options,
    });
}

// ============================================================================
// Queue Options Schema (Reusable)
// ============================================================================

export const QueueOptionsZodSchema = z.object({
    concurrency: z.number().positive().optional(),
    intervalCap: z.number().positive().optional(),
    interval: z.number().positive().optional(),
    timeout: z.number().positive().optional(),
    priority: z.number().optional(),
}).optional();
```

---

## Step 2: Define Core Events

**File**: `packages/schema/src/events/messaging.ts` (NEW)

```typescript
import { z } from 'zod';
import { defineListenerV2, QueueOptionsZodSchema } from './registry';
import { MessageSchema, AckSchema } from '../common-types';

// ============================================================================
// Message Events
// ============================================================================

export const messageEvent = defineListenerV2('message', {
    meta: {
        description: 'Fired when a new message is received',
        namespace: 'messages',
        status: 'stable',
        license: 'none',
    },
    payload: MessageSchema,
    options: QueueOptionsZodSchema,
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
    options: QueueOptionsZodSchema,
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
    options: QueueOptionsZodSchema,
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
    options: QueueOptionsZodSchema,
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
    options: QueueOptionsZodSchema,
});
```

**File**: `packages/schema/src/events/state.ts` (NEW)

```typescript
import { z } from 'zod';
import { defineListenerV2, QueueOptionsZodSchema } from './registry';

export const stateChangedEvent = defineListenerV2('stateChanged', {
    legacyName: 'onStateChanged',
    meta: {
        description: 'Fired when connection state changes',
        namespace: 'state',
        status: 'stable',
        license: 'none',
    },
    payload: z.object({
        state: z.enum(['CONNECTED', 'DISCONNECTED', 'SYNCING', 'CONFLICT', 'UNLAUNCHED']),
        previousState: z.string().optional(),
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
import { defineListenerV2, QueueOptionsZodSchema } from './registry';

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
    options: QueueOptionsZodSchema,
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

## Step 3: Runtime Event API in Core

**File**: `packages/core/src/events/EventManager.ts` (NEW)

```typescript
import PQueue from 'p-queue';
import { EventEmitter } from 'events';
import { z } from 'zod';
import { EventDefinition, eventRegistry, QueueOptionsSchema } from '@open-wa/schema';

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
     * Subscribe to an event
     */
    on<T>(
        eventName: string,
        handler: EventHandler<T>,
        options?: QueueOptionsSchema
    ): ListenerHandle {
        const id = `listener_${++this.handleCounter}`;
        
        // Create queue if options provided
        let queue: PQueue | undefined;
        if (options) {
            queue = new PQueue({
                concurrency: options.concurrency ?? 1,
                intervalCap: options.intervalCap,
                interval: options.interval,
                timeout: options.timeout,
            });
            this.queues.set(id, queue);
        }
        
        // Wrap handler with queue and context
        const wrappedHandler = async (payload: T, raw?: any) => {
            const ctx: EventContext = {
                sessionId: this.sessionId,
                timestamp: Date.now(),
                raw,
            };
            
            if (queue) {
                await queue.add(() => handler(payload, ctx), {
                    priority: options?.priority ?? 0,
                });
            } else {
                await handler(payload, ctx);
            }
        };
        
        // Subscribe
        this.emitter.on(eventName, wrappedHandler);
        
        // Create handle
        const handle: ListenerHandle = {
            id,
            event: eventName,
            active: true,
            off: () => {
                this.emitter.off(eventName, wrappedHandler);
                this.queues.delete(id);
                handle.active = false;
                this.handles.delete(id);
            },
        };
        
        this.handles.set(id, handle);
        return handle;
    }
    
    /**
     * Emit an event
     */
    emit<T>(eventName: string, payload: T, raw?: any): void {
        this.emitter.emit(eventName, payload, raw);
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
}
```

---

## Step 4: Add Legacy Wrapper Methods to Client

**File**: `packages/core/src/api/Client.ts` (modifications)

```typescript
import { EventManager, ListenerHandle, EventHandler } from '../events/EventManager';
import { QueueOptionsSchema } from '@open-wa/schema';
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
     */
    onMessage(
        callback: (message: Message) => void | Promise<void>,
        options?: QueueOptionsSchema
    ): ListenerHandle {
        return this.events.on('message', callback, options);
    }
    
    /**
     * Listen for any message (including own)
     */
    onAnyMessage(
        callback: (message: Message) => void | Promise<void>,
        options?: QueueOptionsSchema
    ): ListenerHandle {
        return this.events.on('anyMessage', callback, options);
    }
    
    /**
     * Listen for message acknowledgments
     */
    onAck(
        callback: (ack: Ack) => void | Promise<void>,
        options?: QueueOptionsSchema
    ): ListenerHandle {
        return this.events.on('ack', callback, options);
    }
    
    /**
     * Listen for connection state changes
     */
    onStateChanged(
        callback: (state: { state: string; previousState?: string }) => void | Promise<void>
    ): ListenerHandle {
        return this.events.on('stateChanged', callback);
    }
    
    /**
     * Listen for logout events
     */
    onLogout(
        callback: () => void | Promise<void>
    ): ListenerHandle {
        return this.events.on('logout', callback);
    }
    
    // ... more listeners following same pattern ...
}
```

---

## Step 5: Wire WAPI Events to EventManager

**File**: `packages/core/src/api/Client.ts` (in initialization)

```typescript
private async registerWapiListeners(): Promise<void> {
    // Message events
    await this._page.exposeFunction('__onMessage', (message: any) => {
        this.events.emit('message', message, message);
    });
    
    await this._page.exposeFunction('__onAnyMessage', (message: any) => {
        this.events.emit('anyMessage', message, message);
    });
    
    await this._page.exposeFunction('__onAck', (ack: any) => {
        this.events.emit('ack', ack, ack);
    });
    
    await this._page.exposeFunction('__onStateChanged', (state: any) => {
        this.events.emit('stateChanged', state, state);
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

## Step 6: Generate Event Documentation

**File**: `packages/schema/scripts/gen-events-openapi.ts` (NEW)

```typescript
import fs from 'fs';
import path from 'path';
import { eventRegistry } from '../src/events';
import '../src/events'; // Trigger registration

const generatedDir = path.join(__dirname, '../src/generated');

const events = eventRegistry.getAll();

const webhookPaths: Record<string, any> = {};

events.forEach((event) => {
    webhookPaths[`/webhooks/${event.name}`] = {
        post: {
            summary: event.meta.description,
            description: `Webhook callback for ${event.legacyName} event`,
            tags: [event.meta.namespace || 'events'],
            requestBody: {
                content: {
                    'application/json': {
                        schema: event.payloadSchema,
                    },
                },
            },
            responses: {
                200: { description: 'Acknowledged' },
            },
        },
    };
});

fs.writeFileSync(
    path.join(generatedDir, 'events-openapi.json'),
    JSON.stringify({ paths: webhookPaths }, null, 2)
);

console.log(`Generated documentation for ${events.length} events`);
```

---

## Verification Steps

1. **Create test file**:
   ```typescript
   // packages/schema/src/events/registry.test.ts
   import { eventRegistry, defineListenerV2 } from './registry';
   import { z } from 'zod';
   
   describe('eventRegistry', () => {
       beforeEach(() => eventRegistry.clear());
       
       it('registers and retrieves events', () => {
           const event = defineListenerV2('test', {
               meta: { description: 'Test event' },
               payload: z.object({ foo: z.string() }),
           });
           
           expect(eventRegistry.get('test')).toBe(event);
           expect(eventRegistry.getByLegacyName('onTest')).toBe(event);
       });
   });
   ```

2. **Test EventManager**:
   ```typescript
   const manager = new EventManager('test-session');
   
   const messages: any[] = [];
   const handle = manager.on('message', (msg) => messages.push(msg));
   
   manager.emit('message', { body: 'Hello' });
   
   expect(messages).toHaveLength(1);
   
   handle.off();
   manager.emit('message', { body: 'World' });
   
   expect(messages).toHaveLength(1); // Still 1, unsubscribed
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

### Nice-to-Have (can defer to v5.1.0)
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

## Expected Outcomes

| Before | After |
|--------|-------|
| No listener schema definitions | All listeners defined in eventRegistry |
| Callbacks not typed | Payload schemas provide type safety |
| No cleanup mechanism documented | ListenerHandle with explicit `off()` |
| Queue options scattered | Standardized QueueOptionsSchema |
| No event documentation | Events appear in OpenAPI/docs |
