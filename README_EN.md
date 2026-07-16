# mcp-sketch

[中文](./README.md) | English

Requires **multi-modal model** (preview image analysis needed). Agents are under iteration — customize prompts and permissions after install

## Installation

```bash
npx -y mcp-sketch install
```

Select your AI platform, files are written to:

| Platform        | Agents Directory    | Skills Directory    |
| --------------- | ------------------- | ------------------- |
| **Claude Code** | `.claude/agents/`   | `.claude/skills/`   |
| **OpenCode**    | `.opencode/agents/` | `.opencode/skills/` |

Structure:

- `sketch-leader` — main agent
- `sketch-initializer` / `sketch-analyzer` / `sketch-architect` / `sketch-developer` / `sketch-checker` — sub-agents
- `sketch-pick` / `sketch-split` / `sketch-gen-base` / `sketch-layout` / `sketch-preview` / `sketch-draw` / `sketch-screenshot-check` / `*check` — skills

## Usage

**New flow**: Tell leader the page to implement; it runs the workflow automatically, pausing after layout for your preview

**Fix mode**: Tell leader what's wrong (e.g. "spacing too large"); it analyzes and dispatches the right sub-agent

### Switch to Leader

- **OpenCode**: Press `TAB` after startup to switch to `sketch-leader`
- **Claude Code**: `claude --agent sketch-leader`

### Workflow

| Phase             | Sub-agent          | Skill                   | Parallel |
| ----------------- | ------------------ | ----------------------- | -------- |
| Initialize        | sketch-initializer | -                       | ❌       |
| Init Review       | sketch-checker     | sketch-init-check       | ❌       |
| Pick Artboard     | sketch-analyzer    | sketch-pick             | ❌       |
| Split             | sketch-analyzer    | sketch-split            | ❌       |
| Split Review      | sketch-checker     | sketch-split-check      | ❌       |
| Show Result, Wait | -                  | -                       | ❌       |
| Gen Base          | sketch-architect   | sketch-gen-base         | ✅       |
| Base Review       | sketch-checker     | sketch-gen-base-check   | ✅       |
| Layout            | sketch-architect   | sketch-layout           | ❌       |
| Layout Review     | sketch-checker     | sketch-layout-check     | ❌       |
| Preview           | sketch-analyzer    | sketch-preview          | ❌       |
| Draw              | sketch-developer   | sketch-draw             | ✅       |
| Draw Review       | sketch-checker     | sketch-draw-check       | ✅       |
| Screenshot        | sketch-checker     | sketch-screenshot-check | ❌       |

### State Files

`.sketch-cache/artboards/{design_file_name}/{page_name}-{artboard_name}.json`, managed via `mcp-sketch state`. Resumable on interrupt

### Environment Variables

Create `.env.sketch` in project root:

| Field            | Required | Default                     | Description            |
| ---------------- | -------- | --------------------------- | ---------------------- |
| `CHROME_PATH`    | yes      | -                           | Chrome executable path |
| `SERVER_COMMAND` | yes      | `npm run dev`               | Dev server command     |
| `CWD`            | no       | cwd                         | Project root           |
| `USER_DATA_DIR`  | no       | `~/.mcp-sketch-chrome-data` | Chrome user data dir   |
| `DEBUG_PORT`     | no       | `9222`                      | Debug port             |

> **Tip**: Disable auto-open browser in dev server config (e.g. Vite `server.open: false`)

### Prerequisites

Preview and screenshot need a background dev server. **Linux / macOS / WSL** requires `tmux`:

```bash
brew install tmux        # macOS
sudo apt install tmux    # Ubuntu/Debian/WSL
```

None needed on Windows

## Tools

> Run `npx -y mcp-sketch <cmd> --help` for full options

- **list** `[-f <path>]` — list artboards `[{pageName, artboardName, previewPath}]`
- **analyze** `-f <path> [--pn <page>] [--an <artboard>] [-r <rect>] [-e <rects>] [--ap <path>] [-l <n>] [-o <n>]` — parse layers/styles/assets, output JSON + preview
- **preview** `-u <url>` — open browser to URL, auto-start dev server
- **screenshot** `-f <path> --pn <page> --an <artboard> -u <url>` — save screenshot for visual comparison
- **state** `-f <path> --pn <page> --an <artboard> -c '<yaml>' [-r]` — create/update artboard state. YAML: wrap with `"`, single quotes for values, space after colon

Output: assets in `src/assets/sketch/`, preview images in `.sketch-cache/artboards/{design_file_name}/` (webp)

## MCP Configuration

Set `MCP_MODE=1` environment variable to enable MCP mode, configure as a local MCP service:

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
