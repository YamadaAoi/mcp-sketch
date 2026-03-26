# mcp-sketch

[中文](./README.md) | English

Local MCP server for parsing Sketch exported HTML zip archives and extracting design structure information.

## Features

- Parse Sketch exported HTML zip archives and extract design structure
  - Filter by page and artboard
  - Specify rectangular region for parsing
  - Output design structure JSON and preview images for AI reference

## Usage

### 1. Configure MCP Client

Configure as a local MCP service, refer to the MCP configuration documentation for each tool.

- `opencode`:

```json
{
  "mcp": {
    "mcp-sketch": {
      "type": "local",
      "command": ["npx", "-y", "mcp-sketch"],
      "enabled": true,
      "environment": {
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
      "args": ["-y", "mcp-sketch"]
    }
  }
}
```

### 2. Call the Tool

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
| saveResult    | boolean  | No       | Whether to save analysis result to local file, default: `true`                                 |

### Selection Priority

- **page**: `page_id` > `page_name` > first page
- **artboard**: `artboard_id` > `artboard_name` > first artboard
- **rect**: Specify a rectangular region to parse. Elements whose `x, y` coordinates fall within the rectangle will be parsed.

### Return Result

The tool returns text: `Sketch Structure JSON: {analysis result}\nSketch Preview Image: {preview image path}`

- Analysis result
  - **meta**: Description information
  - **artboard**: Artboard data, including layers, styles, images, etc.

### Examples

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

## Output File Location

- Extracted assets are saved to `src/assets/sketch/` by default (customizable via `assets_path`)
- Parsed design content is saved to a local JSON file (for manual review), stored in a folder with the same name as the zip file

## Recommendations

- Use multimodal models to read preview images and refine design structure
- Keep data passed to AI under `50KB` for better analysis accuracy (local JSON files are formatted, data passed to AI is compact)
- **Use the `rect` parameter to parse specific regions of an artboard for modular development and improved granularity**
