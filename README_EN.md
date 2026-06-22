# mcp-sketch

[中文](./README.md) | English

## Disclaimer

- Use **multi-modal models** — the `sketch-*` workflow requires analyzing preview images

## Agents

> **Note**: Agents are under continuous iteration and improvement. LLMs are unpredictable. After installation, feel free to customize prompt content and tool permissions to fit your project's specific needs.

> Currently only Claude Code and OpenCode are supported for one-click installation. Other tools that are compatible with the `.claude` directory structure can choose to install as Claude Code.

### Installation

Install agents into your project with a single CLI command:

```bash
npx -y mcp-sketch install
```

Interactively select your AI tool platform, and files are automatically written to the corresponding directories:

| Platform        | Agents Directory    |
| --------------- | ------------------- |
| **Claude Code** | `.claude/agents/`   |
| **OpenCode**    | `.opencode/agents/` |

Installed file structure:

```
{agents}/
├── sketch-leader.md              ← Main agent: Frontend Leader
├── sketch-scribe.md              ← Sub-agent: State Recorder
├── sketch-init.md                ← Sub-agent: Tech Lead
├── sketch-pick.md                ← Sub-agent: Design Assistant
├── sketch-split.md               ← Sub-agent: Frontend Architect
├── sketch-bound.md               ← Sub-agent: Mid-level Frontend Developer
├── sketch-gen-base.md            ← Sub-agent: Junior Frontend Developer
├── sketch-layout.md              ← Sub-agent: Mid-level Frontend Developer
├── sketch-draw.md                ← Sub-agent: Senior Frontend Developer
└── sketch-draw-check.md          ← Sub-agent: QA Engineer
```

### Leader Architecture

sketch-leader is the **main agent** — you talk to it directly. It analyzes requirements, dispatches sub-agents, and reviews results.

### Switch to Leader

**OpenCode**:

- After starting `opencode`, press `TAB` to switch to `sketch-leader`

**Claude Code**:

- Specify the agent when starting `claude`

```
claude --agent sketch-leader
```

After switching, all your messages are sent to sketch-leader, which dispatches sub-agents to complete the work.

### Workflow

| Phase         | Sub-agent         | Parallel |
| ------------- | ----------------- | -------- |
| State Mgmt    | sketch-scribe     | ❌       |
| Initialize    | sketch-init       | ❌       |
| Pick Artboard | sketch-pick       | ❌       |
| Split         | sketch-split      | ❌       |
| Bound         | sketch-bound      | ❌       |
| Gen Base      | sketch-gen-base   | ✅       |
| Layout        | sketch-layout     | ❌       |
| Draw          | sketch-draw       | ✅       |
| Review        | sketch-draw-check | ✅       |

### Usage

**New flow**: Tell leader what page you want to implement. It automatically executes the workflow, pausing after layout for you to preview and confirm.

**Fix mode**: Tell leader what's wrong (e.g. "spacing too large", "color is off"). It analyzes the issue and dispatches the right sub-agent to fix it.

**Problem type judgment**:

| Problem                        | Who to call   |
| ------------------------------ | ------------- |
| Poor component split           | sketch-split  |
| Inter-component layout issues  | sketch-layout |
| Intra-component layout/styles  | sketch-draw   |
| Component position/size issues | sketch-bound  |

### State Files

- Project config: `sketch-cache/proj-init.md`
- Artboard state: `sketch-cache/artboards/{pageName}-{artboardName}.json`

Leader can only read state files; all write operations are delegated to sketch-scribe. Resume from where you left off if interrupted. All file paths use relative paths.

## Tools

> The following are low-level tools, available for Agent use or standalone use.

### list

Returns basic info for all artboards (page name, artboard name, preview path).

CLI: `npx -y mcp-sketch list [options]`
MCP: `sketch_html_list`

| Parameter | CLI Flag                 | MCP Parameter | Required | Description   |
| --------- | ------------------------ | ------------- | -------- | ------------- |
| file path | `-p, --file_path <PATH>` | file_path     | yes      | zip or folder |

