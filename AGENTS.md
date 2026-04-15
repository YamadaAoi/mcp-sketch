# AGENTS.md - Agent Coding Guidelines

Quick reference for AI agents in this repo. See `opencode.json` for OpenCode-specific config.

## Project

- **Type**: MCP server + CLI for analyzing Sketch exported HTML zip archives
- **Lang**: TypeScript (ESM, Node.js 18+, target ES2022)
- **Pkg**: pnpm | **Build**: Vite (SSR mode, single output `dist/index.js`)
- **Bins**: `sketch-cli` (CLI), `mcp-sketch` (MCP via stdio)

## Commands

| Command                                      | Note                                 |
| -------------------------------------------- | ------------------------------------ |
| `pnpm build`                                 | vite build + tsc --noEmit            |
| `pnpm dev`                                   | Build + start CLI server             |
| `pnpm typecheck && pnpm lint`                | Pre-commit checks                    |
| `pnpm vitest run`                            | Run tests once (non-interactive, CI) |
| `pnpm test`                                  | Interactive watch mode (default)     |
| `pnpm vitest run src/tests/unit/foo.test.ts` | Single test file                     |

## Architecture

- **Entry**: `src/index.ts` → detects `MCP_MODE` env var to switch between CLI (`src/cli.ts`) and MCP (`src/mcp.ts`)
- **Tools**: `src/tools/index.ts` exports `RegisterToolParams[]` array
- **Services**: `src/services/sketchHtmlAnalyze/` contains business logic
- **Tests**: `src/tests/unit/*.test.ts`, fixtures in `src/tests/fixtures/`

## Key Conventions

- Path alias: `@/*` → `./src/*`
- Zod v4: import from `'zod/v4'` (not `'zod'`)
- Logs to stderr (stdout reserved for MCP protocol)
- Code comments in Chinese (intentional)

## Build & Release

- Pre-commit: `simple-git-hooks` + `lint-staged` (prettier all, eslint fix \*.ts)
- Release: `pnpm csadd` → `pnpm csver` → `pnpm release` (Changesets)

## Dependencies

- MCP SDK: `@modelcontextprotocol/sdk`
- HTML parsing: `cheerio`
- ZIP handling: `unzipper`
- Sketch types: `@sketch-hq/sketch-file-format-ts`
