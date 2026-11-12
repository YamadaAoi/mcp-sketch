## Hard Rules

- **Never guess the tech stack**: judge from the dependencies in `package.json`
- **Never guess the code style**: judge from config files (.prettierrc, .eslintrc, etc.) and existing code
- **Never guess the project structure**: judge from the existing directory tree
- **Don't read irrelevant files**: e.g. zip, rar and other files unrelated to project code; never extract or read them

## 1. Identify the tech stack

Read `package.json` at the root and in each package, and analyze `dependencies` and `devDependencies`:

- **Base framework**: React / Vue / Angular, etc.
- **Core libraries**:
  - State management (Redux / Pinia, etc.)
  - HTTP requests (Axios / Fetch, etc.)
- **Build tooling**: Vite / Rollup, etc.
- **TypeScript version**

Read `package.json` at the root and in each package, and check UI-related dependencies:

- **Public component libraries** (Element Plus, Ant Design, Naive UI, etc.): LLMs have seen plenty of these; just note the library name and version, no need to enumerate components
- **Private / unknown component libraries**: scan the entry of `node_modules/{lib}/` to learn the available components
- **Determine the import convention**: check import statements in existing component files — named imports usually look like `import { Button } from 'xxx'` or come from an `unplugin-auto-import` config; full imports usually look like `import XXX from 'xxx'` followed by global registration/mounting at the entry

## 2. Identify code style and conventions

- Read `.prettierrc`, `.editorconfig`, etc., and summarize indentation, quotes, and semicolon rules
- Read `eslint.config.*`, `tsconfig.json`, `stylelint.config`, etc., and summarize naming restrictions, strictness, etc.
- Determine the component naming convention; if naming is inconsistent in the project, prefer **PascalCase** with **at least two words**
- Determine the component authoring convention
  - vue: the order of `template`, `script`, `style` tags; whether the `setup` sugar is used
  - react: function components, class components, hooks, etc.
  - angular: class components, decorators, etc.
  - other frameworks: judge from the actual code

## 3. Summarize the key information into `AGENTS.md`, written in English

The summary written into `AGENTS.md` must be **in English**, covering the tech stack, code style, project structure, and the sketch-related configurations checked below

## 4. Check the `.env.sketch` configuration

Check whether `.env.sketch` (the mcp-sketch config file, optional) exists in the project root:

- **Exists**: read it and verify that key variables like `SERVER_COMMAND` match the project reality (e.g. the command can be found in the `scripts` of `package.json`); point out mismatches to the user
- **Missing**: propose a suggested configuration based on the project (package manager, start script in `scripts`, dev server URL, asset output conventions), and **ask the user for permission before creating it**; never create the file on your own

Configurable variables:

| Variable          | Required | Default             | Description                                    |
| ----------------- | -------- | ------------------- | ---------------------------------------------- |
| `SERVER_COMMAND`  | No       | `npm run dev`       | Command that starts the dev server             |
| `PREVIEW_URL`     | No       | -                   | Dev server URL; required to use the `dev` tool |
| `CWD`             | No       | Current directory   | Project root                                   |
| `ASSETS_PATH`     | No       | `src/assets/sketch` | Asset output path                              |
| `DESIGN_MEMO_MAX` | No       | `8`                 | In-process cache limit for design parsing      |
| `LOG_LEVEL`       | No       | `info`              | Log level                                      |

## 5. Check the browser automation MCP configuration

Check whether a browser automation MCP (e.g. Playwright; the screenshot-compare workflow depends on it to explore rendered results and take screenshots) is already configured in the current AI client's project-level MCP config:

- **Configured**: skip
- **Not configured**: explain the purpose, **ask the user for permission before adding it on their behalf, then configure it the way the current AI client requires**
- A session restart is usually required for the configuration to take effect; remind the user
