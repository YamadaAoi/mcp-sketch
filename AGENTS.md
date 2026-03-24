# AGENTS.md - Agent Coding Guidelines

This document provides guidelines for AI agents working in this repository.

## Project Overview

- **Project Name**: mcp-sketch
- **Type**: Local MCP (Model Context Protocol) server for parsing Sketch files
- **Language**: TypeScript (ESM, Node.js 18+)
- **Package Manager**: pnpm

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
pnpm vitest run src/tests/unit/example.test.ts

# Run tests matching a pattern
pnpm vitest run --grep "pattern"
```

## Code Style Guidelines

### General

- **Module System**: ESM (no CommonJS)
- **TypeScript**: Strict mode enabled
- **Bundle**: Vite

### Formatting (Prettier)

- Indentation: 2 spaces
- Quotes: Single quotes (`'`)
- Semicolons: No
- Trailing Commas: None
- Line Width: 80 characters

### Linting (ESLint)

- TypeScript ESLint parser with type-aware rules
- Key rules:
  - `@typescript-eslint/no-unused-vars`: Error (ignore: `^_`)
  - `@typescript-eslint/no-explicit-any`: Warn
  - `@typescript-eslint/no-floating-promises`: Warn

### Naming Conventions

- **Files**: kebab-case (`extract-color.ts`)
- **Functions/variables**: camelCase
- **Interfaces/Types**: PascalCase (`LayerFill`)
- **Constants**: UPPER_SNAKE_CASE or `defaultTimeout`

### Import Conventions

- Use path alias: `@/*` maps to `./src/*`
- Use `import type` for types only
- Group: external → internal → types
- Include `.js` extension for external packages

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AnySchema } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { logger } from '@/utils/logger'
import type { RegisterToolParams } from '@/types'
```

### Error Handling

- Use Zod for input validation (integrated with MCP SDK)
- Use `logger.error()`/`logger.debug()` for logging (pino)
- Return `CallToolResult` with `isError: true` for tool errors

```typescript
function myTool(args: InputSchema): CallToolResult {
  if (!args.file_path) {
    return {
      content: [{ type: 'text', text: 'Error: file_path is required' }],
      isError: true
    }
  }
}
```

### TypeScript Best Practices

- Avoid `any` - use `unknown` or proper types
- Use `type` for unions/intersections, `interface` for objects
- Use optional chaining (`?.`) and nullish coalescing (`??`)

## File Organization

```
src/
├── index.ts           # Entry point (CLI)
├── types.ts           # Global types
├── tools/             # MCP tool definitions
├── services/          # Business logic (sketchAnalyze)
│   └── assembleNode/  # Style extraction (extractColor, extractFill, etc.)
└── utils/             # Utility functions (logger, treeTransform, mutex)
```

## Testing

- Test files in `src/tests/unit/`
- Test fixtures in `src/tests/fixtures/`
- Use `.test.ts` or `.spec.ts` extension
- Vitest: Node env, 10s timeout, JSON reporter to `test-results/results.json`
- Path aliases: `@` and `@tests`
- Import test helpers from `vitest` (describe, it, expect, beforeAll, vi)

## Working with MCP SDK

- Register tools: `server.registerTool(name, config, callback)`
- Return `CallToolResult` with content array
- Use Zod schemas for `inputSchema`

## Git Hooks

- Uses `simple-git-hooks` + `lint-staged`
- Pre-commit: prettier (all files) + ESLint fix (TypeScript)

## Notes for AI Agents

- Run `pnpm typecheck` and `pnpm lint` before committing
- Use `pnpm build` to verify compilation
- Follow existing code patterns
- Keep functions small and focused
- Add JSDoc comments for exported functions
- Use `@sketch-hq/sketch-file-format-ts` types for Sketch files
