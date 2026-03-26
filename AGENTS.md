# AGENTS.md - Agent Coding Guidelines

Guidelines for AI agents working in this repository.

## Project Overview

- **Name**: mcp-sketch
- **Type**: Local MCP server for parsing Sketch exported HTML zip archives
- **Language**: TypeScript (ESM, Node.js 18+)
- **Package Manager**: pnpm
- **Bundler**: Vite

## Commands

```bash
pnpm build          # Build production bundle (vite build + tsc --noEmit)
pnpm dev            # Build + start server
pnpm watch          # Vite watch mode
pnpm typecheck      # Type checking only
pnpm lint           # ESLint
pnpm lint:fix       # ESLint with auto-fix
pnpm format         # Prettier write
pnpm format:check   # Prettier check
pnpm test           # Run tests (vitest)
pnpm test:watch     # Tests in watch mode
```

### Running a Single Test

```bash
pnpm vitest run src/tests/unit/sketchAnalyze.test.ts
pnpm vitest run --grep "pattern"
```

## Code Style

### Formatting (Prettier)

- 2 spaces, no tabs
- Single quotes, no semicolons
- No trailing commas
- 80 char line width
- `arrowParens: 'avoid'` (e.g., `x => x` not `(x) => x`)

### TypeScript

- Strict mode, ESM only (no CommonJS)
- `verbatimModuleSyntax` enabled - use `import type` for type-only imports
- Avoid `any` - use `unknown` or proper types
- `type` for unions/intersections, `interface` for objects

### Naming

- Files: kebab-case (`extract-color.ts`)
- Functions/variables: camelCase
- Interfaces/types: PascalCase (`LayerFill`)
- Constants: UPPER_SNAKE_CASE or camelCase (`defaultTimeout`)

### Imports

- Path alias: `@/*` → `./src/*`, `@tests` → `./src/tests`
- Group: external → internal → types
- Add `.js` extension for external package imports

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AnySchema } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { logger } from '@/utils/logger'
import type { RegisterToolParams } from '@/types'
```

### Error Handling

- Zod for input validation (via MCP SDK)
- `logger.error()`/`logger.debug()` for logging (pino, outputs to stderr)
- Return string error messages from services, catch in tool layer
- Services use try-catch, format errors as `"error: message"`

```typescript
try {
  // service logic
} catch (error) {
  response = `Error: ${error instanceof Error ? error.message : 'unknown error'}`
}
```

### Lint Rules (ESLint)

- `@typescript-eslint/no-unused-vars`: error (ignore `^_`)
- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/no-floating-promises`: warn
- `@typescript-eslint/no-misused-promises`: warn

## File Organization

```
src/
├── index.ts                  # Entry point (CLI, shebang)
├── types.ts                  # Zod schemas + types
├── global.d.ts               # Global declarations (__VERSION__)
├── tools/
│   ├── index.ts              # Tool registry (exports RegisterToolParams[])
│   └── sketchHtmlAnalyze/    # Tool implementation
├── services/
│   └── sketchHtmlAnalyze/    # Business logic
│       ├── index.ts          # Main handler
│       ├── filterArtboards/
│       └── assembleArtboard/
├── utils/
│   ├── logger.ts             # Pino → stderr
│   ├── zip.ts                # ZIP extraction
│   ├── saveFile.ts           # File output
│   └── ...
└── tests/
    ├── unit/                 # *.test.ts files
    └── fixtures/             # Test data (sketch/zip files)
```

## Testing (Vitest)

- Files: `src/tests/unit/*.test.ts`
- Fixtures: `src/tests/fixtures/`
- Config: node env, 10s timeout, threads pool
- JSON reporter → `test-results/results.json`
- Import from `vitest`: `describe`, `it`, `expect`, `beforeAll`, `vi`

## MCP SDK Patterns

- Register tools via `server.registerTool(name, config, callback)`
- Tool factory returns `RegisterToolParams` tuple: `[name, config, callback]`
- Use Zod schemas for `inputSchema`
- Return `CallToolResult` with `content: [{ type: 'text', text }]`

## Git Hooks & Release

- `simple-git-hooks` + `lint-staged`
- Pre-commit: prettier (all) + eslint fix (\*.ts)
- Release: `pnpm csadd` → `pnpm csver` → `pnpm release` (Changesets)

## Notes

- Run `pnpm typecheck && pnpm lint` before committing
- Run `pnpm build` to verify compilation
- Logs go to stderr (stdout is reserved for MCP protocol)
- Code comments are in Chinese - this is intentional
- Use `@sketch-hq/sketch-file-format-ts` types for Sketch file format
- `cheerio` for HTML parsing, `unzipper` for ZIP handling
