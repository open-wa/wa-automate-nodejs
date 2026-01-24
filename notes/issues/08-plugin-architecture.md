# Issue #08: Plugin Architecture Vision

**Priority**: LOW (Vision/Future)  
**Effort**: Large (multi-week project)  
**Risk**: LOW (vision doc, no code changes)  
**Depends on**: All core migration issues (01-07)  
**Blocks**: Nothing (this is aspirational)

---

## Status: VISION DOCUMENT

This is a **vision document** for future development. No implementation is planned for v5.0.

---

## Vision Statement

Transform wa-automate from a library into a **platform**:

> "The router for WhatsApp automation - everything pluggable"

Users should be able to:
1. Install plugins with one-liner configs
2. Create custom plugins easily
3. Share plugins with the community
4. Integrate with AI agents (MCP/ACP)

---

## How Schema-First Enables Plugins

The schema-first architecture is **perfectly positioned** for a plugin system:

| Schema Feature | Plugin Benefit |
|----------------|----------------|
| `defineMethodV2` | Plugins can add new methods |
| `defineListenerV2` | Plugins can subscribe to events |
| Rich metadata | Auto-routing, auto-docs, license gating |
| `clientRegistry` | Central registration, discovery |
| Zod validation | Runtime type safety |

---

## Proposed Plugin Format

```typescript
// @open-wa/plugin-weight-tracker/index.ts
import { definePlugin, defineMethodV2, defineListenerV2 } from '@open-wa/schema';
import { z } from 'zod';

export default definePlugin({
    name: 'weight-tracker',
    version: '1.0.0',
    description: 'Track weight via WhatsApp messages',
    author: 'community',
    
    // Schema definitions
    methods: [
        defineMethodV2('logWeight', {
            meta: { namespace: 'weight-tracker', description: 'Log a weight entry' },
            input: z.object({
                userId: z.string(),
                weight: z.number(),
                unit: z.enum(['kg', 'lbs']).default('kg'),
            }),
            parameterOrder: ['userId', 'weight', 'unit'],
            output: z.object({ id: z.string(), timestamp: z.number() }),
        }),
    ],
    
    events: [
        defineListenerV2('weightLogged', {
            meta: { description: 'Fired when weight is logged' },
            payload: z.object({
                userId: z.string(),
                weight: z.number(),
                unit: z.string(),
            }),
        }),
    ],
    
    // Runtime behavior
    install: async (ctx: PluginContext) => {
        const storage = ctx.storage.namespace('weight-tracker');
        
        // Listen for messages
        ctx.events.on('message', async (msg) => {
            const match = msg.body.match(/^\/weight\s+(\d+(?:\.\d+)?)\s*(kg|lbs)?$/i);
            if (match) {
                const weight = parseFloat(match[1]);
                const unit = (match[2] || 'kg').toLowerCase();
                
                const entry = {
                    id: crypto.randomUUID(),
                    userId: msg.from,
                    weight,
                    unit,
                    timestamp: Date.now(),
                };
                
                await storage.append('entries', entry);
                ctx.events.emit('weightLogged', entry);
                await ctx.client.sendText(msg.from, `Logged: ${weight} ${unit}`);
            }
        });
        
        // Implement methods
        ctx.implement('logWeight', async (params) => {
            const entry = {
                id: crypto.randomUUID(),
                ...params,
                timestamp: Date.now(),
            };
            await storage.append('entries', entry);
            ctx.events.emit('weightLogged', entry);
            return entry;
        });
    },
});
```

---

## PluginContext API

```typescript
interface PluginContext {
    sessionId: string;
    client: Client;
    
    events: {
        on<T>(event: string, handler: (payload: T) => void): Unsubscribe;
        emit<T>(event: string, payload: T): void;
        off(event: string): void;
    };
    
    storage: {
        namespace(name: string): PluginStorage;
    };
    
    logger: Logger;
    config: Record<string, any>;
    
    implement(methodName: string, impl: (params: any) => Promise<any>): void;
}

interface PluginStorage {
    get<T>(key: string, defaultValue?: T): Promise<T>;
    set<T>(key: string, value: T): Promise<void>;
    append<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
```

---

## Plugin Loading

```typescript
// wa-automate.config.ts
import { defineConfig } from '@open-wa/wa-automate';
import weightTracker from '@open-wa/plugin-weight-tracker';
import openCodeNotifier from './plugins/opencode-notifier';

export default defineConfig({
    sessionId: 'my-session',
    
    plugins: [
        weightTracker({ storageBackend: 'sqlite' }),
        openCodeNotifier({ apiEndpoint: 'http://localhost:3000' }),
    ],
});
```

---

## MCP Integration

With schema-first plugins, MCP tools can be auto-generated:

```typescript
// Generated MCP tool definition
{
    "name": "weight-tracker/logWeight",
    "description": "Log a weight entry",
    "inputSchema": {
        "type": "object",
        "properties": {
            "userId": { "type": "string" },
            "weight": { "type": "number" },
            "unit": { "type": "string", "enum": ["kg", "lbs"] }
        },
        "required": ["userId", "weight"]
    }
}
```

---

## Example Plugin Ideas

| Plugin | Description | Complexity |
|--------|-------------|------------|
| `@open-wa/plugin-logger` | Log all messages to ElasticSearch | Low |
| `@open-wa/plugin-translate` | Auto-translate messages | Medium |
| `@open-wa/plugin-scheduler` | Schedule messages | Medium |
| `@open-wa/plugin-opencode` | OpenCode integration | Medium |
| `@open-wa/plugin-crm` | CRM integration (Salesforce, HubSpot) | High |
| `@open-wa/plugin-ai-agent` | Full AI agent with memory | High |

---

## Implementation Roadmap

| Phase | Scope | Target |
|-------|-------|--------|
| Phase 1 | Complete `clientRegistry` cutover | v5.0 |
| Phase 1 | Complete `eventRegistry` implementation | v5.0 |
| Phase 2 | `definePlugin` helper | v5.1 |
| Phase 2 | Plugin storage abstraction | v5.1 |
| Phase 3 | Plugin registry/marketplace | v5.2 |
| Phase 3 | MCP server generation | v5.2 |
| Phase 4 | ACP support | v6.0 |

---

## Design Principles

1. **Schema as Contract**: Plugins define schemas, system handles exposure
2. **No Internal Reach**: Plugins use `PluginContext`, not `Client` internals
3. **Isolation**: Plugin storage/events are namespaced
4. **Graceful Degradation**: Plugin failure doesn't crash session
5. **Discovery**: All plugin capabilities are discoverable via registry

---

## Why This Works

The schema-first architecture means:

1. **Methods are data**: Schemas can be introspected, composed, extended
2. **Events are typed**: Plugin events get the same type safety as core
3. **Metadata is rich**: Namespace, license, RBAC all work automatically
4. **Generation is possible**: MCP, OpenAPI, docs all auto-generated

This is the "router for WhatsApp automation" vision realized.
