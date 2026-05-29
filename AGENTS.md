# AGENTS.md — Agent Coding Guidelines

## Project

MCP server + CLI for analyzing Sketch-Meaxure exported HTML zip archives.
TypeScript (ESM, ES2022, Node.js 18+). pnpm. Vite SSR → single ESM output `dist/index.js`.
Package bin: `mcp-sketch` (from `"bin": "dist/index.js"`).

## Commands

| Command                                      | Note                                                    |
| -------------------------------------------- | ------------------------------------------------------- |
| `pnpm build`                                 | Vite build + `tsc --noEmit` (type errors block build)   |
| `pnpm dev`                                   | Build + start CLI                                       |
| `pnpm typecheck`                             | `tsc --noEmit`                                          |
| `pnpm lint`                                  | ESLint (excludes `src/tests/**`, `*.js`)                |
| `pnpm format` / `format:check`               | Prettier write/check on `src/**/*.ts`                   |
| `pnpm test`                                  | Vitest single run (watch:false in config)               |
| `pnpm test:watch`                            | Vitest watch mode                                       |
| `pnpm vitest run src/tests/unit/...`         | Single test file (use full path)                        |
| `pnpm csadd` → `pnpm csver` → `pnpm release` | Changesets release flow (add → version → build+publish) |

## Architecture

- **Entry**: `src/index.ts` — detects `MCP_MODE` env var to switch between CLI (`src/cli.ts`) and MCP (`src/mcp.ts`)
- **CLI** (`src/cli.ts`): commander-based, 3 subcommands via `src/commands/` (thin wrappers, delegate to services)
- **MCP tools** (`src/tools/index.ts`): `sketch_html_list`, `sketch_html_plan`, `sketch_html_analyze`
- **Services** (`src/services/`): `sketchHtmlList/`, `sketchHtmlPlan/`, `sketchHtmlAnalyze/` — real logic. `filterArtboards` is shared from `sketchHtmlAnalyze`.
- **Utils** (`src/utils/`): zip handling, image processing (sharp, optional), pino logger, file saving
- **Skills** (`skills/`): 4 bundled skills (`sketch-init`, `sketch-split`, `sketch-draw`, `sketch-workflow`) for AI workflow orchestration via `npx skills@latest`

## Conventions

- Path alias: `@/*` → `./src/*`. Vitest also has `@tests/*` → `./src/tests/*`
- Zod v4: import from `'zod/v4'` (not `'zod'`)
- pino writes to stderr (stdout reserved for MCP JSON-RPC)
- Comments in Chinese (intentional)
- Prettier: no semi, single quotes, trailingComma none, arrowParens avoid, printWidth 80
- `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` — use `import type` for type-only imports, prefix unused params with `_`
- ESLint `@typescript-eslint/no-unused-vars` `argsIgnorePattern: '^_'`
- Pre-commit: `lint-staged` (prettier all, eslint --fix on `*.ts`)
- `CHANGELOG.md` is changesets-managed — do not edit manually
- `__VERSION__` is a Vite `define` (from `package.json`), declared in `src/global.d.ts`

## Testing

- Single test file: `src/tests/unit/sketchHtmlAnalyze.real.test.ts` — the `.real` suffix means it needs a real Sketch-Meaxure zip fixture
- Fixture: `src/tests/fixtures/登录 2html.zip` — **not in repo**; tests fail without one
- `tsconfig.json` and `eslint.config.js` both exclude `src/tests/**`

## Gotchas

- `sharp` is optional — if libvips fails to install, image processing falls back to original full image
- `.env` sets `LOG_LEVEL=debug` by default
- `pnpm build` blocks on type errors (runs `tsc --noEmit` after vite)
