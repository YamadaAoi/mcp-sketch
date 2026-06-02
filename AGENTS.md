# AGENTS.md — Agent Coding Guidelines

## Project

MCP server + CLI for analyzing Sketch-Meaxure exported HTML archives (zip or folder).
TypeScript (ESM, ES2022, Node.js 18+). pnpm. Vite SSR → single ESM output `dist/index.js`.
Package bin: `mcp-sketch` (from `"bin": "dist/index.js"`).

## Commands

| Command                                                         | Note                                              |
| --------------------------------------------------------------- | ------------------------------------------------- |
| `pnpm build`                                                    | `vite build` + `tsc --noEmit` (type errors fail)  |
| `pnpm dev`                                                      | Build + start CLI                                 |
| `pnpm start`                                                    | `node dist/index.js` (already built)              |
| `pnpm watch`                                                    | `vite build --watch` (rebuild on source change)   |
| `pnpm typecheck`                                                | `tsc --noEmit`                                    |
| `pnpm lint`                                                     | ESLint (excludes dist/, \*.js, src/tests/\*\*)    |
| `pnpm lint:fix`                                                 | ESLint with `--fix`                               |
| `pnpm format` / `pnpm format:check`                             | Prettier write/check on `src/**/*.ts`             |
| `pnpm test`                                                     | Vitest (watch:false, JSON output → test-results/) |
| `pnpm test:watch`                                               | Vitest watch mode                                 |
| `pnpm vitest run src/tests/unit/sketchHtmlAnalyze.real.test.ts` | Single test (use full path to file)               |
| `pnpm csadd` → `pnpm csver` → `pnpm release`                    | Changesets: add → version → build+publish         |

## Architecture

- **Entry** (`src/index.ts`): loads `.env` via `dotenv/config`, then checks `MCP_MODE` env var to dispatch between CLI (`src/cli.ts`) and MCP (`src/mcp.ts`)
- **CLI** (`src/cli.ts`): commander-based, 3 subcommands via `src/commands/` (thin wrappers, delegate to services)
- **MCP tools** (`src/tools/index.ts`): `sketch_html_list`, `sketch_html_plan`, `sketch_html_analyze`
- **Services** (`src/services/`): `sketchHtmlList/`, `sketchHtmlPlan/`, `sketchHtmlAnalyze/` — real logic. `filterArtboards` shared from `sketchHtmlAnalyze/filterArtboards`.
- **Utils** (`src/utils/`): zip/folder handling (`unzipper` for zip, `fs` for folders, `@babel/parser` for AST extraction), image processing (`sharp` optional), pino logger, file saving
- **Skills** (`skills/`): 4 bundled skills (`sketch-init`, `sketch-split`, `sketch-draw`, `sketch-workflow`) for AI workflow orchestration via `npx skills@latest`
- **opencode.json**: `webfetch` allowed, watcher ignores `node_modules/**`, `dist/**`, `.git/**`, `mock/**`

## Conventions

- Path alias: `@/*` → `./src/*`. Vitest also has `@tests/*` → `./src/tests/*`
- Zod v4: import from `'zod/v4'` (not `'zod'`)
- pino writes to stderr (stdout reserved for MCP JSON-RPC)
- Comments are in Chinese (intentional — do not translate)
- Prettier: no semi, single quotes, trailingComma none, arrowParens avoid, printWidth 80
- `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` — use `import type` for type-only imports, prefix unused params with `_` (enforced by ESLint `argsIgnorePattern: '^_'`)
- Pre-commit via `simple-git-hooks`: `lint-staged` runs prettier on all files, eslint --fix on `*.{ts,tsx,vue}`
- `CHANGELOG.md` is changesets-managed — do not edit manually. Changeset config: `commit: false`, `baseBranch: main`
- `__VERSION__` is a Vite `define` (from `package.json`), declared in `src/global.d.ts`

## Testing

- Only test file: `src/tests/unit/sketchHtmlAnalyze.real.test.ts` — `.real` suffix means it needs a real Sketch-Meaxure fixture (zip)
- Fixture: `src/tests/fixtures/登录 2html.zip` — **not in repo**; tests fail without one
- `tsconfig.json` and `eslint.config.js` both exclude `src/tests/**`
- Vitest outputs JSON to `test-results/results.json` (in .gitignore)

## Gotchas

- `sharp` is optional (`optionalDependencies`) — if libvips fails to install, preview falls back to the original full image
- `.env` sets `LOG_LEVEL=debug` by default (loaded automatically at startup via `dotenv/config`)
- `pnpm build` blocks on type errors (runs `tsc --noEmit` after vite build)
- No CI workflows in this repo (no `.github/` directory)
