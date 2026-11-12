## Hard Rules

1. **Never extract or decompress any archive, in any way**

## Call `sketch_list` (MCP tool) or `npx -y mcp-sketch list` (CLI) to get all artboards in the design

```bash
npx -y mcp-sketch list -f "{file_path}"
```

- The tool returns the artboard list JSON directly and also writes `.sketch-cache/{design_file_name}/list.json` (`design_file_name = basename(file_path, '.zip')`)
- Read list.json directly in subsequent steps; no need to call again

## list.json format

```json
{
  "artboards": [
    {
      "pageName": "...",
      "artboardName": "...",
      "size": 123,
      "previewPath": "..."
    }
  ],
  "tokens": {
    "colors": { "#FFFFFF": 381 },
    "fontSizes": { "14px": 484 },
    "fontFamilies": { "MicrosoftYaHei": 300 },
    "radii": { "4px": 128 },
    "shadows": { "0 2px 8px rgba(0,0,0,.15)": 20 },
    "styleNames": {
      "14px/☀️default/2正文 body": { "count": 244, "css": ["..."] }
    }
  }
}
```

### artboards array

| Field        | Type   | Description                                            |
| ------------ | ------ | ------------------------------------------------------ |
| pageName     | string | Page name                                              |
| artboardName | string | Artboard name                                          |
| size         | number | Layer data size (bytes)                                |
| previewPath  | string | Artboard preview image path (relative to project root) |

### tokens object

Aggregated design system; every field is `{ value: usage count }` sorted by frequency descending:

- `colors` / `fontSizes` / `fontFamilies` / `radii` / `shadows`: colors, font sizes, font families, radii, shadows
- `styleNames`: designer-named shared styles (top 20); `css` holds a representative list of CSS declarations for the style

Usage: pick high-frequency values directly when building project theme variables; when near-identical colors coexist, ask the user whether one of them is a design typo
