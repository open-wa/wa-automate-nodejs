# Issue #11: Core Package Monorepo Refactor Plan

> **Status**: Planning  
> **Priority**: High  
> **Effort**: Large (3-5 days for scaffolding + migration foundation)  
> **Related**: #07 (Driver Abstraction), #10 (Config Package)
> **Updated**: 2026-01-25 - Simplified architecture using existing packages

## Executive Summary

Split the monolithic `packages/core` (~77 files, ~17k lines, ~75 dependencies) into focused, single-responsibility packages. Rename current core to `packages/legacy` for reference, create a new minimal `packages/core` as the orchestration backbone, and establish an `integrations/` folder for 3rd party integrations using an opencode-style plugin system.

**Key Simplifications (v2)**:
- **USE EXISTING `packages/hyperemitter`** - No need for new events package (already has typed EventMap, MQTT wildcards, WeakRef, Node EventEmitter bridges)
- **USE EXISTING `packages/logger`** - No need for new logging package (already has Winston core, transports, security sanitizers, middleware)
- **KEEP IN CORE**: `transport-web` and `session` are core components, not separate packages
- **CORE'S ROLE**: Launches browser (via driver-interface), handles auth/session (QR code), exposes generated client, sets up event backbone (hyperemitter), manages plugin lifecycle

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
│   ├── core/                   # NEW: Orchestration backbone
│   │   ├── src/
│   │   │   ├── createClient.ts      # Main entry point
│   │   │   ├── lifecycle.ts         # State machine
│   │   │   ├── pluginHost.ts        # Plugin registration + execution
│   │   │   ├── context.ts           # Plugin context definition
│   │   │   ├── session/             # Session/auth (IN CORE)
│   │   │   │   ├── sessionManager.ts
│   │   │   │   ├── stores/          # File, memory, custom stores
│   │   │   │   └── qrManager.ts     # QR code handling
│   │   │   └── transport/           # WhatsApp Web protocol (IN CORE)
│   │   │       ├── transport.ts     # Protocol abstraction
│   │   │       ├── wapi/            # WAPI injection/bridge
│   │   │       └── patches/         # Patch management
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
│   ├── hyperemitter/           # EXISTING: Typed event bus (USE THIS)
│   │   ├── src/
│   │   │   ├── core/HyperEmitter.ts # TypedEventEmitter with wildcards
│   │   │   └── routing/RadixTree.ts # MQTT-style pattern matching
│   │   └── package.json
│   │
│   ├── logger/                 # EXISTING: Logger abstraction (USE THIS)
│   │   ├── src/
│   │   │   ├── core/logger.ts       # createLogger, Logger interface
│   │   │   ├── transports/          # elasticsearch, cloudflare, file, console
│   │   │   ├── security/            # sanitizer, censors
│   │   │   └── middleware/          # hono, socket
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

### 2.2 Dependency Graph (Simplified)

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
┌───▼────────┐       ┌─────▼─────┐          ┌─────▼─────┐
│hyperemitter│       │  logger   │          │driver-intf│
│ (EXISTING) │       │(EXISTING) │          │           │
└───┬────────┘       └─────┬─────┘          └─────┬─────┘
    │                      │                      │
    │    ┌─────────────────┼──────────────────────┤
    │    │                 │                      │
    │    │                 │         ┌────────────▼────────────┐
    │    │                 │         │  driver-puppeteer       │
    │    │                 │         │  driver-playwright      │
    │    │                 │         └────────────┬────────────┘
    │    │                 │                      │
    │    └─────────────────┼──────────────────────┘
    │                      │
    │               ┌──────▼──────┐
    └───────────────►    core     │  (orchestration backbone)
                    │ - session   │  (session/auth IN CORE)
                    │ - transport │  (WAPI/patches IN CORE)
                    │ - plugins   │
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
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │chatwoot │      │cloudflare │     │    s3     │
    └─────────┘      └───────────┘     └───────────┘
         (integrations - use plugin API only)
```

### 2.3 Key Constraints

1. **Integrations NEVER import from core/client directly** - only via plugin API
2. **Driver-specific code ONLY in driver-* packages** - core uses driver-interface
3. **No circular dependencies** - strict layering enforced by package boundaries
4. **Events are typed** - central EventMap used with HyperEmitter
5. **Core is the orchestrator** - launches browser, handles auth, exposes client, manages plugins
6. **Use existing packages** - hyperemitter for events, logger for logging (don't recreate)

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
| **controllers/auth.ts** | `core/session/` | QR + auth logic (IN CORE) |
| **controllers/events.ts** | Use `hyperemitter` | EXISTING - don't recreate |
| **controllers/popup/** | `cli/` or `core/session/` | QR popup server |
| **controllers/patch_manager.ts** | `core/transport/` | WAPI patches (IN CORE) |
| **controllers/script_preloader.ts** | `core/transport/` | Script loading (IN CORE) |
| **controllers/init_patch.ts** | `core/transport/` | Initialization (IN CORE) |
| **controllers/launch_checks.ts** | `core/` | Launch validation |
| **events/EventManager.ts** | `core/` | Queue-aware event handling (uses hyperemitter) |
| **events/WapiBridge.ts** | `core/transport/` | WAPI communication (IN CORE) |
| **structures/Collector.ts** | `domain/` | Pure data structure |
| **structures/MessageCollector.ts** | `domain/` | Pure data structure |
| **structures/preProcessors.ts** | `integrations/s3/` | S3 integration |
| **logging/logging.ts** | Use `logger` | EXISTING - don't recreate |
| **logging/custom_transport.ts** | Use `logger` | EXISTING - don't recreate |
| **utils/tools.ts** | `utils/` or inline | Evaluate per-function |
| **utils/pid_utils.ts** | `core/` | Process utilities |
| **config/puppeteer.config.ts** | `driver-puppeteer/` | Puppeteer-specific |
| **build/build-postman.ts** | `codegen/` or `tools/` | Doc generation |
| **cli/index.ts** | `cli/` | CLI entry |
| **cli/server.ts** | `cli/` | Express server |
| **cli/setup.ts** | `cli/` | Uses @open-wa/config |
| **cli/integrations/chatwoot.ts** | `integrations/chatwoot/` | Extract |
| **cli/integrations/cloudflare.ts** | `integrations/cloudflare/` | Extract |

### 3.2 New Package Creation Order (Simplified)

Based on dependency graph (fewer packages to create):

1. **Phase 0** (Already done): `schema`, `config`, `driver-interface`, `hyperemitter`, `logger`
2. **Phase 1**: `driver-puppeteer`, `driver-playwright`
3. **Phase 2**: `core` (new backbone - includes session, transport, plugin host)
4. **Phase 3**: `domain`, `client`
5. **Phase 4**: `cli`
6. **Phase 5**: `integrations/*`
7. **Phase 6**: `codegen`

**Removed from plan** (use existing or keep in core):
- ~~packages/events~~ → Use `packages/hyperemitter`
- ~~packages/logging~~ → Use `packages/logger`
- ~~packages/transport-web~~ → Keep in `core/transport/`
- ~~packages/session~~ → Keep in `core/session/`

---

## 4. Integration Framework Design

### 4.1 Plugin Interface (opencode-inspired)

Based on [@opencode-ai/plugin](https://github.com/anomalyco/opencode/tree/master/packages/plugin) pattern.

```typescript
// packages/core/src/plugin.ts

import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { ResolvedConfig } from '@open-wa/config';
import type { OpenWAEventMap } from './events/eventMap';

/**
 * Plugin input context - provided to plugin factory function
 */
