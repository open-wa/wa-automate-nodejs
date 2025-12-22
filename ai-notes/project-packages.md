# Project Packages

## Core Packages

### 1. @open-wa/wa-automate
**Location**: `packages/wa-automate/`  
**Purpose**: Main package - CLI and API server  
**Key Technologies**:
- Hono (HTTP server)
- Socket.io (WebSocket)
- Elasticsearch integration (optional monitoring)

**Entry Point**: This is what end users install and use  
**Exports**: WAServer, APILifecycleManager, SessionManager, Config

---

### 2. @open-wa/core
**Location**: `packages/core/`  
**Purpose**: Core library with shared functionality  
**Contains**: Base WhatsApp automation logic, shared utilities

---

### 3. @open-wa/orchestrator
**Location**: `packages/orchestrator/`  
**Purpose**: Multi-session orchestration and management  
**Key Technologies**:
- Express (HTTP server)
- PM2 (process management)
- Firebase (optional persistence)
- Winston (advanced logging with Papertrail, Syslog)

**Features**:
- Manage multiple WhatsApp sessions
- API proxy and routing
- Session monitoring and health checks

---

### 4. @open-wa/schema
**Location**: `packages/schema/`  
**Purpose**: Schema definitions and type generation  
**Key Technologies**:
- Zod (schema validation)
- OpenAPI spec generation
- Type generation from schemas

**Build Process**:
```bash
pnpm generate  # Generate types + OpenAPI
pnpm build     # Compile TypeScript
```

---

### 5. @open-wa/hyperemitter ⭐ NEW in v5
**Location**: `packages/hyperemitter/`  
**Purpose**: High-performance event emitter  
**Features**:
- MQTT-style wildcards (`+` for single-level, `#` for multi-level)
- Benchmarked against competitors (mitt, emittery, eventemitter2, eventemitter3, tseep)
- Schema-driven event system
- Optimized hot path

**Benchmarking**:
```bash
pnpm bench:baseline     # Run benchmarks
pnpm bench:baseline:ci  # CI mode
```

---

### 6. @open-wa/logger
**Location**: `packages/logger/`  
**Purpose**: Logging utilities  
**Used by**: HyperEmitter, orchestrator, and other packages

---

### 7. @open-wa/socket-client
**Location**: `packages/socket-client/`  
**Purpose**: Socket.io client wrapper  
**Features**: Client-side Socket.io connection management

---

### 8. @open-wa/session-sync
**Location**: `packages/session-sync/`  
**Purpose**: Session state management and synchronization

---

### 9. @open-wa/wa-decrypt
**Location**: `packages/wa-decrypt/`  
**Purpose**: WhatsApp media decryption  
**Features**: Decrypt encrypted WhatsApp media files

---

### 10. @open-wa/ui-components
**Location**: `packages/ui-components/`  
**Purpose**: Shared UI components for dashboards

---

## Applications

### dashboard
**Location**: `apps/dashboard/`  
**Purpose**: Main dashboard interface  
**Tech Stack**:
- React 19
- Vite
- TanStack Router
- Tailwind CSS

---

### orchestrator-cli
**Location**: `apps/orchestrator-cli/`  
**Purpose**: CLI tool for orchestrator management

---

### orchestrator-dashboard
**Location**: `apps/orchestrator-dashboard/`  
**Purpose**: Web dashboard for orchestrator

---

### docker
**Location**: `apps/docker/`  
**Purpose**: Docker setup and configuration  
**Features**:
- Dockerfile
- docker-compose.yaml
- Deployment configs (DigitalOcean, Flightcontrol)

---

### docs
**Location**: `apps/docs/`  
**Purpose**: Documentation site  
**Tech**: VitePress or similar

---

### registry
**Location**: `apps/registry/`  
**Purpose**: Package registry (internal?)

---

## Integrations

### node-red
**Location**: `integrations/node-red/`  
**Purpose**: Node-RED integration for visual workflow automation

---

## Package Relationships

```
wa-automate
├── depends on: core, session-sync, schema
├── exports: WAServer (Hono + Socket.io)
└── uses: HyperEmitter (internally)

orchestrator
├── depends on: core
└── manages: multiple wa-automate instances

schema
├── dependencies: zod, zod-to-openapi
└── generates: types, OpenAPI specs

hyperemitter
├── depends on: logger
└── used by: core, wa-automate

dashboard
├── depends on: ui-components
└── connects to: wa-automate (via Socket.io)
```
