# Issue #11: Core Package Monorepo Refactor Plan

> **Status**: Planning  
> **Priority**: High  
> **Effort**: Large (3-5 days for scaffolding + migration foundation)  
> **Related**: #07 (Driver Abstraction), #10 (Config Package)

## Executive Summary

Split the monolithic `packages/core` (~77 files, ~17k lines, ~75 dependencies) into focused, single-responsibility packages. Rename current core to `packages/legacy` for reference, create a new minimal `packages/core` as the orchestration backbone, and establish an `integrations/` folder for 3rd party integrations using an event-based plugin system.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Package Mapping](#3-package-mapping-current--new)
4. [Integration Framework Design](#4-integration-framework-design)
5. [Event System Design](#5-event-system-design)
6. [Migration Strategy](#6-migration-strategy)
7. [Phased Implementation Plan](#7-phased-implementation-plan)
8. [Risk Assessment](#8-risk-assessment)

---

## 1. Current State Analysis

### 1.1 Directory Structure

```
packages/core/src/
├── api/                    # Client + models (~5000 lines in Client.ts alone)
│   ├── Client.ts           # Monolithic 4951-line client class
│   ├── model/              # 33 TypeScript interface files
│   └── functions/          # Exposed function enums
├── cli/                    # CLI implementation + integrations
│   ├── index.ts            # CLI entry
│   ├── server.ts           # Express server
│   ├── setup.ts            # Config loading
│   └── integrations/       # Chatwoot, Cloudflare tunnels
├── controllers/            # Browser automation + lifecycle
│   ├── browser.ts          # Puppeteer-specific (550 lines)
│   ├── initializer.ts      # create() function (475 lines)
│   ├── auth.ts             # QR/auth flow (296 lines)
│   ├── events.ts           # EventEmitter2 + Spin class
│   └── popup/              # QR popup server
├── events/                 # New EventManager (not yet integrated)
│   ├── EventManager.ts     # Queue-aware event handling
│   └── WapiBridge.ts       # WAPI bridge
├── structures/             # Data structures
│   ├── Collector.ts        # Discord-style collector
│   ├── MessageCollector.ts # Message-specific collector
│   └── preProcessors.ts    # S3 upload preprocessors
├── logging/                # Winston-based logging
├── utils/                  # Misc utilities
├── config/                 # Puppeteer config
└── build/                  # Postman generation
```

### 1.2 External Dependencies (75+)

**Browser/Automation:**
- `puppeteer`, `puppeteer-extra`, `puppeteer-extra-plugin-stealth`, `chrome-launcher`

**Server/API:**
- `express`, `socket.io`, `cors`, `helmet`, `swagger-ui-express`

**Integrations (to be extracted):**
- `cloudflared` - Cloudflare tunnel
- `pico-s3` - S3/cloud storage
- `@discordjs/collection` - Discord-style collections
- `winston`, `winston-daily-rotate-file`, `winston-syslog` - Logging

**Utilities:**
- `axios`, `eventemitter2`, `p-queue`, `rxjs`, `uuid`, `zod`

### 1.3 Existing Integrations (in cli/integrations/)

| Integration | File | Lines | Coupling | Extraction Complexity |
|-------------|------|-------|----------|----------------------|
| Chatwoot | `chatwoot.ts` | 650+ | High (uses Client, ev, express) | Medium |
| Cloudflare Tunnel | `cloudflare.ts` | 69 | Low (standalone) | Easy |
| S3/Cloud Upload | `preProcessors.ts` | 170+ | Medium (uses pico-s3) | Easy |
| Webhook System | `Client.ts:4700+` | 200+ | High (embedded in Client) | Medium |
| ElasticSearch | `server.ts` | Env-based | Low | Easy |

### 1.4 Event System (Current)

```typescript
// packages/core/src/controllers/events.ts
export const ev = new EventEmitter2({ wildcard: true });

// Event format: {namespace}.{sessionId}
// Examples: 'qr.session1', 'message.session1', '**.**'

export class Spin extends EvEmitter {
  // Spinner + event emission combo
  emit(data, eventNamespaceOverride?) { ev.emit(...) }
}
```

**Existing lifecycle events (implicit, not formalized):**
- `qr.**` - QR code events
- `sessionData.**` - Session data events
- `sessionDataBase64.**` - Base64 session data
- Internal spinner events via `Spin.emit()`

---

## 2. Target Architecture

### 2.1 Monorepo Structure

```
wa/
├── packages/
│   ├── legacy/                 # Renamed from current core (frozen)
│   │
│   ├── core/                   # NEW: Orchestration backbone only
│   │   ├── src/
│   │   │   ├── createClient.ts      # Main entry point
│   │   │   ├── lifecycle.ts         # State machine
│   │   │   ├── pluginHost.ts        # Plugin registration + execution
│   │   │   └── context.ts           # Plugin context definition
│   │   └── package.json
│   │
│   ├── client/                 # NEW: User-facing API facade
│   │   ├── src/
│   │   │   ├── Client.ts            # Clean API (generated + manual)
│   │   │   └── methods/             # Grouped by domain
│   │   └── package.json
│   │
│   ├── domain/                 # NEW: Data structures (no driver deps)
│   │   ├── src/
│   │   │   ├── structures/          # Collector, MessageCollector
│   │   │   ├── media/               # Media handling utilities
│   │   │   └── types/               # Re-exported from schema
│   │   └── package.json
│   │
│   ├── session/                # NEW: Session/auth persistence
│   │   ├── src/
│   │   │   ├── sessionManager.ts    # State machine for session
│   │   │   ├── stores/              # File, memory, custom stores
│   │   │   └── qrManager.ts         # QR code handling
│   │   └── package.json
│   │
│   ├── events/                 # NEW: Typed event bus
│   │   ├── src/
│   │   │   ├── eventBus.ts          # TypedEventEmitter
│   │   │   ├── eventMap.ts          # All event definitions
│   │   │   └── types.ts             # Event payload types
│   │   └── package.json
│   │
│   ├── logging/                # NEW: Logger abstraction
│   │   ├── src/
│   │   │   ├── logger.ts            # Logger interface
│   │   │   ├── winston.ts           # Winston implementation
│   │   │   └── console.ts           # Simple console logger
│   │   └── package.json
│   │
│   ├── transport-web/          # NEW: WhatsApp Web protocol boundary
│   │   ├── src/
│   │   │   ├── transport.ts         # Protocol abstraction
│   │   │   ├── wapi/                # WAPI injection/bridge
│   │   │   └── patches/             # Patch management
│   │   └── package.json
│   │
│   ├── driver-interface/       # EXISTING: Browser abstraction
│   ├── driver-puppeteer/       # NEW: Puppeteer implementation
│   ├── driver-playwright/      # NEW: Playwright implementation
│   │
│   ├── cli/                    # NEW: CLI application
│   │   ├── src/
│   │   │   ├── commands/            # Command handlers
│   │   │   ├── server.ts            # Express server
│   │   │   └── index.ts             # Entry point
│   │   └── package.json
│   │
│   ├── codegen/                # NEW: Generate client from schemas
│   │   ├── src/
│   │   │   ├── generate-client.ts
│   │   │   └── generate-models.ts
│   │   └── package.json
│   │
│   ├── schema/                 # EXISTING: Zod schemas
│   └── config/                 # EXISTING: Config management
│
├── integrations/               # NEW: 3rd party integrations
│   ├── chatwoot/
│   │   ├── src/
│   │   │   ├── plugin.ts            # OpenWAPlugin implementation
│   │   │   ├── middleware.ts        # Express middleware
│   │   │   └── client.ts            # Chatwoot API client
│   │   └── package.json
│   │
│   ├── cloudflare/
│   │   ├── src/
│   │   │   ├── plugin.ts
│   │   │   └── tunnel.ts
│   │   └── package.json
│   │
│   ├── s3/
│   │   ├── src/
│   │   │   ├── plugin.ts
│   │   │   └── preprocessors.ts
│   │   └── package.json
│   │
│   ├── elasticsearch/
│   ├── discord/
│   └── webhook/
│
└── apps/
    ├── examples/
    └── playground/
```

### 2.2 Dependency Graph

```
                    ┌─────────────┐
                    │   schema    │ (no deps)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   config    │
                    └──────┬──────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───▼───┐            ┌─────▼─────┐          ┌─────▼─────┐
│events │            │  logging  │          │driver-intf│
└───┬───┘            └─────┬─────┘          └─────┬─────┘
    │                      │                      │
    │    ┌─────────────────┼──────────────────────┤
    │    │                 │                      │
    │ ┌──▼──┐        ┌─────▼─────┐    ┌──────────▼──────────┐
    │ │sess-│        │transport- │    │  driver-puppeteer   │
    │ │ion  │        │   web     │    │  driver-playwright  │
    │ └──┬──┘        └─────┬─────┘    └──────────┬──────────┘
    │    │                 │                     │
    │    └────────────┬────┴─────────────────────┘
    │                 │
    │          ┌──────▼──────┐
    └──────────►    core     │  (orchestration backbone)
               └──────┬──────┘
                      │
               ┌──────▼──────┐
               │   client    │  (user-facing API)
               └──────┬──────┘
                      │
               ┌──────▼──────┐
               │     cli     │
               └──────┬──────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐  ┌─────▼─────┐ ┌─────▼─────┐
   │chatwoot │  │cloudflare │ │    s3     │
   └─────────┘  └───────────┘ └───────────┘
        (integrations - use plugin API only)
```

### 2.3 Key Constraints

1. **Integrations NEVER import from core/client directly** - only via plugin API
2. **Driver-specific code ONLY in driver-* packages** - transport-web uses driver-interface
3. **No circular dependencies** - strict layering enforced by package boundaries
4. **Events are typed** - central EventMap in packages/events

---

## 3. Package Mapping (Current → New)

### 3.1 File-to-Package Mapping

| Current Location | New Package | Notes |
|-----------------|-------------|-------|
| **api/Client.ts** | `client/` + `codegen/` | Split into generated methods + manual overrides |
| **api/model/*.ts** | `schema/` | Already migrating to Zod |
| **api/model/config.ts** | `config/` | Already done |
| **api/functions/exposed.enum.ts** | `schema/` | Part of schema |
| **controllers/browser.ts** | `driver-puppeteer/` | Puppeteer-specific |
| **controllers/browser.ignore.ts** | `driver-puppeteer/` | Puppeteer-specific |
| **controllers/initializer.ts** | `core/` | Becomes lifecycle.ts |
| **controllers/auth.ts** | `session/` | QR + auth logic |
| **controllers/events.ts** | `events/` | Typed event bus |
| **controllers/popup/** | `cli/` or `session/` | QR popup server |
| **controllers/patch_manager.ts** | `transport-web/` | WAPI patches |
| **controllers/script_preloader.ts** | `transport-web/` | Script loading |
| **controllers/init_patch.ts** | `transport-web/` | Initialization |
| **controllers/launch_checks.ts** | `core/` | Launch validation |
| **events/EventManager.ts** | `events/` | Already event-focused |
| **events/WapiBridge.ts** | `transport-web/` | WAPI communication |
| **structures/Collector.ts** | `domain/` | Pure data structure |
| **structures/MessageCollector.ts** | `domain/` | Pure data structure |
| **structures/preProcessors.ts** | `integrations/s3/` | S3 integration |
| **logging/logging.ts** | `logging/` | Logger implementation |
| **logging/custom_transport.ts** | `logging/` | Winston transport |
| **utils/tools.ts** | `utils/` or inline | Evaluate per-function |
| **utils/pid_utils.ts** | `core/` | Process utilities |
| **config/puppeteer.config.ts** | `driver-puppeteer/` | Puppeteer-specific |
| **build/build-postman.ts** | `codegen/` or `tools/` | Doc generation |
| **cli/index.ts** | `cli/` | CLI entry |
| **cli/server.ts** | `cli/` | Express server |
| **cli/setup.ts** | `cli/` | Uses @open-wa/config |
| **cli/integrations/chatwoot.ts** | `integrations/chatwoot/` | Extract |
| **cli/integrations/cloudflare.ts** | `integrations/cloudflare/` | Extract |

### 3.2 New Package Creation Order

Based on dependency graph (extract from bottom up):

1. **Phase 0** (Already done): `schema`, `config`, `driver-interface`
2. **Phase 1**: `events`, `logging`
3. **Phase 2**: `session`, `transport-web`
4. **Phase 3**: `driver-puppeteer`, `driver-playwright`
5. **Phase 4**: `core` (new backbone)
6. **Phase 5**: `domain`, `client`
7. **Phase 6**: `cli`
8. **Phase 7**: `integrations/*`
9. **Phase 8**: `codegen`

---

## 4. Integration Framework Design

### 4.1 Plugin Interface

```typescript
// packages/core/src/plugin.ts

export interface OpenWAPlugin {
  /** Unique plugin name */
  name: string;
  
  /** Semantic version */
  version?: string;
  
  /** Dependency requirements */
  requires?: {
    core?: string;
    client?: string;
  };
  
  /**
   * Called when plugin is registered.
   * Return a cleanup function for disposal.
   */
  apply(ctx: PluginContext): void | (() => void | Promise<void>);
}

export interface PluginContext {
  /** Typed event bus */
  events: EventBus<OpenWAEventMap>;
  
  /** Logger instance */
  logger: Logger;
  
  /** Resolved configuration */
  config: ResolvedConfig;
  
  /** Session manager */
  session: SessionManager;
  
  /** Client instance (available after client.ready) */
  client?: ClientFacade;
  
  /** Transport instance (available after driver.launched) */
  transport?: WebTransport;
}
```

### 4.2 Plugin Registration

```typescript
// Library usage
import { createClient } from '@open-wa/core';
import { chatwootPlugin } from '@open-wa/integration-chatwoot';

const client = await createClient({
  sessionId: 'main',
  plugins: [
    chatwootPlugin({
      url: 'https://chatwoot.example.com',
      apiKey: '...',
    }),
  ],
});

// CLI usage (via config file)
// wa.config.ts
export default defineConfig({
  sessionId: 'main',
  plugins: [
    '@open-wa/integration-chatwoot',
    '@open-wa/integration-cloudflare',
  ],
  chatwoot: {
    url: '...',
  },
});
```

### 4.3 Plugin Host Implementation

```typescript
// packages/core/src/pluginHost.ts

export class PluginHost {
  private plugins: Map<string, RegisteredPlugin> = new Map();
  private disposers: Map<string, () => Promise<void>> = new Map();
  
  async register(plugin: OpenWAPlugin, ctx: PluginContext): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }
    
    const disposer = await plugin.apply(ctx);
    
    this.plugins.set(plugin.name, { plugin, ctx });
    if (disposer) {
      this.disposers.set(plugin.name, disposer);
    }
    
    ctx.logger.info(`Plugin ${plugin.name} registered`);
  }
  
  async dispose(): Promise<void> {
    for (const [name, disposer] of this.disposers) {
      await disposer();
    }
    this.plugins.clear();
    this.disposers.clear();
  }
}
```

---

## 5. Event System Design

### 5.1 Event Map (Typed)

```typescript
// packages/events/src/eventMap.ts

export interface OpenWAEventMap {
  // === Lifecycle Events ===
  'core.starting': { config: ResolvedConfig };
  'core.started': {};
  'core.stopping': { reason?: string };
  'core.stopped': {};
  
  // === Driver Events ===
  'driver.launching': { driver: 'puppeteer' | 'playwright' };
  'driver.launched': {};
  'driver.disconnected': { reason?: string };
  'driver.reconnecting': { attempt: number };
  
  // === Session Events ===
  'session.creating': { sessionId: string };
  'session.created': { sessionId: string };
  'session.restored': { sessionId: string };
  'session.destroyed': { sessionId: string };
  
  // === Auth Events ===
  'auth.qr': { sessionId: string; qr: string; attempt: number };
  'auth.qr.expired': { sessionId: string };
  'auth.authenticated': { sessionId: string };
  'auth.failed': { sessionId: string; error: Error };
  'auth.logout': { sessionId: string };
  
  // === Client Events ===
  'client.ready': { sessionId: string };
  'client.state': { state: ClientState };
  
  // === Message Events ===
  'message.received': { message: Message };
  'message.sent': { message: Message };
  'message.ack': { messageId: string; ack: MessageAck };
  'message.revoked': { messageId: string };
  'message.reaction': { reaction: ReactionEvent };
  
  // === Chat Events ===
  'chat.new': { chat: Chat };
  'chat.archived': { chatId: ChatId };
  'chat.unread': { chatId: ChatId; count: number };
  
  // === Group Events ===
  'group.join': { groupId: GroupChatId };
  'group.leave': { groupId: GroupChatId };
  'group.participant.add': ParticipantChangedEventModel;
  'group.participant.remove': ParticipantChangedEventModel;
  'group.participant.promote': ParticipantChangedEventModel;
  'group.participant.demote': ParticipantChangedEventModel;
  
  // === Error Events ===
  'error': { scope: string; error: Error; fatal?: boolean };
  
  // === Internal Events (not for plugins) ===
  'internal.launch_progress': { value: number; text: string };
}
```

### 5.2 Typed Event Bus

```typescript
// packages/events/src/eventBus.ts

import { EventEmitter2 } from 'eventemitter2';

export class TypedEventBus<TEventMap extends Record<string, unknown>> {
  private emitter = new EventEmitter2({ wildcard: true });
  
  on<K extends keyof TEventMap>(
    event: K,
    handler: (payload: TEventMap[K]) => void | Promise<void>
  ): () => void {
    this.emitter.on(event as string, handler);
    return () => this.emitter.off(event as string, handler);
  }
  
  emit<K extends keyof TEventMap>(event: K, payload: TEventMap[K]): void {
    this.emitter.emit(event as string, payload);
  }
  
  once<K extends keyof TEventMap>(
    event: K,
    handler: (payload: TEventMap[K]) => void | Promise<void>
  ): void {
    this.emitter.once(event as string, handler);
  }
  
  waitFor<K extends keyof TEventMap>(
    event: K,
    timeout?: number
  ): Promise<TEventMap[K]> {
    return new Promise((resolve, reject) => {
      const timer = timeout ? setTimeout(() => {
        reject(new Error(`Timeout waiting for ${String(event)}`));
      }, timeout) : null;
      
      this.once(event, (payload) => {
        if (timer) clearTimeout(timer);
        resolve(payload);
      });
    });
  }
}
```

---

## 6. Migration Strategy

### 6.1 Dual-Track Approach

1. **Keep legacy working**: Rename `packages/core` → `packages/legacy`, continue publishing as-is
2. **Build new packages incrementally**: Each new package is tested independently
3. **Compatibility facade**: Optional wrapper that routes calls to new packages where implemented
4. **Gradual deprecation**: Runtime warnings on legacy-only paths

### 6.2 Backward Compatibility

```typescript
// packages/legacy/src/index.ts (add deprecation notice)

console.warn(
  '[@open-wa/wa-automate] This package is deprecated. ' +
  'Please migrate to @open-wa/client. ' +
  'See: https://docs.openwa.dev/migration'
);

// Re-export everything as before
export * from './api/Client';
export * from './api/model';
// ...
```

### 6.3 Import Path Migration

| Old Import | New Import |
|------------|------------|
| `@open-wa/wa-automate` | `@open-wa/client` |
| `{ Client }` | `{ Client }` (same API) |
| `{ create }` | `{ createClient }` |
| `{ ev }` | `import { eventBus } from '@open-wa/events'` |
| `{ ConfigObject }` | `import { Config } from '@open-wa/config'` |

---

## 7. Phased Implementation Plan

### Phase 0: Foundation (DONE)
- [x] `packages/schema` - Zod schemas
- [x] `packages/config` - Config management
- [x] `packages/driver-interface` - Browser abstraction

### Phase 1: Event System (1-2 days)
- [ ] Create `packages/events`
- [ ] Implement `TypedEventBus<OpenWAEventMap>`
- [ ] Define all event types in `eventMap.ts`
- [ ] Write comprehensive tests

### Phase 2: Logging (0.5 day)
- [ ] Create `packages/logging`
- [ ] Extract winston implementation from core
- [ ] Add logger interface for custom implementations

### Phase 3: Session Management (1-2 days)
- [ ] Create `packages/session`
- [ ] Extract auth.ts logic
- [ ] Implement session state machine
- [ ] Add pluggable storage (file, memory, custom)

### Phase 4: Rename Core to Legacy (0.5 day)
- [ ] Rename `packages/core` → `packages/legacy`
- [ ] Update all internal imports
- [ ] Add deprecation warnings
- [ ] Verify existing tests pass

### Phase 5: New Core Backbone (2-3 days)
- [ ] Create new `packages/core`
- [ ] Implement `createClient()` lifecycle
- [ ] Implement `PluginHost`
- [ ] Wire up events, config, driver-interface
- [ ] Write integration tests

### Phase 6: Transport Layer (2-3 days)
- [ ] Create `packages/transport-web`
- [ ] Extract WAPI injection/bridge
- [ ] Extract patch management
- [ ] Integrate with driver-interface

### Phase 7: Driver Implementations (1-2 days)
- [ ] Create `packages/driver-puppeteer`
- [ ] Move puppeteer-specific code from legacy
- [ ] Create `packages/driver-playwright` (stub)

### Phase 8: Client Package (2-3 days)
- [ ] Create `packages/client`
- [ ] Extract Client.ts methods into organized modules
- [ ] Setup codegen for method stubs
- [ ] Ensure API parity with legacy

### Phase 9: CLI Package (1-2 days)
- [ ] Create `packages/cli`
- [ ] Extract CLI logic from legacy
- [ ] Update to use new packages
- [ ] Add plugin loading from config

### Phase 10: Integrations (1-2 days per integration)
- [ ] Create `integrations/chatwoot`
- [ ] Create `integrations/cloudflare`
- [ ] Create `integrations/s3`
- [ ] Create `integrations/webhook`

---

## 8. Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing users | Critical | Dual-track + facade pattern |
| Circular dependencies | High | Strict package boundaries + CI checks |
| Event type inconsistencies | Medium | Central EventMap + TypeScript |
| Driver abstraction leakage | Medium | Review all driver-interface usage |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Test coverage gaps | Medium | Require tests for each new package |
| Documentation lag | Medium | Update docs with each phase |
| Performance regression | Medium | Benchmark critical paths |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Package naming conflicts | Low | Reserve npm names early |
| Monorepo tooling issues | Low | Already using pnpm workspaces |

---

## Appendix A: External References

- Oracle consultation: Architectural recommendations for package split
- VSCode Extension API: Plugin registration patterns
- Fastify: Encapsulated plugin system with decorators
- NestJS: Module-based DI with lifecycle hooks

## Appendix B: Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Event-based plugins over DI | Simpler, less magic, TypeScript-friendly | 2026-01-25 |
| Rename core to legacy | Preserves reference, new core is truly minimal | 2026-01-25 |
| integrations/ at root | Clear separation, not internal packages | 2026-01-25 |
| TypedEventBus over raw EventEmitter | Compile-time safety for events | 2026-01-25 |
| Hybrid Fastify + EventEmitter pattern | Best of both: simple registration + fine-grained hooks | 2026-01-25 |

## Appendix C: Plugin Architecture Comparison (Librarian Research)

| Feature           | VSCode     | Webpack          | Fastify       | NestJS       |
| ----------------- | ---------- | ---------------- | ------------- | ------------ |
| **Core Pattern**      | DI + IPC   | Event Hooks      | Encapsulation | DI Container |
| **Registration**      | Manifest   | `.apply(compiler)` | `.register(fn)` | `@Module()`    |
| **TypeScript**        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐         | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐   |
| **Monorepo Friendly** | ⭐⭐⭐     | ⭐⭐⭐           | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐     |
| **Learning Curve**    | Medium     | Medium-High      | Low-Medium    | High         |
| **Isolation**         | Process    | Logical          | Context       | Container    |
| **Best For**          | Extensions | Build tools      | APIs          | Full apps    |

**Recommendation**: Hybrid Fastify-inspired + EventEmitter approach

```typescript
// Recommended plugin interface (from Librarian research)
interface OpenWAPlugin {
  name: string;
  version?: string;
  
  // Lifecycle hooks
  init?(client: Client): void | Promise<void>;
  destroy?(): void | Promise<void>;
  
  // Event hooks (visitor pattern)
  'message:received'?(message: Message, context: Context): void | Promise<void>;
  'connection:ready'?(session: SessionInfo, context: Context): void | Promise<void>;
  
  // Performance optimization filter
  filter?: {
    events?: string[];
    messageTypes?: string[];
  };
}

// Factory pattern for configuration
function chatwootPlugin(options: ChatwootOptions): OpenWAPlugin {
  return {
    name: 'chatwoot-integration',
    async 'message:received'(message, { client }) {
      await syncToChatwoot(message, options.apiKey);
    },
  };
}
```

## Appendix D: Pre-Refactoring Checklist (Metis Research)

### Critical Steps Before Any Moves

1. **Dependency Analysis**
   ```bash
   pnpm add -D madge dependency-cruiser
   madge --circular --extensions ts packages/core/src
   ```

2. **Break Circular Dependencies**
   - Use `lsp_find_references` to map all cross-package imports
   - Extract shared types to dependency-free package

3. **TypeScript Project References**
   ```json
   // packages/core/tsconfig.json
   {
     "compilerOptions": {
       "composite": true,
       "declaration": true,
       "declarationMap": true
     },
     "references": [
       { "path": "../schema" },
       { "path": "../config" },
       { "path": "../driver-interface" }
     ]
   }
   ```

4. **Contract Tests**
   ```typescript
   // Snapshot public API surface
   test('public API surface remains stable', () => {
     const exportedNames = Object.keys(publicAPI).sort();
     expect(exportedNames).toMatchSnapshot();
   });
   ```

5. **Enable pnpm Strict Mode**
   ```ini
   # .npmrc
   node-linker=isolated
   ```

## Appendix E: Existing Patterns to Preserve

| Pattern | Location | Preserve? |
|---------|----------|-----------|
| Node-Red socket integration | `integrations/node-red/` | ✅ Good pattern |
| EventEmitter2 wildcards | `controllers/events.ts` | ✅ Keep for flexibility |
| Schema auto-generation | `packages/schema/` | ✅ Expand to client |
| Driver abstraction | `packages/driver-interface/` | ✅ Foundation in place |
| Discord-style Collector | `structures/Collector.ts` | ✅ Move to domain/ |
