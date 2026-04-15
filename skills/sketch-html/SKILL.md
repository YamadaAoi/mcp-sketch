---
name: sketch-html
description: When analyzing Sketch Meaxure exported zip files, this skill parses and extracts valid layers, slices, and preview images.
metadata:
  author: zhouyinkui
  version: '2026.04.08'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

This skill analyzes `zip` files exported from `sketch meaxure` using tools to extract valid layers, slices, and preview images as references for AI to draw the front-end pages.

## Steps

### 1. Call help command to view tool usage

```bash
npx -y mcp-sketch analyze -h
```

### 2. Based on user input, infer and assemble the parameters mentioned by the user, then call the tool to analyze the file

- Example: `Analyze the design exported by sketch meaxure at src/sketch/export.zip, the Home - "User Management" board header [0,0,1920,64], save slices to src/assets/images`
  - Infer 【-p】 parameter as: `src/sketch/export.zip`, try to resolve to absolute path `/path/to/sketch/export.zip`
  - Infer 【--pn】 parameter as: `Home`
  - Infer 【--an】 parameter as: `User Management`
  - Infer 【-r】 parameter as: `[0,0,1920,64]`
  - Infer 【--ap】 parameter as: `src/assets/images`, try to resolve to absolute path `/path/to/assets/images`
  - Call tool to analyze file: `npx -y mcp-sketch analyze -p /path/to/sketch/export.zip --pn Home --an "User Management" -r "[0,0,1920,64]" --ap /path/to/assets/images`

### 3. Read tool return results

The tool returns text: `{artboard: {parse result}, previewPath: "preview image path"}`

- `artboard` contains artboard and valid layer information
  - Artboards have fixed dimensions; when drawing pages, consider adapting to different screen sizes
  - Each layer's coordinates are relative to the artboard, with 0,0 at the top-left corner, x-axis to the right, y-axis downward
  - List all images in the layers, prefer using CSS background for display
  - Important: Avoid using absolute positioning for page layout; use percentages, flex/grid, etc. to build more robust pages
- `previewPath`
  - Recommended to read the preview image to correct design structure, verify invalid layers or unmentioned layers in `artboard`

## Goal

- Combine design output to generate high-quality adaptive pages or components, ensuring at least 90% fidelity
