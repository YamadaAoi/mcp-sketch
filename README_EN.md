# mcp-sketch

[中文](./README.md) | English

## Disclaimer

- Use **multi-modal models** — the `sketch-*` workflow requires analyzing preview images

## Agents

> **Note**: Agents are under continuous iteration and improvement. LLMs are unpredictable. After installation, feel free to customize prompt content and tool permissions to fit your project's specific needs

> Currently only Claude Code and OpenCode are supported for one-click installation. Other tools that are compatible with the `.claude` directory structure can choose to install as Claude Code

### Installation

Install agents into your project with a single CLI command:

```bash
npx -y mcp-sketch install
```

Interactively select your AI tool platform, and files are automatically written to the corresponding directories:

| Platform        | Agents Directory    | Skills Directory    |
| --------------- | ------------------- | ------------------- |
| **Claude Code** | `.claude/agents/`   | `.claude/skills/`   |
| **OpenCode**    | `.opencode/agents/` | `.opencode/skills/` |

Installed file structure:

```
{agents}/
├── sketch-leader.md         ← Main agent: Frontend Leader
├── sketch-initializer.md    ← Sub-agent: Project Architect
├── sketch-analyzer.md       ← Sub-agent: Analyst (pick/split/preview)
├── sketch-architect.md      ← Sub-agent: Architect (gen-base/layout)
├── sketch-developer.md      ← Sub-agent: Developer (draw)
└── sketch-checker.md        ← Sub-agent: QA Engineer (all checks)

{skills}/
├── sketch-pick/             ← Pick artboard
├── sketch-split/            ← Split components
├── sketch-split-check/      ← Review split
├── sketch-gen-base/         ← Generate base components
├── sketch-gen-base-check/   ← Review base components
├── sketch-layout/           ← Layout components
├── sketch-layout-check/     ← Review layout
├── sketch-preview/          ← Preview layout
├── sketch-draw/             ← Draw component features
├── sketch-draw-check/       ← Review drawing
├── sketch-screenshot-check/ ← Screenshot comparison
└── sketch-init-check/       ← Review project init
```

### Leader Architecture

sketch-leader is the **main agent** — you talk to it directly. It analyzes requirements, dispatches sub-agents, and reviews results

### Switch to Leader

**OpenCode**:

- After starting `opencode`, press `TAB` to switch to `sketch-leader`

**Claude Code**:

- Specify the agent when starting `claude`

```
claude --agent sketch-leader
```

After switching, all your messages are sent to sketch-leader, which dispatches sub-agents to complete the work

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

### Usage

**New flow**: Tell leader what page you want to implement. It automatically executes the workflow, pausing after layout for you to preview and confirm

**Fix mode**: Tell leader what's wrong (e.g. "spacing too large", "color is off"). It analyzes the issue and dispatches the right sub-agent to fix it

**Problem type judgment**:

| Problem                       | Who to call     |
| ----------------------------- | --------------- |
| Poor component split          | sketch-split    |
| Inter-component layout issues | sketch-layout   |
| Intra-component layout/styles | sketch-draw     |
| Base component code issues    | sketch-gen-base |

### State Files

- Project config: `.sketch-cache/proj-init.md`
- Artboard state: `.sketch-cache/artboards/{page_name}-{artboard_name}.json`

Leader manages state files via `mcp-sketch state` CLI. Resume from where you left off if interrupted. All file paths use relative paths

### Environment Variables

Create a `.sketch.env` file in the project root to configure Chrome path, project start command, etc.:

| Field            | Type   | Required | Default                     | Description                     |
| ---------------- | ------ | -------- | --------------------------- | ------------------------------- |
| `CHROME_PATH`    | string | yes      | -                           | Path to Chrome executable       |
| `SERVER_COMMAND` | string | yes      | `npm run dev`               | Command to start the dev server |
| `CWD`            | string | no       | current working directory   | Project root directory path     |
| `USER_DATA_DIR`  | string | no       | `~/.mcp-sketch-chrome-data` | Chrome user data directory      |
| `DEBUG_PORT`     | number | no       | `9222`                      | Chrome remote debugging port    |

Example:

```
CHROME_PATH=/usr/bin/google-chrome
SERVER_COMMAND=pnpm dev
```

> **Tip**: When configuring the dev server, disable auto-open browser to prevent new tabs from popping up on every start. For Vite projects, set `server.open: false`

### Prerequisites

Preview and screenshot features need to start the local dev server in the background. **Linux / macOS / WSL** environments depend on `tmux` to manage background terminal sessions. Make sure it's installed:

```bash
# macOS
brew install tmux

# Ubuntu / Debian / WSL (Ubuntu/Debian)
sudo apt install tmux

```

Windows users don't need any additional installation

## Tools

> The following are low-level tools, available for Agent use or standalone use

### list

Returns basic info for all artboards (page name, artboard name, preview path)

CLI: `npx -y mcp-sketch list [options]`
MCP: `sketch_html_list`

| Parameter | CLI Flag                 | MCP Parameter | Required | Description   |
| --------- | ------------------------ | ------------- | -------- | ------------- |
| file path | `-f, --file_path <PATH>` | file_path     | yes      | zip or folder |