export interface PluginInput {
  /** Typed event bus (HyperEmitter with OpenWAEventMap) */
  events: HyperEmitter<OpenWAEventMap>;
  
  /** Logger instance */
  logger: Logger;
  
  /** Resolved configuration */
  config: ResolvedConfig;
  
  /** Session ID */
  sessionId: string;
  
  /** Client instance (available after client.ready) */
  client?: ClientFacade;
}

/**
 * Plugin factory function - returns hooks
 * Pattern: (input: PluginInput) => Promise<Hooks>
 */
export type Plugin = (input: PluginInput) => Promise<Hooks>;

/**
 * Plugin hooks - lifecycle and event handlers
 */
export interface Hooks {
  /** Handle any event (catch-all) */
  event?: (input: { event: keyof OpenWAEventMap; payload: unknown }) => Promise<void>;
  
  /** Custom tools (for CLI/API) */
  tool?: {
    [key: string]: ToolDefinition;
  };
  
  /** Cleanup function called on dispose */
  dispose?: () => Promise<void>;
  
  // === Lifecycle Hooks ===
  'core.starting'?: (payload: { config: ResolvedConfig }) => Promise<void>;
  'core.started'?: () => Promise<void>;
  'core.stopping'?: (payload: { reason?: string }) => Promise<void>;
  
  // === Auth Hooks ===
  'auth.qr'?: (payload: { sessionId: string; qr: string; attempt: number }) => Promise<void>;
  'auth.authenticated'?: (payload: { sessionId: string }) => Promise<void>;
  
  // === Client Hooks ===
  'client.ready'?: (payload: { sessionId: string }) => Promise<void>;
  
  // === Message Hooks ===
  'message.received'?: (payload: { message: Message }) => Promise<void>;
  'message.sent'?: (payload: { message: Message }) => Promise<void>;
  'message.ack'?: (payload: { messageId: string; ack: MessageAck }) => Promise<void>;
  
