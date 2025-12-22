# Quick Reference

> **Note**: No AGENTS.md or CLAUDE.md files found - this is based on deep research of the codebase.

## Key Project Info

- **Type**: WhatsApp Web automation library
- **Version**: v5.0.0-alpha.1 (major migration complete)
- **Structure**: Monorepo with pnpm + Turborepo
- **Business**: Commercial/freemium with license keys
- **Docs**: docs.openwa.dev

## ⚠️ Important Footguns & Gotchas

### Build & Configuration
- **ESLint/TypeScript are LENIENT** - Many strict rules turned OFF for legacy code compatibility
  - `no-explicit-any`, `no-empty-function`, `ban-ts-comment` all disabled
  - No strict mode in TypeScript
  - This is intentional for backwards compatibility

### Package Management
- **MUST use pnpm** (not npm or yarn)
  - Version: 10.25.0+
  - Workspaces configured in pnpm-workspace.yaml

### Version Compatibility
- **v5 is a COMPLETE REWRITE** - Not compatible with v4
  - Different API surface
  - Different event system
  - Different package structure
  - Check MIGRATION-LOG.md for details

### License System
- **License verification required** for certain premium features
- API key system for API access
- Keep license keys secure

### WhatsApp Web Changes
- **WhatsApp Web can change anytime** - This library tracks those changes
- Updates may be required when WhatsApp updates their web client
- Always use latest version for best compatibility

## 🚀 Quick Development Tips

### Schema Changes
When modifying schemas in `@open-wa/schema`:
```bash
cd packages/schema
pnpm generate  # Generate types and OpenAPI specs
pnpm build     # Compile TypeScript
```

### Workspace Dependencies
- Use `"workspace:*"` protocol for internal dependencies
- Example: `"@open-wa/core": "workspace:*"`

### Turbo Tasks
- `pnpm build` - Build all packages
- `pnpm dev` - Watch mode for development
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean everything

### New in v5
- **HyperEmitter** - NEW event system replacing old EventEmitter
  - MQTT-style wildcards (+, #)
  - High performance (benchmarked against competitors)
  - Schema-driven
- **Hono Server** - Replaced Express with Hono for HTTP
- **Zod Schemas** - Type-safe schema system with OpenAPI generation
- **Monorepo** - Consolidated multiple repos into one

## 📚 Key Files to Check

- `MIGRATION-LOG.md` - v5 migration details and status
- `turbo.json` - Turborepo configuration
- `pnpm-workspace.yaml` - Workspace configuration
- `packages/schema/` - Schema definitions (Zod)
- `packages/hyperemitter/` - New event system

## 🔗 Important Links

- Repository: https://github.com/open-wa/wa-automate-nodejs
- Documentation: https://docs.openwa.dev
- Discord: https://discord.gg/dnpp72a
- Twitter: @openwadev
