# mcp-sketch

[中文](./README.md) | English

## Disclaimer

- Some meaningless layers are filtered out to avoid confusing AI, but valid layers may also be filtered
- Recommend communicating with designers: export complex effects as images, set `radius` (even 1) for simple effects

## Tools

### list

Returns basic info for all artboards (page name, artboard name, preview path).

CLI: `npx -y mcp-sketch list [options]`
MCP: `sketch_html_list`

| Parameter | CLI Flag                 | MCP Parameter | Required | Description |
| --------- | ------------------------ | ------------- | -------- | ----------- |
| zip path  | `-p, --file_path <PATH>` | file_path     | yes      |             |

Example: `npx -y mcp-sketch list -p /path/to/export.zip`

#### Skill: `npx skills@latest add YamadaAoi/mcp-sketch -s sketch-init`

- With skill: AI surveys all artboards, plans routes, creates blank components and description docs.

### plan

Lightweight plan: return preview image path and basic artboard info (width, height, name), no layer details.

CLI: `npx -y mcp-sketch plan [options]`
MCP: `sketch_html_plan`

| Parameter     | CLI Flag                 | MCP Parameter | Required | Description |
| ------------- | ------------------------ | ------------- | -------- | ----------- |
| zip path      | `-p, --file_path <PATH>` | file_path     | yes      |             |
| page name     | `--pn, --page_name`      | page_name     | no       |             |
| artboard name | `--an, --artboard_name`  | artboard_name | no       |             |

Example: `npx -y mcp-sketch plan -p /path/to/export.zip --pn Home`

#### Skill: `npx skills@latest add YamadaAoi/mcp-sketch -s sketch-split`

- With skill: AI decomposes the artboard into components, plans directory structure, creates component docs.

### analyze

Full parse: extract layer structure, styles, assets, output design JSON + preview image.

CLI: `npx -y mcp-sketch analyze [options]`
MCP: `sketch_html_analyze`

| Parameter     | CLI Flag                 | MCP Parameter | Required | Description                              |
| ------------- | ------------------------ | ------------- | -------- | ---------------------------------------- |
| zip path      | `-p, --file_path <PATH>` | file_path     | yes      |                                          |
| page name     | `--pn, --page_name`      | page_name     | no       |                                          |
| artboard name | `--an, --artboard_name`  | artboard_name | no       |                                          |
| rect          | `-r, --rect`             | rect          | no       | `[x, y, width, height]`                  |
| exclude rects | `-e, --exclude_rects`    | exclude_rects | no       | `[[x, y, width, height], ...]`           |
| assets path   | `--ap, --assets_path`    | assets_path   | no       | default `src/assets/sketch`              |
| save result   | `--sr, --save_result`    | save_result   | no       | save JSON alongside zip, default `false` |

Example: `npx -y mcp-sketch analyze -p /path/to/export.zip --pn Home --an "User Management" -r "[0,0,1920,64]"`

#### Skill: `npx skills@latest add YamadaAoi/mcp-sketch -s sketch-draw`

- With skill: AI auto-infers parameters, calls the tool, reads preview to refine structure, outputs high-fidelity pages.

### Workflow: one-click generation

#### Skill: `npx skills@latest add YamadaAoi/mcp-sketch -s sketch-workflow`

- With skill: AI orchestrates init (planning), split (decomposition), and draw (rendering) into a seamless pipeline for one-click project generation.

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

### analyze

`{ artboard: { layers, styles, images, etc. }, previewPath: "preview image path" }`

Preview uses `sharp` (optionalDependency). If `sharp` fails to install (libvips issue), the original full artboard image is returned. If installed, the image is resized, cropped to `rect` (if specified), and compressed to webp. Only processes preview image, not assets.

### plan

`{ previewPath, filePath, pageName, artboardName, width, height }`

## Output File Location

- Assets: default `src/assets/sketch/` (customizable via `assets_path`)
- JSON result: saved in a directory named after the zip file

## Recommendations

- Use multimodal models to read preview images and refine design structure
- Keep data passed to AI under 50KB for better accuracy (local JSON is formatted, data sent to AI is compact)
- **Use `rect` parameter for modular parsing of specific artboard regions**

## Demo

<img width="359" height="438" alt="example" src="https://github.com/user-attachments/assets/ab7ba022-0cde-4c95-a060-c8f3adae035e" />
