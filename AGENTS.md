# AGENTS.md - Agent Coding Guidelines

Quick reference for AI agents in this repo. See `opencode.json` for OpenCode-specific config.

## Project

- **Type**: MCP server + CLI for analyzing Sketch-Meaxure exported HTML zip archives
- **Lang**: TypeScript (ESM, ES2022, Node.js 18+)
- **Pkg**: pnpm | **Build**: Vite SSR → single ESM output `dist/index.js`
- **Bins**: `mcp-sketch` (npm package), `sketch-cli` (package.json bin)

## Commands

| Command                                                         | Note                                      |
| --------------------------------------------------------------- | ----------------------------------------- |
| `pnpm build`                                                    | Vite build + `tsc --noEmit`               |
| `pnpm dev`                                                      | Build + start CLI                         |
| `pnpm typecheck`                                                | `tsc --noEmit`                            |
| `pnpm lint`                                                     | ESLint (excludes `src/tests/**`, `*.js`)  |
| `pnpm format` / `format:check`                                  | Prettier write/check on `src/**/*.ts`     |
| `pnpm test`                                                     | Vitest single run (watch:false in config) |
| `pnpm test:watch`                                               | Vitest watch mode                         |
| `pnpm vitest run src/tests/unit/sketchHtmlAnalyze.real.test.ts` | Single test file                          |
| `pnpm csadd` → `pnpm csver` → `pnpm release`                    | Changesets release flow                   |

## Architecture

- **Entry**: `src/index.ts` → detects `MCP_MODE` env var to switch between CLI (`src/cli.ts`) and MCP (`src/mcp.ts`)
- **CLI subcommands** (commander): `analyze` (full parse) and `plan` (preview + metadata)
- **MCP tools** (both in `src/tools/index.ts`): `sketch_html_analyze` and `sketch_html_plan`
- **Services**: `src/services/sketchHtmlAnalyze/` (full analysis) and `src/services/sketchHtmlPlan/` (lightweight plan). `filterArtboards` is shared from `sketchHtmlAnalyze`.
- **Utils**: `src/utils/` — zip handling, image processing (sharp, optional), pino logger, file saving

## Key Conventions

- Path alias: `@/*` → `./src/*` (also `@tests/*` for vitest)
- Zod v4: import from `'zod/v4'` (not `'zod'`)
- Logs to stderr via pino (stdout reserved for MCP JSON-RPC)
- Code comments in Chinese (intentional)
- Prettier: no semi, single quotes, trailingComma none, arrowParens avoid, printWidth 80
- Pre-commit: `lint-staged` (prettier all, eslint --fix on `*.ts`)

## Testing Quirks

- Single test file: `src/tests/unit/sketchHtmlAnalyze.real.test.ts` — the `.real` suffix signals it requires a real Sketch-Meaxure zip fixture
- Fixture expected at `src/tests/fixtures/登录 2html.zip` — **not included in the repo**; tests will fail without it
- `tsconfig.json` excludes `src/tests/**` from typecheck; `eslint.config.js` also excludes test files

## Gotchas

- `sharp` is an optional dependency — if it fails to install (libvips), image processing falls back to the original full image
- `pnpm build` runs both vite build and `tsc --noEmit`; type errors block the build
- `.env` file sets `LOG_LEVEL=debug` by default