Example: `npx -y mcp-sketch list -f /path/to/export.zip`

Returns: `[{ pageName, artboardName, previewPath }]`

### analyze

Full parse: extract layer structure, styles, assets, output design JSON + preview image

CLI: `npx -y mcp-sketch analyze [options]`
MCP: `sketch_html_analyze`

| Parameter     | CLI Flag                 | MCP Parameter | Required | Description                                          |
| ------------- | ------------------------ | ------------- | -------- | ---------------------------------------------------- |
| file path     | `-f, --file_path <PATH>` | file_path     | yes      | zip or folder                                        |
| page name     | `--pn, --page_name`      | page_name     | no       |                                                      |
| artboard name | `--an, --artboard_name`  | artboard_name | no       |                                                      |
| rect          | `-r, --rect`             | rect          | no       | `[x, y, width, height]`                              |
| exclude rects | `-e, --exclude_rects`    | exclude_rects | no       | `[[x, y, width, height], ...]`                       |
| assets path   | `--ap, --assets_path`    | assets_path   | no       | default `src/assets/sketch`                          |
| limit         | `-l, --limit`            | limit         | no       | number of layers to return                           |
| offset        | `-o, --offset`           | offset        | no       | starting index (default 0)                           |
| save result   | `--sr, --save_result`    | save_result   | no       | save JSON into `{input}.cache/` dir, default `false` |

Example: `npx -y mcp-sketch analyze -f /path/to/export.zip --pn Home --an "User Management" -r "[0,0,1920,64]" --limit 20`

Returns: `{ artboard: { layers, styles, images, etc. }, previewPath: "preview image path" }`

Preview uses `sharp` (optionalDependency). If `sharp` fails to install (libvips issue), the original full artboard image is returned. If installed, the image is resized, cropped to `rect` (if specified), and compressed to webp

### preview

Open a browser to visit the specified URL (auto-starts the local dev server and waits for it to be ready)

CLI: `npx -y mcp-sketch preview [options]`
MCP: `sketch_html_preview`

| Parameter | CLI Flag          | MCP Parameter | Required | Description |
| --------- | ----------------- | ------------- | -------- | ----------- |
| URL       | `-u, --url <URL>` | url           | yes      | Preview URL |

Example: `npx -y mcp-sketch preview -u http://localhost:5173/home`

### screenshot

Take a browser screenshot and save it for visual comparison

CLI: `npx -y mcp-sketch screenshot [options]`
MCP: `sketch_html_screenshot`

| Parameter     | CLI Flag                 | MCP Parameter | Required | Description    |
| ------------- | ------------------------ | ------------- | -------- | -------------- |
| file path     | `-f, --file_path <PATH>` | file_path     | yes      | zip or folder  |
| page name     | `--pn, --page_name`      | page_name     | yes      |                |
| artboard name | `--an, --artboard_name`  | artboard_name | yes      |                |
| URL           | `-u, --url <URL>`        | url           | yes      | Screenshot URL |

Example: `npx -y mcp-sketch screenshot -f /path/to/export.zip --pn Home --an Login -u http://localhost:5173/login`

### state

Create or update the artboard state file, used by the Leader to manage workflow progress

CLI: `npx -y mcp-sketch state [options]`
MCP: `sketch_html_state`

| Parameter     | CLI Flag                | MCP Parameter | Required | Description                              |
| ------------- | ----------------------- | ------------- | -------- | ---------------------------------------- |
| page name     | `--pn, --page_name`     | page_name     | yes      |                                          |
| artboard name | `--an, --artboard_name` | artboard_name | yes      |                                          |
| JSON content  | `-c, --content <json>`  | content       | yes      | JSON string, e.g. `'{"key":"val"}'`      |
| clean files   | `--clean`               | clean         | no       | delete component & md files before write |
| replace list  | `-r, --replace`         | replace       | no       | replace component list instead of merge  |

Example: `npx -y mcp-sketch state --pn Home --an Login -c '{"stage":"completed"}'`

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
      "environment": { "MCP_MODE": "1", "LOG_LEVEL": "debug" }
    }
  }
}
```

- **Trae / other compatible tools**

```json
{
  "mcpServers": {
    "mcp-sketch": {
      "command": "npx",
      "args": ["-y", "mcp-sketch"],
      "env": { "MCP_MODE": "1" }
    }
  }
}
```

## Selection Priority

- **page**: `page_name` > first page
- **artboard**: `artboard_name` > first artboard
- **rect** (analyze only): filter rule — element is parsed only if its `x, y, x+width, y+height` bounds are fully inside the rect
- **exclude_rects** (analyze only): exclusion rule — element is discarded if its `x, y, x+width, y+height` bounds are fully inside any exclusion rect. Takes effect first when used with `rect`

## Output File Location

- Assets: default `src/assets/sketch/` (customizable via `assets_path`)
- Preview image: saved into `{input}.cache/` directory (webp format, fallback to original if sharp unavailable)

## Demo

<img width="359" height="438" alt="example" src="https://github.com/user-attachments/assets/ab7ba022-0cde-4c95-a060-c8f3adae035e" />
