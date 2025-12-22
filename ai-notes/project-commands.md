# Project Commands

## Root-Level Commands

All commands should be run from the repository root.

### Build Commands
```bash
pnpm build          # Build all packages (via Turbo)
pnpm dev            # Run all packages in watch mode
pnpm clean          # Clean all builds and node_modules
```

### Quality Commands
```bash
pnpm test           # Run all tests
pnpm lint           # Lint all packages
pnpm typecheck      # Type check all packages
pnpm format         # Format code with Prettier
```

## Package-Specific Commands

### Run in Specific Package
```bash
pnpm --filter <package-name> <command>
```

Examples:
```bash
pnpm --filter @open-wa/schema build
pnpm --filter @open-wa/hyperemitter bench:baseline
pnpm --filter @open-wa/wa-automate test
```

## Package: @open-wa/schema

**Location**: `packages/schema/`

### Schema Generation
```bash
cd packages/schema
pnpm generate       # Generate types and OpenAPI spec from Zod schemas
```

This runs:
- `gen-types.ts` - Generate TypeScript types
- `gen-openapi.ts` - Generate OpenAPI specification
- `gen-client-implementation.ts` - Generate client implementation

### Full Build
```bash
cd packages/schema
pnpm build          # Run generate + compile TypeScript
```

### Development
```bash
cd packages/schema
pnpm dev            # Watch mode for TypeScript compilation
```

## Package: @open-wa/hyperemitter

**Location**: `packages/hyperemitter/`

### Benchmarking
```bash
cd packages/hyperemitter
pnpm bench:baseline              # Run full benchmarks (with tables)
pnpm bench:baseline:ci           # Run benchmarks in CI mode (no tables)
pnpm bench:baseline --iterations 1000000   # Custom iteration count
```

Benchmarks compare HyperEmitter against:
- Node.js EventEmitter (built-in)
- eventemitter2
- eventemitter3
- emittery
- mitt
- tseep

Results saved to: `benchmarks/baseline/results/baseline-node-<version>.json`

## Package: @open-wa/wa-automate

**Location**: `packages/wa-automate/`

### CLI Usage
```bash
npx @open-wa/wa-automate --help     # Show CLI help
npx @open-wa/wa-automate            # Start API server
```

### Build & Test
```bash
cd packages/wa-automate
pnpm build          # Compile TypeScript
pnpm dev            # Watch mode
pnpm test           # Run tests
```

## Turborepo Tasks

Defined in `turbo.json`:

### build
- **Depends on**: `^build` (dependencies must build first)
- **Outputs**: `dist/**`, `build/**`
- **Caching**: Enabled

### test
- **Depends on**: `build`
- **Outputs**: `coverage/**`
- **Inputs**: `src/**/*.tsx`, `src/**/*.ts`, `test/**/*.ts`
- **Caching**: Enabled

### lint
- **Outputs**: None
- **Caching**: Enabled

### dev
- **Cache**: Disabled
- **Persistent**: True (keeps running)

### typecheck
- **Outputs**: None
- **Caching**: Enabled

### clean
- **Cache**: Disabled

## Common Workflows

### Fresh Start
```bash
pnpm clean          # Clean everything
pnpm install        # Install dependencies
pnpm build          # Build all packages
```

### After Pulling Changes
```bash
pnpm install        # Update dependencies
pnpm build          # Rebuild all packages
```

### Schema Changes
```bash
cd packages/schema
pnpm generate       # Regenerate types from schemas
cd ../..
pnpm build          # Rebuild dependent packages
```

### Running Tests
```bash
pnpm test           # All tests
pnpm --filter @open-wa/wa-automate test    # Specific package
```

### Development Mode
```bash
pnpm dev            # Start all packages in watch mode
```

### Formatting
```bash
pnpm format         # Format all files
```

## Package Manager

### pnpm Commands
```bash
pnpm install                    # Install all dependencies
pnpm add <package>              # Add dependency to root
pnpm add <package> -w           # Add to workspace root
pnpm --filter <pkg> add <dep>   # Add to specific package
```

### Version Requirements
- **pnpm**: >=8.0.0 (packageManager: pnpm@10.25.0)
- **node**: >=18.0.0

### Workspace Management
```bash
pnpm -r <command>               # Run in all packages (recursive)
pnpm --filter <pattern> <cmd>   # Run in matching packages
```

## Git Workflow

### Typical Development Flow
```bash
# Make changes
git status
git add .
git commit -m "feat: add new feature"

# If tests pass
git push origin master
```

### Checkpoint Commits
Mohammed often uses checkpoint commits during major work:
```bash
git commit -m "checkpoint 2"
git commit -m "v5 checkpoint"
```

## CI/CD

### GitHub Actions
Located in `.github/workflows/`:
- `comment-run.yml` - Comment-triggered runs
- `docs-run.yml` - Documentation builds

Currently minimal CI setup for v5.
