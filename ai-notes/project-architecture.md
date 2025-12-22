# Project Architecture

## Monorepo Structure

```
wa/
├── packages/              # Core libraries
│   ├── core/             # Shared WhatsApp logic
│   ├── wa-automate/      # Main CLI + API server (Hono + Socket.io)
│   ├── orchestrator/     # Multi-session management (Express, PM2)
│   ├── schema/           # Zod schemas + OpenAPI generation
│   ├── hyperemitter/     # Event system (NEW in v5, wildcards)
│   ├── logger/           # Logging utilities
│   ├── socket-client/    # Socket.io client wrapper
│   ├── session-sync/     # Session state management
│   ├── wa-decrypt/       # Media decryption
│   └── ui-components/    # Shared UI components
│
├── apps/                 # Applications
│   ├── dashboard/        # Main dashboard (React 19, Vite, TanStack)
│   ├── orchestrator-cli/ # Orchestrator CLI
│   ├── orchestrator-dashboard/  # Orchestrator web UI
│   ├── docker/           # Docker setup
│   ├── docs/             # Documentation site
│   └── registry/         # Package registry
│
├── integrations/         # Third-party integrations
│   └── node-red/         # Node-RED integration
│
└── sdks/                 # Multi-language SDKs (future)
```

## Data Flow

### Single Session Flow
```
User → CLI/HTTP Request
  ↓
wa-automate (Hono Server)
  ↓
Session Manager → Core WhatsApp Logic
  ↓
Events → HyperEmitter
  ↓
Socket.io Clients (dashboard, custom apps)
  ↓
Optional: Elasticsearch Monitoring
```

### Multi-Session Flow (Orchestrator)
```
User → Orchestrator (Express Server)
  ↓
PM2 Process Manager
  ↓
Multiple wa-automate Instances
  ├─ Session 1
  ├─ Session 2
  └─ Session N
  ↓
Orchestrator Dashboard
```

## Technology Stack

### HTTP Layer
- **Hono** - Lightweight, fast HTTP server
  - Replaced Express in v5
  - Used in wa-automate package
- **Express** - Traditional HTTP server
  - Still used in orchestrator package
  - Legacy compatibility

### WebSocket Layer
- **Socket.io** - Real-time bidirectional communication
  - Event streaming to clients
  - Dashboard connections
  - Custom integrations

### Event System
- **HyperEmitter** ⭐ NEW in v5
  - Custom high-performance emitter
  - MQTT-style wildcards (`+`, `#`)
  - Schema-driven
  - Replaces Node's EventEmitter

### Schema & Validation
- **Zod** - Runtime type validation
  - Schema definitions
  - Type generation
  - OpenAPI spec generation
- **zod-to-openapi** - OpenAPI 3.0 spec generation

### Monitoring (Optional)
- **Elasticsearch** - Log aggregation and search
  - Optional integration
  - Configurable via config
  - Buffer-based batching

### Logging
- **Winston** - Advanced logging
  - Multiple transports (console, file, papertrail, syslog)
  - Used in orchestrator
  - Daily log rotation

### Process Management
- **PM2** - Process manager (orchestrator only)
  - Multi-session management
  - Process monitoring
  - Auto-restart

### Frontend
- **React 19** - Latest React
- **Vite** - Build tool
- **TanStack Router** - Type-safe routing
- **Tailwind CSS** - Utility-first CSS

### Build System
- **Turborepo** - Monorepo task runner
  - Parallel builds
  - Caching
  - Task dependencies
- **TypeScript** - Type system
  - Target: ES2015
  - Module: CommonJS
  - Strict mode: OFF (legacy compat)

## v5 Migration Changes

### Before v5 (v4.x)
- Separate repositories for orchestrator, socket-client, wa-decrypt, docker, node-red
- Custom event system
- Express for HTTP
- Manual type definitions

### After v5 (v5.0.0-alpha.1)
- **✅ Monorepo** - Consolidated all repos via git subtree
- **✅ HyperEmitter** - New high-performance event system
- **✅ Hono** - Replaced Express in wa-automate
- **✅ Zod schemas** - Type-safe schema system with codegen
- **✅ Turborepo** - Parallel builds and caching
- **✅ React 19** - Modern React in dashboards

### Migration Status
- Tag: `v5-phase5-complete`
- Status: **COMPLETE** - All phases done
- Current version: v5.0.0-alpha.1
- Next step: Stabilize for v5.0.0 stable release

## Key Architectural Patterns

### 1. Dependency Injection
Classes accept config and logger via constructor:
```typescript
class WAServer {
  constructor(config: Config) {
    this.config = config;
    this.logger = createLogger(config.loggerContext);
  }
}
```

### 2. Modular Structure
Clear separation of concerns:
- `server/` - HTTP and WebSocket servers
- `middleware/` - HTTP middleware (auth, rate-limit)
- `monitoring/` - Elasticsearch integration
- `session/` - Session management

### 3. Workspace Protocol
Internal dependencies use `"workspace:*"`:
```json
{
  "dependencies": {
    "@open-wa/core": "workspace:*"
  }
}
```

### 4. Type Safety
- Zod schemas for runtime validation
- TypeScript for compile-time safety
- Generated types from schemas

### 5. Event-Driven
- HyperEmitter for internal events
- Socket.io for external event streaming
- Wildcard support for flexible subscriptions
