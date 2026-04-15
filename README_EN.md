# mcp-sketch

[中文](./README.md) | English

<a href="https://glama.ai/mcp/servers/YamadaAoi/mcp-sketch">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/YamadaAoi/mcp-sketch/badge" />
</a>

A local tool providing both MCP service and CLI for parsing **`Sketch-Meaxure`** exported HTML zip archives and extracting design structure information.

## SKILL

You can use the companion [sketch-html](./skills/sketch-html/SKILL.md) skill to analyze zip files exported from Sketch Meaxure

## Disclaimer

- To avoid confusing `AI`, this tool filters out some meaningless layers, but it's possible some valid layers were also filtered out
- It is recommended to communicate with `UI` designers: complex effects should be exported as images; simple effects should have a `radius` set for emphasis, even if it's just `1`

## Features

- Parse Sketch exported HTML zip archives and extract design structure
  - Filter by page and artboard
  - Specify rectangular region for parsing
  - Output design structure JSON and preview images for AI reference
- Available as both MCP service and CLI

## Usage

### Method 1: CLI

Use via npx:

```bash
npx -y mcp-sketch analyze -p /path/to/export.zip
```

#### Command Options

| Option                   | Short | Description                                                       |
| ------------------------ | ----- | ----------------------------------------------------------------- |
| `-p, --file_path <PATH>` | `-p`  | Sketch HTML zip archive path (**required**)                       |
| `--pid, --page_id`       |       | Page ID                                                           |
| `--pn, --page_name`      |       | Page name                                                         |
| `--aid, --artboard_id`   |       | Artboard ID                                                       |
| `--an, --artboard_name`  |       | Artboard name                                                     |
| `-r, --rect`             | `-r`  | Specify rectangular region to parse, format: `[x,y,width,height]` |
| `--ap, --assets_path`    |       | Assets output path, default: `src/assets/sketch`                  |
| `--sr, --save_result`    |       | Whether to save analysis result to local file, default: `false`   |

#### CLI Examples

**If the parameter contains spaces, wrap it in quotes**

```bash
# Analyze the first artboard of the first page
npx -y mcp-sketch analyze -p "/path/to/export .zip"

# Analyze a specific page
npx -y mcp-sketch analyze -p /path/to/export.zip --pn Home

# Analyze a specific artboard on a specific page
npx -y mcp-sketch analyze -p /path/to/export.zip --pn Home --an "User Management"

# Analyze a specific region
npx -y mcp-sketch analyze -p /path/to/export.zip --pn Home --an "User Management" -r "[0,0,1920,64]"
```

### Method 2: MCP Service

**You must set the environment variable `MCP_MODE=1` to enable MCP service**, configure as a local MCP service for AI tools to call directly.

- `opencode`:

```json
{
  "mcp": {
    "mcp-sketch": {
      "type": "local",
      "command": ["npx", "-y", "mcp-sketch"],
      "enabled": true,
      "environment": {
        "MCP_MODE": "1",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

- `Trae`:

```json
{
  "mcpServers": {
    "mcp-sketch": {
      "command": "npx",
      "args": ["-y", "mcp-sketch"],
      "env": {
        "MCP_MODE": "1"
      }
    }
  }
}
```

#### MCP Tool Parameters

Use the `sketch_html_analyze` tool to analyze Sketch exported HTML zip archives:

| Parameter     | Type     | Required | Description                                                                                    |
| ------------- | -------- | -------- | ---------------------------------------------------------------------------------------------- |
| file_path     | string   | Yes      | Sketch HTML zip archive path                                                                   |
| page_id       | string   | No       | Page ID                                                                                        |
| page_name     | string   | No       | Page name                                                                                      |
| artboard_id   | string   | No       | Artboard ID                                                                                    |
| artboard_name | string   | No       | Artboard name                                                                                  |
| rect          | number[] | No       | Specify rectangular region to parse, format: `[x, y, width, height]` (x, y is top-left corner) |
| assets_path   | string   | No       | Assets output path, default: `src/assets/sketch`                                               |
| save_result   | boolean  | No       | Whether to save analysis result to local file, default: `false`                                |

#### MCP Call Examples

- Analyze the first artboard of the first page in a Sketch HTML zip archive:

```
sketch_html_analyze({ file_path: "/path/to/export.zip" })
```

- Analyze the first artboard of a specific page:

```
sketch_html_analyze({ file_path: "/path/to/export.zip", page_name: "Home" })
```

- Analyze a specific artboard of a specific page:

```
sketch_html_analyze({ file_path: "/path/to/export.zip", page_name: "Home", artboard_name: "User Management" })
```

- Analyze a specific region of a specific artboard, e.g., the top navigation bar:

```
sketch_html_analyze({ file_path: "/path/to/export.zip", page_name: "Home", artboard_name: "User Management", rect: [0, 0, 1920, 64] })
```

## Selection Priority

- **page**: `page_id` > `page_name` > first page
- **artboard**: `artboard_id` > `artboard_name` > first artboard
- **rect**: Specify a rectangular region to parse. The filter rule is: elements will be parsed if their `x, y, x+width, y+height` bounds fall within the rectangle.

## Return Result

The tool returns text: `{artboard: {parsing result}, previewPath: "preview image path"}`

- `artboard`
  - Artboard data, including layers, styles, images, etc.
- `previewPath`
  - Uses `sharp` as an `optionalDependencies` for image processing
  - If installation fails (extreme cases, as `sharp` depends on `libvips`), the original full artboard image will be returned
  - If installation succeeds, the image will be resized, cropped to the `rect` region (if specified), and compressed to `webp` format
  - Only processes the preview image; does not handle Sketch exported assets

## Output File Location

- Extracted assets are saved to `src/assets/sketch/` by default (customizable via `assets_path`)
- Parsed design content is saved to a local JSON file (for manual review), stored in a folder with the same name as the zip file

## Recommendations

- Use multimodal models to read preview images and refine design structure
- Keep data passed to AI under `50KB` for better analysis accuracy (local JSON files are formatted, data passed to AI is compact)
- **Use the `rect` parameter to parse specific regions of an artboard for modular development and improved granularity**
