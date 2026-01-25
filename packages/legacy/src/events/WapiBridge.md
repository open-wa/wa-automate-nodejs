# WAPI Bridge Architecture

## Problem

The core WAPI injection code (`wapi.js`, `patch.js`) is proprietary and will never be open-sourced.
However, the **event transport layer** between WAPI and EventManager CAN be open-sourced.

## Clean Separation

```
┌─────────────────┐
│  WhatsApp Web   │  ← PROPRIETARY: Browser DOM, scraping logic
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    wapi.js      │  ← PROPRIETARY: Injected code, extraction logic
└────────┬────────┘
         │
         ▼ (via window.WAPI.onXXX callbacks)
┌─────────────────┐
│  WapiBridge.ts  │  ← OPEN SOURCE: Event marshalling via Puppeteer
└────────┬────────┘
         │
         ▼ (via client.events.emit())
┌─────────────────┐
│  EventManager   │  ← OPEN SOURCE: Type-safe event distribution
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Callbacks  │  ← Public API: client.events.on('message', ...)
└─────────────────┘
```

## What's Open Source

1. **Event Schemas** (`packages/schema/src/events/`)
   - Type definitions for all events
   - Zod validation schemas
   - No WhatsApp internals exposed

2. **EventManager** (`packages/core/src/events/EventManager.ts`)
   - Pure Node.js event distribution
   - No browser/WAPI knowledge

3. **Bridge Interface** (`packages/core/src/events/WapiBridge.ts`) - NEW
   - Abstract interface: `registerEvent(name: string, handler: Function)`
   - Puppeteer `exposeFunction()` setup
   - Maps WAPI callbacks → EventManager.emit()

## What Stays Proprietary

1. **WAPI Injection** (`wapi.js`, `patch.js`)
   - `window.WAPI.waitNewMessages()` implementation
   - WhatsApp DOM scraping
   - Message extraction logic

2. **Patch Manager** (if it contains WAPI-specific code)
   - License validation tied to WAPI features
   - Anti-detection measures

## Implementation

### Open Source: packages/core/src/events/WapiBridge.ts

```typescript
import { Page } from 'puppeteer';
import { EventManager } from './EventManager';

export interface WapiBridgeConfig {
    page: Page;
    events: EventManager;
    sessionId: string;
}

/**
 * Bridges WAPI events to EventManager
 * 
 * WHAT THIS DOES (open source):
 * - Sets up Puppeteer exposeFunction() for each event
 * - Calls events.emit() when WAPI triggers callbacks
 * - Type-safe marshalling of event payloads
 * 
 * WHAT THIS DOESN'T DO (proprietary):
 * - Inject WAPI code into browser
 * - Extract data from WhatsApp DOM
 * - Call window.WAPI.XXX registration functions
 */
export class WapiBridge {
    private page: Page;
    private events: EventManager;
    private sessionId: string;
    private registered = new Set<string>();

    constructor(config: WapiBridgeConfig) {
        this.page = config.page;
        this.events = config.events;
        this.sessionId = config.sessionId;
    }

    /**
     * Register an event bridge
     * 
     * @param eventName - Event name (e.g., 'message')
     * @param wapiCallbackName - WAPI callback name (e.g., '__onMessage')
     */
    async registerEvent(eventName: string, wapiCallbackName: string): Promise<void> {
        if (this.registered.has(eventName)) {
            throw new Error(`Event ${eventName} already registered`);
        }

        await this.page.exposeFunction(wapiCallbackName, (payload: any) => {
            this.events.emit(eventName, payload);
        });

        this.registered.add(eventName);
    }

    /**
     * Register all core events
     * 
     * NOTE: This ONLY sets up the Puppeteer bridge.
     * The actual WAPI registration (window.WAPI.waitNewMessages, etc.)
     * must be done in proprietary code via page.evaluate().
     */
    async registerCoreEvents(): Promise<void> {
        await this.registerEvent('message', '__onMessage');
        await this.registerEvent('anyMessage', '__onAnyMessage');
        await this.registerEvent('messageDeleted', '__onMessageDeleted');
        await this.registerEvent('ack', '__onAck');
        await this.registerEvent('reaction', '__onReaction');
        await this.registerEvent('stateChanged', '__onStateChanged');
        await this.registerEvent('chatState', '__onChatState');
        await this.registerEvent('logout', '__onLogout');
        await this.registerEvent('participantsChanged', '__onParticipantsChanged');
        await this.registerEvent('addedToGroup', '__onAddedToGroup');
    }

    /**
     * Check if event is registered
     */
    isRegistered(eventName: string): boolean {
        return this.registered.has(eventName);
    }

    /**
     * Get all registered events
     */
    getRegisteredEvents(): string[] {
        return Array.from(this.registered);
    }
}
```

### Proprietary: (NOT in repo) - Example of how it would be used

```typescript
// In proprietary patch/init code:
async function initializeWapiListeners(client: Client) {
    // 1. Create bridge (open source)
    const bridge = new WapiBridge({
        page: client._page,
        events: client.events,
        sessionId: client._sessionInfo.sessionId
    });

    // 2. Set up Puppeteer bridges (open source)
    await bridge.registerCoreEvents();

    // 3. Register WAPI callbacks (PROPRIETARY - stays closed)
    await client._page.evaluate(() => {
        // THIS CODE STAYS PROPRIETARY
        window.WAPI.waitNewMessages(false, (message) => {
            window.__onMessage(message);
        });

        window.WAPI.onStateChanged((state) => {
            window.__onStateChanged(state);
        });

        window.WAPI.onAck((ack) => {
            window.__onAck(ack);
        });

        // ... more WAPI-specific registrations ...
    });
}
```

## Benefits

1. **Clean Architecture**: Clear boundary between proprietary and OSS
2. **Testable**: WapiBridge can be unit tested without WAPI
3. **Flexible**: Easy to add new events without touching WAPI code
4. **Type-Safe**: All events validated via schemas
5. **Documentable**: OSS parts can have full docs/tutorials