  // === Interception Hooks (before/after pattern) ===
  'message.send.before'?: (
    input: { to: string; content: unknown },
    output: { content: unknown; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  
  'message.send.after'?: (
    input: { messageId: string; to: string },
    output: { metadata?: Record<string, unknown> }
  ) => Promise<void>;
}

/**
 * Tool definition (for plugin-provided tools)
 */
export interface ToolDefinition {
  description: string;
  args: Record<string, z.ZodType>;
  execute: (args: Record<string, unknown>, context: ToolContext) => Promise<string>;
}

export interface ToolContext {
  sessionId: string;
  logger: Logger;
  abort: AbortSignal;
}
```

### 4.2 Plugin Registration

```typescript
// Library usage - factory function pattern
import { createClient } from '@open-wa/core';
import { chatwootPlugin } from '@open-wa/integration-chatwoot';

const client = await createClient({
  sessionId: 'main',
  plugins: [
    // Plugin factory - receives PluginInput, returns Hooks
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

import type { Plugin, Hooks, PluginInput } from './plugin';
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';

export class PluginHost {
  private plugins: Map<string, { hooks: Hooks; name: string }> = new Map();
  private logger: Logger;
  
  constructor(private events: HyperEmitter<OpenWAEventMap>, logger: Logger) {
    this.logger = logger.withContext({ component: 'plugin-host' });
  }
  
  async register(name: string, plugin: Plugin, input: PluginInput): Promise<void> {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} already registered`);
    }
    
    const hooks = await plugin(input);
    this.plugins.set(name, { hooks, name });
    
    // Wire up event hooks to HyperEmitter
    this.wireHooks(name, hooks);
    
    this.logger.info('plugin_registered', { plugin: name });
  }
  
  private wireHooks(name: string, hooks: Hooks): void {
    // Wire lifecycle hooks to events
    const hookEvents = [
      'core.starting', 'core.started', 'core.stopping',
      'auth.qr', 'auth.authenticated',
      'client.ready',
      'message.received', 'message.sent', 'message.ack'
    ] as const;
    
    for (const event of hookEvents) {
      const handler = hooks[event];
      if (handler) {
        this.events.on(event as any, async (payload: any) => {
          try {
            await handler(payload);
          } catch (err) {
            this.logger.error('plugin_hook_error', { plugin: name, event, error: err });
          }
        });
      }
    }
    
    // Wire catch-all event handler
    if (hooks.event) {
      // Use wildcard pattern for catch-all
      this.events.on('#' as any, async (payload: any) => {
        // Note: HyperEmitter doesn't provide event name in callback
        // This would need adjustment in actual implementation
      });
    }
  }
  
  async dispose(): Promise<void> {
    for (const [name, { hooks }] of this.plugins) {
      if (hooks.dispose) {
        try {
          await hooks.dispose();
        } catch (err) {
          this.logger.error('plugin_dispose_error', { plugin: name, error: err });
        }
      }
    }
    this.plugins.clear();
  }
  
  getTools(): Record<string, { plugin: string; tool: ToolDefinition }> {
    const tools: Record<string, { plugin: string; tool: ToolDefinition }> = {};
    for (const [name, { hooks }] of this.plugins) {
      if (hooks.tool) {
        for (const [toolName, toolDef] of Object.entries(hooks.tool)) {
          tools[`${name}.${toolName}`] = { plugin: name, tool: toolDef };
        }
      }
    }
    return tools;
  }
}
```

---

## 5. Event System Design

### 5.1 Using Existing HyperEmitter

**We use the existing `packages/hyperemitter` package** - no need to create a new events package.

Key features already available:
- **Typed EventMap** - `HyperEmitter<TMap extends EventMap>`
- **MQTT-style wildcards** - `+` (single level) and `#` (multi-level)
- **WeakRef support** - automatic cleanup of garbage-collected listeners
- **Node EventEmitter bridges** - `fromNodeEmitter()`, `toNodeEmitter()`
- **EventTarget support** - `onEventTarget()`
- **AbortSignal support** - listeners can be cancelled via signal
- **Radix tree routing** - high-performance pattern matching

### 5.2 Event Map (Comprehensive v2)

> **Updated 2026-01-25**: Comprehensive event map based on deep analysis of launch procedure, 
> session recovery, preprocessing, webhooks, patches, and CLI/server lifecycle.

#### 5.2.1 Event Metadata System

Each event has metadata annotations to control routing:

```typescript
// packages/core/src/events/meta.ts

/** Metadata for every event key */
export interface OpenWAEventMeta {
  /** NEVER trigger webhooks (internal instrumentation only) */
  internal: boolean;
  /** Contains secrets/PII (QR codes, session blobs, link codes) */
  sensitive: boolean;
}

/** Runtime event name with session suffix: {namespace}.{sessionId} */
export type OpenWAEventName<K extends keyof OpenWAEventMap> = `${K}.${string}`;

/** Common context attached to operational events */
export interface EventContext {
  correlationId: string;  // Trace a single launch/retry/reinject cycle
  attempt?: number;       // Incrementing retry attempt (0 for first)
  ts: number;             // Timestamp (ms)
}

/** Standard "step" payload for launch/patch/persistence steps */
export interface StepEvent<TDetails = Record<string, unknown>> extends EventContext {
  step: string;
  details?: TDetails;
  error?: { name: string; message: string; stack?: string };
  durationMs?: number;
}
```

#### 5.2.2 Complete Event Map

```typescript
// packages/core/src/events/eventMap.ts

export interface OpenWAEventMap {
  // ============================================================================
  // LAUNCH NAMESPACE (ALL INTERNAL - never trigger webhooks)
  // The launch procedure is delicate with circular retries
  // ============================================================================
  
  // --- Launch lifecycle ---
  'launch.create.start': StepEvent<{ configSummary?: Record<string, unknown> }>;
  'launch.create.retry': StepEvent<{ reason: string; nextAttempt: number }>;
  'launch.create.ready': StepEvent<{ state: STATE }>;
  
  // --- Config & logging setup ---
  'launch.config.setup.before': StepEvent;
  'launch.config.setup.after': StepEvent;
  'launch.logging.setup.before': StepEvent;
  'launch.logging.setup.after': StepEvent;
  
  // --- Update check ---
  'launch.update.check.before': StepEvent<{ currentVersion?: string }>;
  'launch.update.check.after': StepEvent<{ updateAvailable?: boolean; latestVersion?: string }>;
  
  // --- Browser initialization ---
  'launch.browser.init.before': StepEvent<{ browserArgs?: string[]; headless?: boolean }>;
  'launch.browser.init.after': StepEvent<{ pid?: number }>;
  
  // --- Page setup ---
  'launch.page.init.before': StepEvent;
  'launch.page.init.after': StepEvent<{ userAgent?: string; viewport?: { w: number; h: number } }>;
  'launch.page.interception.before': StepEvent<{ enabled: boolean }>;
  'launch.page.interception.after': StepEvent;
  
  // --- Navigation ---
  'launch.navigation.gotoWaWeb.before': StepEvent<{ url: string }>;
  'launch.navigation.gotoWaWeb.after': StepEvent<{ finalUrl?: string }>;
  
  // --- Module loading ---
  'launch.modules.wait.before': StepEvent<{ timeoutMs?: number }>;
  'launch.modules.wait.after': StepEvent<{ success: boolean }>;
  
  // --- Early injection check ---
  'launch.injection.earlyCheck.before': StepEvent;
  'launch.injection.earlyCheck.after': StepEvent<{ canInjectPreAuth: boolean }>;
  
  // --- Auth flow ---
  'launch.auth.check.before': StepEvent<{ timeoutMs?: number }>;
  'launch.auth.check.after': StepEvent<{ isAuthenticated: boolean; method?: 'race' | 'direct' }>;
  'launch.auth.nuke.detected': StepEvent<{ reason: string }>;  // Session expired
  'launch.auth.timeout': StepEvent<{ timeoutMs: number; phoneOutOfReach?: boolean }>;
  'launch.auth.phoneOutOfReach': StepEvent<{ reason?: string }>;
  
  // --- QR / Link code (SENSITIVE) ---
  'launch.auth.qr.requested': StepEvent<{ smartQr?: boolean }>;
  'launch.auth.qr.generated': StepEvent<{ qr: string; ascii?: string; attemptInThisCycle?: number }>;  // SENSITIVE
  'launch.auth.qr.scanned': StepEvent;
  'launch.auth.qr.expired': StepEvent;
  'launch.auth.linkCode.requested': StepEvent;
  'launch.auth.linkCode.generated': StepEvent<{ linkCode: string }>;  // SENSITIVE
  
  // --- Pairing/syncing transitions ---
  'launch.auth.pairing': StepEvent;
  'launch.auth.syncing': StepEvent;
  
  // --- License preload (parallel) ---
  'launch.license.preload.before': StepEvent;
  'launch.license.preload.after': StepEvent<{ success: boolean }>;
  
  // --- WAPI injection ---
  'launch.wapi.inject.before': StepEvent<{ injectPreApiScripts: boolean }>;
  'launch.wapi.inject.after': StepEvent<{ success: boolean }>;
  
  // --- Session validity check ---
  'launch.session.validityCheck.before': StepEvent;
  'launch.session.validityCheck.after': StepEvent<{ valid: boolean; hasStore: boolean; hasMsg: boolean }>;
  'launch.session.invalid.retry': StepEvent<{ reason: string }>;  // Triggers recursive create()
  
  // --- License check/injection ---
  'launch.license.check.before': StepEvent;
  'launch.license.check.after': StepEvent<{ status: 'ok' | 'missing' | 'invalid' | 'expired'; detail?: string }>;
  
  // --- Init patch ---
  'launch.patch.init.before': StepEvent;
  'launch.patch.init.after': StepEvent<{ applied: string[] }>;
  
  // --- Client finalization ---
  'launch.client.finalize.before': StepEvent;
  'launch.client.finalize.after': StepEvent<{ state: STATE }>;
  
  // ============================================================================
  // SESSION NAMESPACE (reinjection, recovery, state changes)
  // ============================================================================
  
  'session.state.changed': StepEvent<{ prev: STATE; next: STATE; reason?: string }>;
  'session.connection.disconnected': StepEvent<{ reason?: string; wasLoggedIn?: boolean }>;
  'session.connection.reconnecting': StepEvent<{ reason?: string }>;
  'session.connection.reconnected': StepEvent<{ downtimeMs?: number }>;
  
  // --- Reinjection (when frame navigates and WAPI is missing) ---
  'session.frame.navigated': StepEvent<{ url?: string; isMainFrame: boolean }>;  // INTERNAL
  'session.reinject.detected': StepEvent<{ reason: 'wapi_missing' | 'stale_session' | 'reload' | string }>;
  'session.reinject.before': StepEvent<{ reason: string }>;
  'session.reinject.after': StepEvent<{ success: boolean }>;
  'session.reinject.qr.waiting': StepEvent<{ reason?: string }>;
  
  'session.stale.detected': StepEvent<{ reason?: string }>;
  'session.logout': StepEvent<{ reason?: string }>;
  
  // ============================================================================
  // MESSAGE NAMESPACE (covers SimpleListener.Message, AnyMessage, MessageDeleted)
  // ============================================================================
  
  'message.received': { ctx: EventContext; message: Message };
  'message.any': { ctx: EventContext; message: Message };
  'message.deleted': { ctx: EventContext; messageId: string; chatId: string; by?: string };
  
  // ============================================================================
  // ACK NAMESPACE
  // ============================================================================
  
  'ack.changed': { ctx: EventContext; ack: Ack };
  
  // ============================================================================
  // GROUP NAMESPACE
  // ============================================================================
  
  'group.addedToGroup': { ctx: EventContext; groupId: string; by?: string };
  'group.removedFromGroup': { ctx: EventContext; groupId: string; by?: string };
  'group.participants.changed.global': { ctx: EventContext; change: GroupParticipantChange };
  'group.approval.request': { ctx: EventContext; groupId: string; requesterId: string };
  'group.changed': { ctx: EventContext; groupId: string; changeType: string };
  
  // ============================================================================
  // CHAT NAMESPACE
  // ============================================================================
  
  'chat.deleted': { ctx: EventContext; chatId: string };
  'chat.opened': { ctx: EventContext; chat: Chat };
  'chat.state': { ctx: EventContext; state: ChatState };
  
  // ============================================================================
  // DEVICE NAMESPACE
  // ============================================================================
  
  'device.battery': { ctx: EventContext; battery: BatteryStatus };
  'device.plugged': { ctx: EventContext; plugged: boolean; battery?: number };
  
  // ============================================================================
  // CALL NAMESPACE
  // ============================================================================
  
  'call.incoming': { ctx: EventContext; call: IncomingCall };
  'call.state': { ctx: EventContext; state: CallState };
  
  // ============================================================================
  // AUTH NAMESPACE (runtime, distinct from launch.auth.*)
  // ============================================================================
  
  'auth.logout': { ctx: EventContext; reason?: string };
  
  // ============================================================================
  // UI NAMESPACE (buttons, polls)
  // ============================================================================
  
  'ui.button': { ctx: EventContext; messageId: string; buttonId: string; from: string };
  'ui.poll.vote': { ctx: EventContext; vote: PollVote };
  
  // ============================================================================
  // BROADCAST / LABEL / STORY / COMMERCE / REACTION
  // ============================================================================
  
  'broadcast.received': { ctx: EventContext; message: Message };
  'label.changed': { ctx: EventContext; labelId: string; action: 'added' | 'removed' | 'renamed' };
  'story.received': { ctx: EventContext; storyId: string; from: string; timestamp: number };
  'commerce.order': { ctx: EventContext; orderId: string; from: string };
  'commerce.product.new': { ctx: EventContext; productId: string; catalogId?: string };
  'reaction.added': { ctx: EventContext; reaction: Reaction };
  
  // ============================================================================
  // MEDIA NAMESPACE (preprocessing pipeline + upload)
  // INTERNAL - instrumentation for media processing
  // ============================================================================
  
  'media.preprocess.before': { ctx: EventContext; message: Message; processors: MessagePreProcessor[] };
  'media.preprocess.after': { ctx: EventContext; message: Message; results: MediaProcessResult[] };
  
  // Per-processor events
  'media.processor.SCRUB.before': { ctx: EventContext; message: Message };
  'media.processor.SCRUB.after': { ctx: EventContext; result: MediaProcessResult };
  'media.processor.BODY_ONLY.before': { ctx: EventContext; message: Message };
  'media.processor.BODY_ONLY.after': { ctx: EventContext; result: MediaProcessResult };
  'media.processor.AUTO_DECRYPT.before': { ctx: EventContext; message: Message };
  'media.processor.AUTO_DECRYPT.after': { ctx: EventContext; result: MediaProcessResult };
  'media.processor.AUTO_DECRYPT_SAVE.before': { ctx: EventContext; message: Message; saveDir?: string };
  'media.processor.AUTO_DECRYPT_SAVE.after': { ctx: EventContext; result: MediaProcessResult };
  'media.processor.UPLOAD_CLOUD.before': { ctx: EventContext; message: Message; provider: 's3' | 'gcs' | string };
  'media.processor.UPLOAD_CLOUD.after': { ctx: EventContext; result: MediaProcessResult };
  
  // S3 upload specific
  'media.upload.s3.before': { ctx: EventContext; messageId: string; bucket: string; key: string };
  'media.upload.s3.after': { ctx: EventContext; messageId: string; bucket: string; key: string; url?: string; etag?: string };
  
  // ============================================================================
  // WEBHOOK NAMESPACE (ALL INTERNAL - to prevent infinite loops!)
  // ============================================================================
  
  'webhook.registered': { ctx: EventContext; webhook: WebhookRegistration };
  'webhook.unregistered': { ctx: EventContext; webhookId: string };
  'webhook.trigger.before': { ctx: EventContext; webhookId: string; event: string; payload: unknown };
  'webhook.trigger.after': { ctx: EventContext; webhookId: string; event: string; enqueued: boolean; reasonIfSkipped?: string };
  'webhook.queue.enqueued': { ctx: EventContext; delivery: WebhookDeliveryAttempt };
  'webhook.queue.dequeued': { ctx: EventContext; deliveryId: string; webhookId: string };
  'webhook.deliver.before': { ctx: EventContext; attempt: WebhookDeliveryAttempt };
  'webhook.deliver.after': { ctx: EventContext; result: WebhookDeliveryResult };
  
  // ============================================================================
  // PERSISTENCE NAMESPACE (session save, compress, zip, upload)
  // INTERNAL + SENSITIVE - contains session data
  // ============================================================================
  
  'persistence.session.save.before': StepEvent<{ target: 'disk' | 's3' | 'memory' }>;
  'persistence.session.save.after': StepEvent<{ artifacts: PersistenceArtifact[] }>;
  'persistence.compress.zstd.before': StepEvent<{ inputBytes?: number }>;
  'persistence.compress.zstd.after': StepEvent<{ artifact: PersistenceArtifact }>;
  'persistence.archive.zip.before': StepEvent<{ inputs: Array<{ path: string; sizeBytes?: number }> }>;
  'persistence.archive.zip.after': StepEvent<{ artifact: PersistenceArtifact }>;
  'persistence.upload.s3.before': StepEvent<{ bucket: string; key: string; kind: 'sessionData' | 'zstd' | 'zip' }>;
  'persistence.upload.s3.after': StepEvent<{ bucket: string; key: string; etag?: string; sizeBytes?: number }>;
  
  // ============================================================================
  // PATCH NAMESPACE (before/after patch application)
  // INTERNAL - instrumentation only
  // ============================================================================
  
  'patch.apply.before': StepEvent<{ patchId: string; description?: string }>;
  'patch.apply.after': StepEvent<{ patchId: string; applied: boolean }>;
  'patch.init.before': StepEvent;
  'patch.init.after': StepEvent<{ applied: string[] }>;
  
  // ============================================================================
  // LICENSE NAMESPACE (runtime license checks)
  // INTERNAL - instrumentation only
  // ============================================================================
  
  'license.check.before': StepEvent<{ source: 'local' | 'remote' | 'cached' }>;
  'license.check.after': StepEvent<{ status: 'ok' | 'missing' | 'invalid' | 'expired'; detail?: string }>;
  'license.inject.before': StepEvent;
  'license.inject.after': StepEvent<{ success: boolean }>;
  
  // ============================================================================
  // CLI / SERVER NAMESPACE
  // INTERNAL - lifecycle events
  // ============================================================================
  
  'cli.launched': { ctx: EventContext; argv: string[]; version?: string };
  'server.start.before': StepEvent<{ host?: string; port?: number }>;
  'server.start.after': StepEvent<{ host: string; port: number }>;
  'server.port.live': { ctx: EventContext; url: string; host: string; port: number };
  
  // ============================================================================
  // ERROR NAMESPACE
  // ============================================================================
  
  'error': { scope: string; error: Error; fatal?: boolean };
}
```

#### 5.2.3 Event Metadata Map (Webhook/Transport Filtering)

```typescript
// packages/core/src/events/meta.ts

export const OpenWAEventMeta: Record<keyof OpenWAEventMap, OpenWAEventMeta> = {
  // --- launch.* (ALL internal, some sensitive) ---
  'launch.create.start': { internal: true, sensitive: false },
  'launch.create.retry': { internal: true, sensitive: false },
  'launch.create.ready': { internal: true, sensitive: false },
  'launch.config.setup.before': { internal: true, sensitive: false },
  'launch.config.setup.after': { internal: true, sensitive: false },
  'launch.logging.setup.before': { internal: true, sensitive: false },
  'launch.logging.setup.after': { internal: true, sensitive: false },
  'launch.update.check.before': { internal: true, sensitive: false },
  'launch.update.check.after': { internal: true, sensitive: false },
  'launch.browser.init.before': { internal: true, sensitive: false },
  'launch.browser.init.after': { internal: true, sensitive: false },
  'launch.page.init.before': { internal: true, sensitive: false },
  'launch.page.init.after': { internal: true, sensitive: false },
  'launch.page.interception.before': { internal: true, sensitive: false },
  'launch.page.interception.after': { internal: true, sensitive: false },
  'launch.navigation.gotoWaWeb.before': { internal: true, sensitive: false },
  'launch.navigation.gotoWaWeb.after': { internal: true, sensitive: false },
  'launch.modules.wait.before': { internal: true, sensitive: false },
  'launch.modules.wait.after': { internal: true, sensitive: false },
  'launch.injection.earlyCheck.before': { internal: true, sensitive: false },
  'launch.injection.earlyCheck.after': { internal: true, sensitive: false },
  'launch.auth.check.before': { internal: true, sensitive: false },
  'launch.auth.check.after': { internal: true, sensitive: false },
  'launch.auth.nuke.detected': { internal: true, sensitive: false },
  'launch.auth.timeout': { internal: true, sensitive: false },
  'launch.auth.phoneOutOfReach': { internal: true, sensitive: false },
  'launch.auth.qr.requested': { internal: true, sensitive: false },
  'launch.auth.qr.generated': { internal: true, sensitive: true },  // QR CODE = SENSITIVE
  'launch.auth.qr.scanned': { internal: true, sensitive: false },
  'launch.auth.qr.expired': { internal: true, sensitive: false },
  'launch.auth.linkCode.requested': { internal: true, sensitive: false },
  'launch.auth.linkCode.generated': { internal: true, sensitive: true },  // LINK CODE = SENSITIVE
  'launch.auth.pairing': { internal: true, sensitive: false },
  'launch.auth.syncing': { internal: true, sensitive: false },
  'launch.license.preload.before': { internal: true, sensitive: false },
  'launch.license.preload.after': { internal: true, sensitive: false },
  'launch.wapi.inject.before': { internal: true, sensitive: false },
  'launch.wapi.inject.after': { internal: true, sensitive: false },
  'launch.session.validityCheck.before': { internal: true, sensitive: false },
  'launch.session.validityCheck.after': { internal: true, sensitive: false },
  'launch.session.invalid.retry': { internal: true, sensitive: false },
  'launch.license.check.before': { internal: true, sensitive: false },
  'launch.license.check.after': { internal: true, sensitive: false },
  'launch.patch.init.before': { internal: true, sensitive: false },
  'launch.patch.init.after': { internal: true, sensitive: false },
  'launch.client.finalize.before': { internal: true, sensitive: false },
  'launch.client.finalize.after': { internal: true, sensitive: false },

  // --- session.* (mostly internal except state/connection) ---
  'session.state.changed': { internal: false, sensitive: false },
  'session.connection.disconnected': { internal: false, sensitive: false },
  'session.connection.reconnecting': { internal: false, sensitive: false },
  'session.connection.reconnected': { internal: false, sensitive: false },
  'session.frame.navigated': { internal: true, sensitive: false },
  'session.reinject.detected': { internal: true, sensitive: false },
  'session.reinject.before': { internal: true, sensitive: false },
  'session.reinject.after': { internal: true, sensitive: false },
  'session.reinject.qr.waiting': { internal: true, sensitive: false },
  'session.stale.detected': { internal: true, sensitive: false },
  'session.logout': { internal: false, sensitive: false },

  // --- message/ack/chat/group/device/call/etc. (webhook-eligible) ---
  'message.received': { internal: false, sensitive: false },
  'message.any': { internal: false, sensitive: false },
  'message.deleted': { internal: false, sensitive: false },
  'ack.changed': { internal: false, sensitive: false },
  'group.addedToGroup': { internal: false, sensitive: false },
  'group.removedFromGroup': { internal: false, sensitive: false },
  'group.participants.changed.global': { internal: false, sensitive: false },
  'group.approval.request': { internal: false, sensitive: false },
  'group.changed': { internal: false, sensitive: false },
  'chat.deleted': { internal: false, sensitive: false },
  'chat.opened': { internal: false, sensitive: false },
  'chat.state': { internal: false, sensitive: false },
  'device.battery': { internal: false, sensitive: false },
  'device.plugged': { internal: false, sensitive: false },
  'call.incoming': { internal: false, sensitive: false },
  'call.state': { internal: false, sensitive: false },
  'auth.logout': { internal: false, sensitive: false },
  'ui.button': { internal: false, sensitive: false },
  'ui.poll.vote': { internal: false, sensitive: false },
  'broadcast.received': { internal: false, sensitive: false },
  'label.changed': { internal: false, sensitive: false },
  'story.received': { internal: false, sensitive: false },
  'commerce.order': { internal: false, sensitive: false },
  'commerce.product.new': { internal: false, sensitive: false },
  'reaction.added': { internal: false, sensitive: false },

  // --- media.* (internal instrumentation) ---
  'media.preprocess.before': { internal: true, sensitive: false },
  'media.preprocess.after': { internal: true, sensitive: false },
  'media.processor.SCRUB.before': { internal: true, sensitive: false },
  'media.processor.SCRUB.after': { internal: true, sensitive: false },
  'media.processor.BODY_ONLY.before': { internal: true, sensitive: false },
  'media.processor.BODY_ONLY.after': { internal: true, sensitive: false },
  'media.processor.AUTO_DECRYPT.before': { internal: true, sensitive: false },
  'media.processor.AUTO_DECRYPT.after': { internal: true, sensitive: false },
  'media.processor.AUTO_DECRYPT_SAVE.before': { internal: true, sensitive: false },
  'media.processor.AUTO_DECRYPT_SAVE.after': { internal: true, sensitive: false },
  'media.processor.UPLOAD_CLOUD.before': { internal: true, sensitive: false },
  'media.processor.UPLOAD_CLOUD.after': { internal: true, sensitive: false },
  'media.upload.s3.before': { internal: true, sensitive: false },
  'media.upload.s3.after': { internal: true, sensitive: false },

  // --- webhook.* (ALWAYS internal to prevent infinite loops!) ---
  'webhook.registered': { internal: true, sensitive: false },
  'webhook.unregistered': { internal: true, sensitive: false },
  'webhook.trigger.before': { internal: true, sensitive: false },
  'webhook.trigger.after': { internal: true, sensitive: false },
  'webhook.queue.enqueued': { internal: true, sensitive: false },
  'webhook.queue.dequeued': { internal: true, sensitive: false },
  'webhook.deliver.before': { internal: true, sensitive: false },
  'webhook.deliver.after': { internal: true, sensitive: false },

  // --- persistence.* (internal + sensitive) ---
  'persistence.session.save.before': { internal: true, sensitive: true },
  'persistence.session.save.after': { internal: true, sensitive: true },
  'persistence.compress.zstd.before': { internal: true, sensitive: true },
  'persistence.compress.zstd.after': { internal: true, sensitive: true },
  'persistence.archive.zip.before': { internal: true, sensitive: true },
  'persistence.archive.zip.after': { internal: true, sensitive: true },
  'persistence.upload.s3.before': { internal: true, sensitive: true },
  'persistence.upload.s3.after': { internal: true, sensitive: true },

  // --- patch/license (internal instrumentation) ---
  'patch.apply.before': { internal: true, sensitive: false },
  'patch.apply.after': { internal: true, sensitive: false },
  'patch.init.before': { internal: true, sensitive: false },
  'patch.init.after': { internal: true, sensitive: false },
  'license.check.before': { internal: true, sensitive: false },
  'license.check.after': { internal: true, sensitive: false },
  'license.inject.before': { internal: true, sensitive: false },
  'license.inject.after': { internal: true, sensitive: false },

  // --- cli/server (internal lifecycle) ---
  'cli.launched': { internal: true, sensitive: false },
  'server.start.before': { internal: true, sensitive: false },
  'server.start.after': { internal: true, sensitive: false },
  'server.port.live': { internal: true, sensitive: false },

  // --- error ---
  'error': { internal: false, sensitive: false },
};
```

#### 5.2.4 Wildcard Pattern Examples

```typescript
// Using HyperEmitter MQTT-style wildcards with the new event map

// All launch events (internal only)
events.on('launch.#', (payload) => { /* instrumentation */ });

// All auth events during launch
events.on('launch.auth.+', (payload) => { /* auth flow tracking */ });

// All QR-related events (be careful - sensitive!)
events.on('launch.auth.qr.+', (payload) => { /* QR handling */ });

// All message events
events.on('message.+', (payload) => { /* message.received, message.any, message.deleted */ });

// All group participant changes
events.on('group.participants.+', (payload) => { /* add, remove, promote, demote */ });

// All media processor events
events.on('media.processor.+.before', (payload) => { /* before any processor */ });
events.on('media.processor.+.after', (payload) => { /* after any processor */ });

// All session events
events.on('session.+', (payload) => { /* connection, reinject, stale, logout */ });

// All events for a specific session (using session suffix at runtime)
events.on('#.session1', (payload) => { /* all events for session1 */ });
```

#### 5.2.5 Transport Filtering Helper

```typescript
// packages/core/src/events/transport.ts

import { OpenWAEventMeta, OpenWAEventMetaMap } from './meta';

/** Filter events eligible for webhooks (not internal, not sensitive) */
export function isWebhookEligible(event: keyof OpenWAEventMap): boolean {
  const meta = OpenWAEventMetaMap[event];
  return !meta.internal && !meta.sensitive;
}

/** Filter events eligible for external logging (not sensitive) */
export function isLoggingEligible(event: keyof OpenWAEventMap): boolean {
  const meta = OpenWAEventMetaMap[event];
  return !meta.sensitive;
}

/** Get all events in a namespace */
export function getEventsInNamespace(namespace: string): (keyof OpenWAEventMap)[] {
  return Object.keys(OpenWAEventMetaMap)
    .filter(key => key.startsWith(namespace + '.')) as (keyof OpenWAEventMap)[];
}
```

### 5.3 Event Bus Setup in Core

```typescript
// packages/core/src/createClient.ts

import { HyperEmitter } from '@open-wa/hyperemitter';
import { createLogger } from '@open-wa/logger';
import type { OpenWAEventMap } from './events/eventMap';

export async function createClient(config: CreateClientOptions) {
  const logger = createLogger({ component: 'core' });
  
  // Create typed event bus using existing HyperEmitter
  const events = new HyperEmitter<OpenWAEventMap>({
    delimiter: '.',
    captureRejections: true,
    onError: (err) => logger.error('event_error', { error: err }),
    logger: logger,
    debug: config.debug ?? false,
  });
  
  // Events are now fully typed:
  events.emit('core.starting', { config: resolvedConfig });
  
  // Wildcard subscriptions work:
  events.on('message.+' as any, (payload) => {
    // Catches message.received, message.sent, message.ack, etc.
  });
  
  events.on('group.participant.#' as any, (payload) => {
    // Catches all group.participant.* events
  });
  
  // ... rest of initialization
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

## 7. Phased Implementation Plan (Simplified)

### Phase 0: Foundation (DONE)
- [x] `packages/schema` - Zod schemas
- [x] `packages/config` - Config management
- [x] `packages/driver-interface` - Browser abstraction
- [x] `packages/hyperemitter` - Typed event bus with wildcards (USE THIS)
- [x] `packages/logger` - Winston-based logging (USE THIS)

### Phase 1: Rename Core to Legacy (0.5 day)
- [ ] Rename `packages/core` → `packages/legacy`
- [ ] Update all internal imports
- [ ] Add deprecation warnings
- [ ] Verify existing tests pass

### Phase 2: Driver Implementations (1-2 days)
- [ ] Create `packages/driver-puppeteer`
- [ ] Move puppeteer-specific code from legacy
- [ ] Create `packages/driver-playwright` (stub)

### Phase 3: New Core Backbone (3-4 days)
- [ ] Create new `packages/core`
- [ ] Implement `createClient()` lifecycle
- [ ] Implement `PluginHost` (opencode-style)
- [ ] Implement `core/session/` (session management, QR, auth)
- [ ] Implement `core/transport/` (WAPI injection, patches)
- [ ] Wire up hyperemitter, config, driver-interface
- [ ] Define `OpenWAEventMap` for typed events
- [ ] Write integration tests

### Phase 4: Domain & Client Packages (2-3 days)
- [ ] Create `packages/domain`
- [ ] Move Collector, MessageCollector to domain/
- [ ] Create `packages/client`
- [ ] Extract Client.ts methods into organized modules
- [ ] Setup codegen for method stubs
- [ ] Ensure API parity with legacy

### Phase 5: CLI Package (1-2 days)
- [ ] Create `packages/cli`
- [ ] Extract CLI logic from legacy
- [ ] Update to use new packages
- [ ] Add plugin loading from config

### Phase 6: Integrations (1-2 days per integration)
- [ ] Create `integrations/chatwoot`
- [ ] Create `integrations/cloudflare`
- [ ] Create `integrations/s3`
- [ ] Create `integrations/webhook`

### Phase 7: Codegen (1 day)
- [ ] Create `packages/codegen`
- [ ] Move Postman generation
- [ ] Add client method generation from schemas

---

## Summary of Changes (v2)

| Original Plan | Updated Plan | Reason |
|---------------|--------------|--------|
| Create `packages/events` | Use `packages/hyperemitter` | Already exists with typed EventMap, wildcards, WeakRef |
| Create `packages/logging` | Use `packages/logger` | Already exists with Winston, transports, security |
| Create `packages/session` | Keep in `core/session/` | Core component - no external use case |
| Create `packages/transport-web` | Keep in `core/transport/` | Core component - no external use case |
| Object-based plugin interface | Factory function pattern | Matches opencode plugin pattern |
| 10 phases | 7 phases | Fewer packages to create |

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
| **Use existing hyperemitter** | Already has typed EventMap, wildcards, WeakRef, bridges | 2026-01-25 |
| **Use existing logger** | Already has Winston, transports, security, middleware | 2026-01-25 |
| **Keep session in core** | Core component - no external use case | 2026-01-25 |
| **Keep transport in core** | Core component - no external use case | 2026-01-25 |
| **Factory function plugins** | Matches opencode pattern: `Plugin = (input) => Promise<Hooks>` | 2026-01-25 |

## Appendix C: Plugin Architecture Comparison (Librarian Research)

| Feature           | VSCode     | Webpack          | Fastify       | opencode      | **open-wa (v2)** |
| ----------------- | ---------- | ---------------- | ------------- | ------------- | ---------------- |
| **Core Pattern**      | DI + IPC   | Event Hooks      | Encapsulation | Factory + Hooks | Factory + Hooks |
| **Registration**      | Manifest   | `.apply(compiler)` | `.register(fn)` | `Plugin(input)` | `Plugin(input)` |
| **TypeScript**        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐         | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| **Monorepo Friendly** | ⭐⭐⭐     | ⭐⭐⭐           | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| **Learning Curve**    | Medium     | Medium-High      | Low-Medium    | Low           | Low |
| **Isolation**         | Process    | Logical          | Context       | Hooks         | Hooks |
| **Best For**          | Extensions | Build tools      | APIs          | AI agents     | WhatsApp bots |

**Final Choice**: opencode-inspired factory function pattern

```typescript
// opencode pattern (reference):
export type Plugin = (input: PluginInput) => Promise<Hooks>

export interface Hooks {
  event?: (input: { event: Event }) => Promise<void>;
  tool?: { [key: string]: ToolDefinition };
  'chat.message'?: (input, output) => Promise<void>;
  'tool.execute.before'?: (input, output) => Promise<void>;
  // ...lifecycle hooks
}

// open-wa implementation (adapted):
export type Plugin = (input: PluginInput) => Promise<Hooks>

export interface Hooks {
  event?: (input: { event: string; payload: unknown }) => Promise<void>;
  tool?: { [key: string]: ToolDefinition };
  dispose?: () => Promise<void>;
  
  // Lifecycle hooks
  'core.starting'?: (payload) => Promise<void>;
  'client.ready'?: (payload) => Promise<void>;
  
  // Message hooks
  'message.received'?: (payload) => Promise<void>;
  'message.send.before'?: (input, output) => Promise<void>;
  // ...
}
```

**Why this pattern**:
1. Factory function allows configuration per-instance
2. Hooks object is declarative and type-safe
3. `before`/`after` hooks enable interception
4. `dispose` hook ensures cleanup
5. Matches successful production pattern (opencode)

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

| Pattern | Location | Preserve? | Notes |
|---------|----------|-----------|-------|
| Node-Red socket integration | `integrations/node-red/` | ✅ Good pattern | |
| EventEmitter2 wildcards | `controllers/events.ts` | ✅ Via hyperemitter | HyperEmitter has MQTT wildcards |
| Schema auto-generation | `packages/schema/` | ✅ Expand to client | |
| Driver abstraction | `packages/driver-interface/` | ✅ Foundation in place | |
| Discord-style Collector | `structures/Collector.ts` | ✅ Move to domain/ | |
| **HyperEmitter** | `packages/hyperemitter/` | ✅ Use as event bus | Already built - typed, wildcards, WeakRef |
| **Logger** | `packages/logger/` | ✅ Use for all logging | Already built - Winston, transports, security |

## Appendix F: Existing Package Inventory

### packages/hyperemitter (USE THIS)

```typescript
// Key exports
import { HyperEmitter } from '@open-wa/hyperemitter';

const events = new HyperEmitter<MyEventMap>({
  delimiter: '.',
  captureRejections: true,
  onError: (err) => console.error(err),
  logger: myLogger,
  debug: true,
});

// Typed events
events.on('message.received', (payload) => { /* payload is typed */ });

// MQTT-style wildcards
events.on('message.+', handler);      // single-level: message.received, message.sent
events.on('group.participant.#', h);  // multi-level: group.participant.add, etc.

// Node EventEmitter bridge
const cleanup = events.fromNodeEmitter(nodeEmitter, 'data');

// WeakRef support (auto-cleanup)
events.on('event', handler, { weak: true });
```

### packages/logger (USE THIS)

```typescript
// Key exports
import { createLogger, rootLogger } from '@open-wa/logger';
import { sanitizeLogContext, createSanitizer } from '@open-wa/logger';
import { honoLogger, socketLogger } from '@open-wa/logger';
import * as transports from '@open-wa/logger/transports';

const logger = createLogger({ component: 'core' });
logger.info('message', { key: 'value' });
logger.error('error', { error: err });

// Transports: elasticsearch, cloudflare, file, console, mq
// Security: sanitizer, censors (phone numbers, etc.)
// Middleware: hono, socket.io
```
