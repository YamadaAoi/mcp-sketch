# mcp-sketch

[中文](./README.md) | English

## Disclaimer

- Use **multi-modal models** to analyze preview images
- Some meaningless layers are filtered out to avoid confusing AI, but valid layers may also be filtered
- Recommend communicating with designers: export complex effects as images, set `radius` (even 1) for simple effects

## Tools

### list

Returns basic info for all artboards (page name, artboard name, preview path).

CLI: `npx -y mcp-sketch list [options]`
MCP: `sketch_html_list`

| Parameter | CLI Flag                 | MCP Parameter | Required | Description   |
| --------- | ------------------------ | ------------- | -------- | ------------- |
| file path | `-p, --file_path <PATH>` | file_path     | yes      | zip or folder |

Example: `npx -y mcp-sketch list -p /path/to/export.zip`

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

## Skills & Agents

> **Note**: Skills and agents are under continuous iteration and improvement. LLMs are unpredictable. After installation, feel free to customize prompt content and tool permissions to fit your project's specific needs for best results.

### Installation

Install skills and agents into your project with a single CLI command:

```bash
npx -y mcp-sketch install
```

Specify a working directory:

```bash
npx -y mcp-sketch install --cwd /path/to/project
```

Interactively select your AI tool platform (Claude Code / OpenCode), and files are automatically written to the corresponding directories:

| Platform        | Skills Directory    | Agents Directory    |
| --------------- | ------------------- | ------------------- |
| **Claude Code** | `.claude/skills/`   | `.claude/agents/`   |
| **OpenCode**    | `.opencode/skills/` | `.opencode/agents/` |

> Currently only Claude Code and OpenCode are supported for one-click installation. Other tools (e.g. Trae, Cursor) that are compatible with the `.claude` directory structure can choose to install as Claude Code. For other tools, install as Claude Code first, then manually copy the installed file contents to the appropriate location in your tool.

Installed file structure:

```
{skills}/sketch-workflow/SKILL.md    ← Orchestrator: 5-stage state machine
{agents}/
├── sketch-init.md                  ← Sub-agent: Project Architect
├── sketch-pick.md                  ← Sub-agent: Design Extraction Specialist
├── sketch-split.md                 ← Sub-agent: Senior Frontend Architect
├── sketch-layout.md                ← Sub-agent: Layout Engineer
└── sketch-draw.md                  ← Sub-agent: Senior Frontend Developer
```

### Workflow

After loading the `sketch-workflow` skill, the main agent schedules 5 sub-agents according to the state machine:

`sketch-init → sketch-pick → sketch-split → sketch-layout → sketch-draw`

Each phase:

1. Create a sub-agent and pass in parameters
2. Wait for the sub-agent to return `SUCCESS`/`FAILED` markers
3. Disk verification (verify actual files on disk, don't trust the sub-agent's word)
4. Update `sketch-cache/` state file, proceed to next phase

> The frontmatter (mode/tools/permission) in agents/\*.md is opencode-specific format. For agent configuration on each platform, refer to the corresponding docs: [opencode agents](https://opencode.ai/docs/agents), [Claude Code sub-agents](https://code.claude.com/docs/sub-agents). The instruction content is platform-agnostic and works with any AI tool.

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

## Return Result

### list

`[{ pageName, artboardName, previewPath }]` (array of all artboards)

### locate

`[{ name, type, rect: [x, y, w, h] }]` (top n layout-impacting layers with coordinates)

### analyze

`{ artboard: { layers, styles, images, etc. }, previewPath: "preview image path" }`

Preview uses `sharp` (optionalDependency). If `sharp` fails to install (libvips issue), the original full artboard image is returned. If installed, the image is resized, cropped to `rect` (if specified), and compressed to webp. Only processes preview image, not assets.

### plan

`{ previewPath, filePath, pageName, artboardName, width, height }`

## Output File Location

- Assets: default `src/assets/sketch/` (customizable via `assets_path`)
- JSON result: saved into `{input}.cache/` directory
- Preview image: saved into `{input}.cache/` directory (webp format, fallback to original if sharp unavailable)

## Recommendations

- Keep data passed to AI under 50KB for better accuracy (local JSON is formatted, data sent to AI is compact)
- **Use `rect` parameter for modular parsing of specific artboard regions**

## Demo

<img width="359" height="438" alt="example" src="https://github.com/user-attachments/assets/ab7ba022-0cde-4c95-a060-c8f3adae035e" />
