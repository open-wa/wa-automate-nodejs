# Issue #6: Plugin Architecture Vision

**Priority**: 🔵 LOW (Vision/Future)  
**Effort**: Large (multi-week project)  
**Impact**: Enables ecosystem growth, unlocks MCP/ACP integration

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

## Proposed Plugin Architecture

### Plugin Definition Format

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
            meta: {
                namespace: 'weight-tracker',
                description: 'Log a weight entry',
            },
            input: z.object({
                userId: z.string(),
                weight: z.number(),
                unit: z.enum(['kg', 'lbs']).default('kg'),
            }),
            parameterOrder: ['userId', 'weight', 'unit'],
            output: z.object({ id: z.string(), timestamp: z.number() }),
        }),
        
        defineMethodV2('getWeightHistory', {
            meta: {
                namespace: 'weight-tracker',
                description: 'Get weight history for a user',
            },
            input: z.object({
                userId: z.string(),
                limit: z.number().default(10),
            }),
            parameterOrder: ['userId', 'limit'],
            output: z.array(z.object({
                weight: z.number(),
                unit: z.string(),
                timestamp: z.number(),
            })),
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
                
                // Store weight
                const entry = {
                    id: crypto.randomUUID(),
                    userId: msg.from,
                    weight,
                    unit,
                    timestamp: Date.now(),
                };
                
                await storage.append('entries', entry);
                
                // Emit event
                ctx.events.emit('weightLogged', entry);
                
                // Reply
                await ctx.client.sendText(
                    msg.from,
                    `✅ Logged: ${weight} ${unit}`
                );
            }
        });
        
        // Implement methods
        ctx.implement('logWeight', async (params) => {
            const entry = {
                id: crypto.randomUUID(),
                userId: params.userId,
                weight: params.weight,
                unit: params.unit,
                timestamp: Date.now(),
            };
            await storage.append('entries', entry);
            ctx.events.emit('weightLogged', entry);
            return entry;
        });
        
        ctx.implement('getWeightHistory', async (params) => {
            const entries = await storage.get('entries', []);
            return entries
                .filter((e: any) => e.userId === params.userId)
                .slice(-params.limit);
        });
    },
    
    uninstall: async (ctx: PluginContext) => {
        // Cleanup
        ctx.events.off('message');
    },
});
```

---

## PluginContext API

```typescript
interface PluginContext {
    /** Session ID */
    sessionId: string;
    
    /** Client instance (for calling methods) */
    client: Client;
    
    /** Event manager */
    events: {
        on<T>(event: string, handler: (payload: T) => void): Unsubscribe;
        emit<T>(event: string, payload: T): void;
        off(event: string): void;
    };
    
    /** Persistent storage */
    storage: {
        namespace(name: string): PluginStorage;
    };
    
    /** Logger */
    logger: Logger;
    
    /** Config passed to plugin */
    config: Record<string, any>;
    
    /** Register method implementation */
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
        // Community plugin
        weightTracker({
            // Plugin-specific config
            storageBackend: 'sqlite',
        }),
        
        // Local plugin
        openCodeNotifier({
            apiEndpoint: 'http://localhost:3000',
        }),
    ],
});
```

---

## MCP/ACP Integration

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

### MCP Server Generation

```typescript
// packages/schema/scripts/gen-mcp-server.ts
import { clientRegistry } from '../src/registry';
import { eventRegistry } from '../src/events';

function generateMCPServer() {
    const methods = clientRegistry.getAll();
    const events = eventRegistry.getAll();
    
    const tools = methods.map(([_, meta]) => ({
        name: `${meta.namespace}/${meta.functionName}`,
        description: meta.description,
        inputSchema: zodToJsonSchema(meta.inputSchema),
    }));
    
    const resources = events.map((event) => ({
        uri: `wa://events/${event.name}`,
        name: event.legacyName,
        description: event.meta.description,
        mimeType: 'application/json',
    }));
    
    return { tools, resources };
}
```

---

## OpenCode Integration Example

Your vision of OpenCode notifications:

```typescript
// plugins/opencode-notifier.ts
import { definePlugin } from '@open-wa/schema';

export default definePlugin({
    name: 'opencode-notifier',
    version: '1.0.0',
    
    install: async (ctx) => {
        // Poll OpenCode for status updates
        const pollOpenCode = async () => {
            const sessions = await fetch(`${ctx.config.apiEndpoint}/sessions`)
                .then(r => r.json());
            
            for (const session of sessions) {
                if (session.status === 'needs_input') {
                    await ctx.client.sendText(
                        ctx.config.notifyTo,
                        `🤖 OpenCode needs input:\n${session.question}\n\nReply with: /oc ${session.id} <response>`
                    );
                }
            }
        };
        
        // Check every 30 seconds
        const interval = setInterval(pollOpenCode, 30000);
        
        // Handle responses
        ctx.events.on('message', async (msg) => {
            const match = msg.body.match(/^\/oc\s+(\S+)\s+(.+)$/s);
            if (match) {
                const [, sessionId, response] = match;
                
                await fetch(`${ctx.config.apiEndpoint}/sessions/${sessionId}/respond`, {
                    method: 'POST',
                    body: JSON.stringify({ response }),
                });
                
                await ctx.client.sendText(msg.from, '✅ Response sent to OpenCode');
            }
        });
        
        // Cleanup
        ctx.cleanup = () => clearInterval(interval);
    },
});
```

---

## Multi-Protocol Support

Plugins can expose capabilities through multiple protocols:

```typescript
// Plugin metadata
export default definePlugin({
    name: 'my-plugin',
    
    // Protocol-specific exports
    protocols: {
        rest: true,        // Expose as REST endpoints
        websocket: true,   // Expose via Socket.io
        webhook: true,     // Support webhook callbacks
        mcp: true,         // Generate MCP tools
        kafka: false,      // Kafka not supported
    },
});
```

---

## Implementation Roadmap

### Phase 1: Foundation (v5.0.0)
- [ ] Complete `clientRegistry` cutover
- [ ] Complete `eventRegistry` implementation
- [ ] Define `PluginContext` interface
- [ ] Basic plugin loading

### Phase 2: Core Plugin System (v5.1.0)
- [ ] `definePlugin` helper
- [ ] Plugin storage abstraction
- [ ] Plugin method implementation
- [ ] Plugin event handling

### Phase 3: Ecosystem (v5.2.0)
- [ ] Plugin registry/marketplace
- [ ] MCP server generation
- [ ] Plugin template generator
- [ ] Community plugin examples

### Phase 4: Advanced (v6.0.0)
- [ ] ACP (Agent Communication Protocol) support
- [ ] S2.dev event streaming
- [ ] Kafka integration
- [ ] Multi-session plugin orchestration

---

## Design Principles

1. **Schema as Contract**: Plugins define schemas, system handles exposure
2. **No Internal Reach**: Plugins use `PluginContext`, not `Client` internals
3. **Isolation**: Plugin storage/events are namespaced
4. **Graceful Degradation**: Plugin failure doesn't crash session
5. **Discovery**: All plugin capabilities are discoverable via registry

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

## Why This Works

The schema-first architecture means:

1. **Methods are data**: Schemas can be introspected, composed, extended
2. **Events are typed**: Plugin events get the same type safety as core
3. **Metadata is rich**: Namespace, license, RBAC all work automatically
4. **Generation is possible**: MCP, OpenAPI, docs all auto-generated

This is the "router for WhatsApp automation" vision realized.
