# mcp-sketch

[中文](./README.md) | English

Requires **multi-modal model** (preview image analysis needed). Agents are under iteration — customize prompts and permissions after install

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

Flow: pick artboard → split components → generate skeleton → layout (with routing) → preview → draw

### Scenario 2: Insert into Existing Page

```
Based on design.zip, extract the user info card at the top-right and insert it into /dashboard
```

Flow: pick artboard → split region → component-level layout → draw → insert into target page → preview

## Toolbox

| skill           | Agent            | Description                           |
| --------------- | ---------------- | ------------------------------------- |
| sketch-pick     | sketch-analyzer  | List artboards for selection          |
| sketch-split    | sketch-analyzer  | Analyze artboard, split components    |
| sketch-preview  | sketch-analyzer  | Start dev server and preview          |
| sketch-init     | sketch-architect | Scan project, generate config         |
| sketch-gen-base | sketch-architect | Generate skeleton component code      |
| sketch-layout   | sketch-architect | Configure routing and layout          |
| sketch-draw     | sketch-developer | Draw component from design data       |
| sketch-code     | sketch-developer | Modify/refactor/insert without design |
| sketch-\*-check | sketch-checker   | Review quality at each stage          |

## Environment Variables

Create `.env.sketch` in project root:

| Field            | Required | Default                     | Description            |
| ---------------- | -------- | --------------------------- | ---------------------- |
| `CHROME_PATH`    | yes      | -                           | Chrome executable path |
| `SERVER_COMMAND` | yes      | `npm run dev`               | Dev server command     |
| `CWD`            | no       | cwd                         | Project root           |
| `USER_DATA_DIR`  | no       | `~/.mcp-sketch-chrome-data` | Chrome user data dir   |
| `DEBUG_PORT`     | no       | `9222`                      | Debug port             |

> Disable auto-open browser in dev server config (e.g. Vite `server.open: false`)

## Prerequisites

Preview and screenshot need a background dev server. **Linux / macOS / WSL** requires `tmux`:

```bash
brew install tmux        # macOS
sudo apt install tmux    # Ubuntu/Debian/WSL
```

None needed on Windows

## Tools

> Run `npx -y mcp-sketch <cmd> --help` for full options

- **list** `[-f <path>]` — list artboards
- **analyze** `-f <path> [--pn <page>] [--an <artboard>] [-r <rect>] [-e <rects>] [--ap <path>] [-l <n>] [-o <n>]` — parse layers/styles/assets
- **preview** `-u <url>` — open browser preview, auto-start dev server
- **screenshot** `-f <path> --pn <page> --an <artboard> -u <url>` — capture screenshot for visual comparison
- **state** `-f <path> --pn <page> --an <artboard> -c '<yaml>' [-r]` — manage artboard state

Assets output: `src/assets/sketch/`, preview images: `.sketch-cache/artboards/{design_file_name}/` (webp)

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
