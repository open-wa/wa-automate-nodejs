# Issue #09: Backward Compatibility & Deprecation Plan

**Priority**: MEDIUM  
**Effort**: 1-2 days  
**Risk**: LOW  
**Depends on**: All core migration issues  
**Blocks**: v5.0 release

---

## Problem Statement

v5.0 introduces breaking changes. We need a strategy to:
1. Minimize breakage for existing users
2. Provide clear migration paths
3. Deprecate old APIs gracefully
4. Document all changes

---

## Deprecation Strategy

### Phase 1: Dual Export (v5.0.0)

Keep old exports alongside new ones with deprecation warnings:

```typescript
// packages/schema/src/registry.ts

/** @deprecated Use clientRegistry instead */
export const Registry = {
    ...legacyRegistryMethods,
    
    getAllMethods(): [z.ZodFunction<any, any>, ClientFunctionMetadata][] {
        console.warn('Registry.getAllMethods() is deprecated. Use clientRegistry.getAll() instead.');
        return clientRegistry.getAll().map(def => [def.schema, def.meta]);
    }
};

// New API
export const clientRegistry = { /* ... */ };
```

### Phase 2: Deprecation Warnings (v5.0.x)

Add runtime warnings for deprecated usage:

```typescript
// packages/core/src/api/Client.ts

class Client {
    /** 
     * @deprecated Use events.on('message', handler) instead
     */
    onMessage(fn: (message: Message) => void): ListenerHandle {
        console.warn(
            '[DEPRECATED] client.onMessage() will be removed in v6.0. ' +
            'Use client.events.on("message", handler) instead.'
        );
        return this.events.on('message', fn);
    }
}
```

### Phase 3: Removal (v6.0.0)

- Remove all deprecated APIs
- Update major version
- Document in CHANGELOG

---

## Breaking Changes in v5.0

### 1. Registry API

| v4 API | v5 API | Migration |
|--------|--------|-----------|
| `Registry.getAllMethods()` | `clientRegistry.getAll()` | Return type changed |
| `Registry.get(schema)` | `clientRegistry.get(name)` | Key by name, not schema |
| Direct schema as key | Name-based lookup | Use function name |

### 2. Listener Methods

| v4 API | v5 API | Migration |
|--------|--------|-----------|
| `client.onMessage(fn)` | `client.events.on('message', fn)` | Returns `ListenerHandle` |
| Returns `boolean \| Promise<boolean>` | Returns `ListenerHandle` | Use `handle.off()` to unsubscribe |
| `queueOptions` parameter | `options` object | Same functionality |

### 3. Server Imports

| v4 API | v5 API | Migration |
|--------|--------|-----------|
| `import { BaseClient } from '@open-wa/schema/src/generated/BaseClient'` | `import { BaseClient } from '@open-wa/schema/generated'` | Path changed |

---

## Migration Guide Template

```markdown
# Migrating from v4 to v5

## Quick Start

1. Update package: `pnpm add @open-wa/wa-automate@^5.0.0`
2. Run: `pnpm build` to see type errors
3. Follow the migration steps below

## Step 1: Update Registry Usage

```typescript
// Before (v4)
import { Registry } from '@open-wa/schema';
const methods = Registry.getAllMethods();

// After (v5)
import { clientRegistry } from '@open-wa/schema';
const methods = clientRegistry.getAll();
```

## Step 2: Update Listener Patterns

```typescript
// Before (v4)
client.onMessage((msg) => {
    console.log(msg.body);
});

// After (v5) - still works with deprecation warning
client.onMessage((msg) => {
    console.log(msg.body);
});

// After (v5) - preferred
const handle = client.events.on('message', (msg) => {
    console.log(msg.body);
});

// Later: unsubscribe
handle.off();
```

## Step 3: Update Import Paths

```typescript
// Before (v4)
import { BaseClient } from '@open-wa/schema/src/generated/BaseClient';

// After (v5)
import { BaseClient } from '@open-wa/schema/generated';
```
```

---

## Compatibility Shims

For high-impact changes, provide compatibility shims:

```typescript
// packages/schema/src/compat/v4-registry.ts

import { clientRegistry } from '../registry';

/**
 * v4-compatible Registry API
 * 
 * @deprecated This shim will be removed in v6.0
 */
export const Registry = {
    getAllMethods(): [z.ZodFunction<any, any>, ClientFunctionMetadata][] {
        console.warn('[v4-compat] Registry.getAllMethods() is deprecated.');
        return clientRegistry.getAll().map(def => [def.schema, def.meta]);
    },
    
    get(schema: z.ZodFunction<any, any>) {
        console.warn('[v4-compat] Registry.get(schema) is deprecated.');
        const name = clientRegistry.getNameBySchema(schema);
        if (!name) return undefined;
        return clientRegistry.get(name)?.meta;
    }
};
```

---

## Deprecation Timeline

| Version | State |
|---------|-------|
| v5.0.0 | Dual exports, deprecation warnings |
| v5.0.x | Bug fixes, no new deprecations |
| v5.1.0 | May add more deprecations |
| v6.0.0 | Remove all deprecated APIs |

---

## CHANGELOG Template

```markdown
# Changelog

## [5.0.0] - 2024-XX-XX

### Breaking Changes

- **Registry API**: `Registry.getAllMethods()` renamed to `clientRegistry.getAll()`
  - Migration: Replace `Registry` with `clientRegistry`
  - The return type has changed from `[schema, meta][]` to `MethodDefinition[]`
  
- **Generated Files**: Moved from `src/generated/` to `generated/`
  - Migration: Update import paths from `@open-wa/schema/src/generated/X` to `@open-wa/schema/generated`

### Deprecated

- `client.onMessage()` - Use `client.events.on('message', ...)` instead
- `client.onAck()` - Use `client.events.on('ack', ...)` instead
- `Registry` export - Use `clientRegistry` instead

### Added

- `clientRegistry` - New schema-first method registry
- `eventRegistry` - New schema-first event registry
- `defineListenerV2` - Define typed event listeners
- `EventManager` - Unified event handling with queues

### Changed

- Server now uses Hono instead of Express
- 121 methods migrated to `defineMethodV2` pattern

### Fixed

- Duplicate `stop` method in hono-server.ts
```

---

## Verification Checklist

- [ ] All deprecated APIs log warnings
- [ ] v4 shims work for critical paths
- [ ] Migration guide covers all breaking changes
- [ ] CHANGELOG documents everything
- [ ] Types are updated in all packages
- [ ] Tests pass with deprecation warnings enabled

---

## Expected Outcomes

| Aspect | Before | After |
|--------|--------|-------|
| Breaking change documentation | Scattered | Centralized migration guide |
| Deprecation visibility | None | Runtime warnings |
| Migration effort | Unknown | Clear step-by-step |
| v4 compatibility | None | Shims for critical paths |
