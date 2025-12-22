# Project Overview

## Basic Information

**Project**: open-wa/wa-automate-nodejs  
**Purpose**: WhatsApp Web automation library - provides high-level API to control WhatsApp Web programmatically  
**Current Version**: v5.0.0-alpha.1 (major migration from v4)  
**License**: Apache-2.0 (with Hippocratic + Do Not Harm)  
**Repository**: https://github.com/open-wa/wa-automate-nodejs  
**Documentation**: https://docs.openwa.dev

## Technical Stack

**Package Manager**: pnpm (v10.25.0+)  
**Monorepo Tool**: Turborepo  
**Node Version**: >=18.0.0  
**TypeScript**: Target ES2015, CommonJS modules

## Architecture

**Monorepo Structure** with workspaces:
- `packages/*` - Core libraries and utilities
- `apps/*` - Applications and dashboards
- `integrations/*` - Third-party integrations (node-red)
- `sdks/*` - SDK implementations (future)

## Key Features

- **Message handling** - Send and receive WhatsApp messages
- **Media handling** - Images, videos, audio, documents
- **Group management** - Create, manage, moderate groups
- **Multi-device support** - WhatsApp multi-device compatibility
- **Session management** - Persistent sessions, no re-auth needed
- **WebSocket/Socket.io API** - Real-time event streaming
- **REST API** - HTTP API via Hono server
- **Commercial/freemium** - License key system for premium features

## Business Model

- Open source (Apache-2.0)
- Commercial license keys for premium features
- Consulting and support available
- Active community on Discord

## Target Users

- Node.js developers building WhatsApp bots
- Businesses automating customer communication
- Developers needing WhatsApp integration
- Projects requiring multi-session WhatsApp management
