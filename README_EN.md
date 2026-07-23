# mcp-sketch

[中文](./README.md) | English

Requires **multi-modal model** (preview image analysis needed). Agents are under iteration — customize prompts and permissions after install

> **CodeGraph recommended**: sketch uses the `codegraph_explore` MCP tool to query project code structure. Configure a CodeGraph MCP service in your AI platform for better project context understanding. Falls back to Grep/Read automatically when CodeGraph is unavailable.

## Installation

```bash
npx -y mcp-sketch install
```

Select your AI platform:

| Platform        | Agents Directory    | Skills Directory    |
| --------------- | ------------------- | ------------------- |
| **Claude Code** | `.claude/agents/`   | `.claude/skills/`   |
| **OpenCode**    | `.opencode/agents/` | `.opencode/skills/` |

## Usage

### Switch to Leader

- **OpenCode**: Press `TAB` after startup to switch to `sketch-leader`
- **Claude Code**: `claude --agent sketch-leader`

### Scenario 1: Create a New Page

```
Based on design.zip, create a login page
```

Flow: pick → split → gen-base → layout → preview → draw → draw-check

### Scenario 2: Insert into Existing Page

Precision reduces LLM inference errors and rework. Choose the level of detail you have:

```
Based on design.zip, extract the bottom-right region (rect[220,340,180,120]) of the eWallet artboard as an asset card and insert it into the overview area of /assets page (inside .overview-content of src/views/assets/AssetsOverview.vue)
```

```
Based on design.zip, extract the user info card and insert it into /dashboard page
```

Provide what you know: design file → artboard name → region coordinates → target page route or component path → insertion context.

Flow: pick → split (insert mode) → gen-base → insert-layout → preview → draw → draw-check

## Toolbox

| skill                | Agent            | Description                                         |
| -------------------- | ---------------- | --------------------------------------------------- |
| sketch-pick          | sketch-analyzer  | List artboards for selection                        |
| sketch-split         | sketch-analyzer  | Analyze artboard, split components                  |
| sketch-preview       | sketch-analyzer  | Start dev server and preview                        |
| sketch-init          | sketch-architect | Scan project, generate config                       |
| sketch-gen-base      | sketch-architect | Generate skeleton component code                    |
| sketch-layout        | sketch-architect | Configure routing and layout                        |
| sketch-insert-layout | sketch-architect | Layout section components & insert into target page |
| sketch-draw          | sketch-developer | Draw component from design data                     |
| sketch-code          | sketch-developer | Modify/refactor/insert without design               |
| sketch-\*-check      | sketch-checker   | Review quality at each stage                        |

## State Management

State file: `.sketch-cache/artboards/{design_file_name}/{page_name}/{artboard_name}/progress.json`

Component state chain: `split-done → split-check-done → gen-base-done → gen-base-check-done → layout-done → layout-check-done → draw-done → draw-check-done`

## Environment Variables

Create `.env.sketch` in project root:

| Field            | Required | Default                     | Description            |
| ---------------- | -------- | --------------------------- | ---------------------- |
| `CHROME_PATH`    | yes      | -                           | Chrome executable path |
| `SERVER_COMMAND` | yes      | `npm run dev`               | Dev server command     |
| `CWD`            | no       | cwd                         | Project root           |
| `USER_DATA_DIR`  | no       | `~/.mcp-sketch-chrome-data` | Chrome user data dir   |
| `DEBUG_PORT`     | no       | `9222`                      | Debug port             |
| `ASSETS_PATH`    | no       | `src/assets/sketch`         | Slice output path      |

> Disable auto-open browser in dev server config (e.g. Vite `server.open: false`)
> **Linux / macOS / WSL** requires `tmux`: `brew install tmux`(macOS) / `sudo apt install tmux`(Ubuntu/Debian/WSL). None needed on Windows

## Tools

> Run `npx -y mcp-sketch <cmd> --help` for full options

- **list** `[-f <path>]` — list artboards
- **analyze** `-f <path> [--pn <page>] [--an <artboard>] [-r <rect>] [-e <rects>] [-l <n>] [-o <n>]` — parse layers/styles/assets
- **preview** `-f <path> --pn <page> --an <artboard> -u <url>` — open browser preview, auto-start dev server, auto-execute previewActions
- **screenshot** `-f <path> --pn <page> --an <artboard> -u <url>` — capture screenshot for visual comparison, auto-scroll lazy load + execute previewActions
- **state** `-f <path> --pn <page> --an <artboard> -c '<yaml>' [-r]` — manage artboard state

Assets output: `src/assets/sketch/`, preview images: `.sketch-cache/artboards/{design_file_name}/{page_name}/{artboard_name}/` (webp)

## MCP Configuration

Set `MCP_MODE=1` to enable MCP mode:

- **opencode**

```json
{
  "mcp": {
    "mcp-sketch": {
      "type": "local",
      "command": ["npx", "-y", "mcp-sketch"],
      "enabled": true,
      "environment": { "MCP_MODE": "1" }
    }
  }
}
```

- **claude code**

```json
{
  "mcpServers": {
    "mcp-sketch": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-sketch"],
      "env": { "MCP_MODE": "1" }
    }
  }
}
```

## Demo

<img width="359" height="438" alt="example" src="https://github.com/user-attachments/assets/ab7ba022-0cde-4c95-a060-c8f3adae035e" />
