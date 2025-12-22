# Project Conventions

## Commit Message Style

### Conventional Commits
The project uses conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `docs:` - Documentation updates
- `test:` - Test updates
- `build:` - Build system changes
- `ci:` - CI/CD changes

### Emoji Commits
Also uses emojis (especially in older commits):
- ✨ `feat:` - New feature
- 🐛 `fix:` - Bug fix
- 🔧 - Configuration changes
- ♻️ - Refactoring
- 📝 - Documentation
- 🥚 - Dependency updates ("patches update")

### Issue References
- Reference issues with `#` (e.g., `#3264`, `#3256`)
- Example: `✨ feat: pinMessage #3256`

### Examples
```
feat: add HyperEmitter implementation with benchmarking and wildcard support
fix: relax build constraints for legacy code
chore: consolidate dependencies and fix builds
refactor: restructure core code into packages/core
✨ feat: `favSticker`, `sendFavSticker` & `getFavStickers` #3264
🥚 patches update
```

## Code Style

### Prettier Configuration
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

**Key Points**:
- **Semicolons**: Required
- **Quotes**: Single quotes
- **Tab width**: 2 spaces
- **Line length**: 100 characters
- **Trailing commas**: ES5 style

### ESLint Configuration
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-function": "off",
    "no-async-promise-executor": "off",
    "@typescript-eslint/ban-ts-comment": "off"
  }
}
```

**Key Points**:
- ⚠️ **Lenient rules** - Many strict checks disabled
- Allows `any` types
- Allows empty functions
- Allows `@ts-ignore` comments
- **Reason**: Legacy code compatibility

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2015",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

**Key Points**:
- Target: **ES2015**
- Module: **CommonJS** (not ESM)
- **No strict mode** (legacy compatibility)
- Generates `.d.ts` declaration files

## Coding Patterns

### 1. Class-Based Architecture
```typescript
export class WAServer {
  private app: Hono;
  private config: Config;
  private logger: Logger;
  
  constructor(config: Config) {
    this.config = config;
    // ...
  }
}
```

### 2. Dependency Injection
Pass dependencies via constructor:
```typescript
constructor(
  config: Config,
  logger?: Logger,
  options?: Options
) {
  this.config = config;
  this.logger = logger ?? createLogger(config.loggerContext);
}
```

### 3. Private Fields
Use private fields for encapsulation:
```typescript
private exactListeners: Map<string, ListenerRecord<AnyFn>[]>;
private wildcardTree: RadixTree<ListenerRecord<AnyFn>>;
```

### 4. Generic Types
Leverage TypeScript generics:
```typescript
export class HyperEmitter<TMap extends EventMap = EventMap> {
  on<K extends keyof TMap & string>(
    event: K,
    listener: TMap[K],
    options?: ListenerOptions
  ): this
}
```

### 5. Workspace Dependencies
```json
{
  "dependencies": {
    "@open-wa/core": "workspace:*",
    "@open-wa/schema": "workspace:*"
  }
}
```

## Testing

### Framework
- **Jest** - Testing framework
- Configuration in individual packages
- Tests in `__tests__/` directories

### Coverage
- Turborepo outputs coverage to `coverage/` directories
- Configured in turbo.json

## Branching Strategy

### Main Branch
- **master** - Primary development branch
- Direct commits (no PRs for v5 work)
- Solo maintainer workflow

### Historical Branches
- `backup-v4-execution-master` - v4 backup
- `backup-v4-final` - Final v4 state
- Various feature branches (historical)
- PR branches (historical)

### Tags
- `v5-phase5-complete` - v5 migration complete
- `v5-phase1-complete` - v5 phase 1 complete
- Version tags (4.76.0, etc.)

### PR Pattern (Historical)
- Historical PRs from contributors
- Dependabot PRs for dependency updates
- v5 work: mostly direct commits

## File Organization

### Source Files
- TypeScript sources in `src/`
- Compiled outputs in `dist/` or `build/`
- Tests in `__tests__/` or `src/__tests__/`

### Configuration Files
- Root: Monorepo-wide configs
- Package-level: Package-specific configs
- TypeScript: `tsconfig.json` (extends from root if needed)

### Documentation
- `README.md` - Package/project overview
- `MIGRATION-LOG.md` - v5 migration notes
- `docs/` - Full documentation
- `ai-notes/` - AI agent research notes

## Dependencies

### Catalog System
Shared dependencies in `pnpm-workspace.yaml`:
```yaml
catalog:
  react: ^19.2.1
  react-dom: ^19.2.1
  zod: ^3.24.1
```

Reference in packages:
```json
{
  "dependencies": {
    "zod": "catalog:"
  }
}
```

### Version Management
- Use `pnpm` (not npm or yarn)
- Lock file: `pnpm-lock.yaml`
- Sync dependencies with `syncpack` (dev dependency)
