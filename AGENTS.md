# AGENTS.md - Agent Coding Guidelines

This document provides guidelines for AI agents working in this repository.

## Project Overview

- **Project Name**: mcp-sketch
- **Type**: Local MCP (Model Context Protocol) server for parsing Sketch files
- **Language**: TypeScript (ESM, Node.js 18+)
- **Package Manager**: pnpm
- **Key Dependencies**: @modelcontextprotocol/sdk, adm-zip, zod, pino

## Build, Lint, and Test Commands

```bash
# Build production bundle
pnpm build

# Start the server (builds + runs)
pnpm dev

# Watch mode for development
pnpm watch

# Type checking only
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix      # Auto-fix issues

# Formatting
pnpm format         # Format all source files
pnpm format:check   # Check formatting without writing

# Testing
pnpm test           # Run all tests once
pnpm test:watch     # Watch mode for tests
```

### Running a Single Test

```bash
# Run a specific test file
pnpm vitest run src/tests/example.test.ts

# Run tests matching a pattern
pnpm vitest run --grep "pattern"

# Run tests in a specific directory
pnpm vitest run src/tests/unit/
```

## Code Style Guidelines

### General

- **Module System**: ESM (ECMAScript Modules) - use `import`/`export`, not CommonJS
- **TypeScript**: Strict mode enabled in `tsconfig.json`
- **Node Version**: Minimum Node.js 18

### Formatting (Prettier)

Configured in `.prettierrc.cjs`:

- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes (`'`)
- **Semicolons**: No (omit at end of statements)
- **Trailing Commas**: None
- **Line Width**: 80 characters
- **Arrow Functions**: Omit parentheses when possible (`x => x`)

### Linting (ESLint)

Configured in `eslint.config.js`:

- Uses TypeScript ESLint parser with type-aware rules
- Extends recommended rules + prettier
- **Key Rules**:
  - `@typescript-eslint/no-unused-vars`: Error (ignore pattern: `^_`)
  - `@typescript-eslint/no-explicit-any`: Warn
  - `@typescript-eslint/no-floating-promises`: Warn
  - `@typescript-eslint/no-misused-promises`: Warn

### Naming Conventions

- **Files**: kebab-case (e.g., `extract-color.ts`, `resolve-artboard-target.ts`)
- **Functions/variables**: camelCase
- **Interfaces/Types**: PascalCase (e.g., `LayerFill`, `LayerStyle`)
- **Constants**: UPPER_SNAKE_CASE or camelCase with prefix (e.g., `MAX_RETRIES` or `defaultTimeout`)

### Import Conventions

- Use path aliases: `@/*` maps to `./src/*`
- Use `import type` for types only
- Group imports: external libraries → internal modules → types

```typescript
// External
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AnySchema } from '@modelcontextprotocol/sdk/server/zod-compat.js'

// Internal
import { logger } from '@/utils/logger'
import { tools } from '@/tools'

// Types
import type { RegisterToolParams } from '@/types'
```

### Error Handling

- Use Zod for input validation (already integrated with MCP SDK)
- Use `logger.error()` or `logger.debug()` for logging (pino)
- Return proper `CallToolResult` with `isError: true` for tool errors
- Always include descriptive error messages

```typescript
// Good error handling pattern
function myTool(args: InputSchema): CallToolResult {
  if (!args.file_path) {
    return {
      content: [{ type: 'text', text: 'Error: file_path is required' }],
      isError: true
    }
  }
  // ... implementation
}
```

### TypeScript Best Practices

- Enable `strict: true` in tsconfig
- Avoid `any` - use `unknown` or proper types
- Use `type` for unions/intersections, `interface` for object shapes
- Enable explicit return types for exported functions
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### File Organization

```
src/
├── index.ts              # Entry point
├── types.ts              # Global types
├── constants.ts          # Constants
├── tools/                # MCP tool definitions
│   ├── index.ts
│   └── sketchAnalyze/
├── services/             # Business logic
│   └── sketchAnalyze/
│       ├── index.ts
│       ├── resolveArtboardTarget/
│       └── assembleNode/
└── utils/                # Utility functions
    ├── logger.ts
    ├── treeTransform.ts
    └── mutex.ts
```

### Testing

- Test files go in `src/tests/` (configured in `vitest.config.ts`)
- Use `.test.ts` or `.spec.ts` extension
- Vitest is configured with:
  - Node environment
  - 10 second timeout
  - JSON reporter outputting to `test-results/results.json`
  - Path aliases: `@` and `@tests`

## Working with the MCP SDK

This project uses `@modelcontextprotocol/sdk` for MCP server implementation. Key patterns:

- Register tools using `server.registerTool(name, config, callback)`
- Tools return `CallToolResult` with content array
- Use Zod schemas for input validation via `inputSchema`
- Follow existing tool patterns in `src/tools/`

## Git Hooks

The project uses `simple-git-hooks` with `lint-staged`:

- Pre-commit runs prettier on all files + ESLint fix on TypeScript
- Configure in `package.json` under `lint-staged` and `simple-git-hooks`

## Notes for AI Agents

- Always run `pnpm typecheck` and `pnpm lint` before committing
- Use `pnpm build` to verify compilation succeeds
- Follow existing code patterns in the repository
- Keep functions small and focused
- Add JSDoc comments for exported functions