Example: `npx -y mcp-sketch list -p /path/to/export.zip`

Returns: `[{ pageName, artboardName, previewPath }]`

### plan

Lightweight plan: return preview image path and basic artboard info (width, height, name), no layer details.

CLI: `npx -y mcp-sketch plan [options]`
MCP: `sketch_html_plan`

| Parameter     | CLI Flag                 | MCP Parameter | Required | Description   |
| ------------- | ------------------------ | ------------- | -------- | ------------- |
| file path     | `-p, --file_path <PATH>` | file_path     | yes      | zip or folder |
| page name     | `--pn, --page_name`      | page_name     | no       |               |
| artboard name | `--an, --artboard_name`  | artboard_name | no       |               |

Example: `npx -y mcp-sketch plan -p /path/to/export.zip --pn Home`

Returns: `{ previewPath, filePath, pageName, artboardName, width, height }`

### locate

Locate the top `n` layers that most affect the artboard layout, returning their coordinates. Used in the `sketch-split` phase to correct `rect` values in the component plan.

CLI: `npx -y mcp-sketch locate [options]`
MCP: `sketch_html_locate`

| Parameter     | CLI Flag                 | MCP Parameter | Required | Description                   |
| ------------- | ------------------------ | ------------- | -------- | ----------------------------- |
| file path     | `-p, --file_path <PATH>` | file_path     | yes      | zip or folder                 |
| page name     | `--pn, --page_name`      | page_name     | no       |                               |
| artboard name | `--an, --artboard_name`  | artboard_name | no       |                               |
| offset        | `--offset`               | offset        | no       | starting index (default 0)    |
| limit         | `--limit`                | limit         | no       | number of layers (default 10) |

Example: `npx -y mcp-sketch locate -p /path/to/export.zip --pn Home --an "User Management" --limit 10`

Returns: `[{ name, type, rect: [x, y, w, h] }]`

### analyze

Full parse: extract layer structure, styles, assets, output design JSON + preview image.

CLI: `npx -y mcp-sketch analyze [options]`
MCP: `sketch_html_analyze`

| Parameter     | CLI Flag                 | MCP Parameter | Required | Description                                          |
| ------------- | ------------------------ | ------------- | -------- | ---------------------------------------------------- |
| file path     | `-p, --file_path <PATH>` | file_path     | yes      | zip or folder                                        |
| page name     | `--pn, --page_name`      | page_name     | no       |                                                      |
| artboard name | `--an, --artboard_name`  | artboard_name | no       |                                                      |
| rect          | `-r, --rect`             | rect          | no       | `[x, y, width, height]`                              |
| exclude rects | `-e, --exclude_rects`    | exclude_rects | no       | `[[x, y, width, height], ...]`                       |
| assets path   | `--ap, --assets_path`    | assets_path   | no       | default `src/assets/sketch`                          |
| save result   | `--sr, --save_result`    | save_result   | no       | save JSON into `{input}.cache/` dir, default `false` |

Example: `npx -y mcp-sketch analyze -p /path/to/export.zip --pn Home --an "User Management" -r "[0,0,1920,64]"`

Returns: `{ artboard: { layers, styles, images, etc. }, previewPath: "preview image path" }`

Preview uses `sharp` (optionalDependency). If `sharp` fails to install (libvips issue), the original full artboard image is returned. If installed, the image is resized, cropped to `rect` (if specified), and compressed to webp. Only processes preview image, not assets.

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
- **exclude_rects** (analyze only): exclusion rule — element is discarded if its `x, y, x+width, y+height` bounds are fully inside any exclusion rect. Takes effect first when used with `rect`.

## Output File Location

- Assets: default `src/assets/sketch/` (customizable via `assets_path`)
- JSON result: saved into `{input}.cache/` directory
- Preview image: saved into `{input}.cache/` directory (webp format, fallback to original if sharp unavailable)

## Demo

<img width="359" height="438" alt="example" src="https://github.com/user-attachments/assets/ab7ba022-0cde-4c95-a060-c8f3adae035e" />
