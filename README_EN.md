# mcp-sketch

English | [中文](./README.md)

An MCP server & CLI that parses Sketch Meaxure design exports (zip or folder) into structured layer data, so AI coding agents (Claude Code / OpenCode, etc.) can reproduce design pages efficiently.

> A multimodal model is recommended (the agent needs to view artboard preview images to understand layout)

## Compared to letting AI read design files directly

New-generation models can already reproduce a design quite well from the unzipped files — what is expensive is the data-extraction process itself. mcp-sketch turns extraction into tools, saving both tokens and AI legwork:

| Dimension    | AI reads unzipped files                                | mcp-sketch                                                   |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------------ |
| Data access  | Trial and error: unzip, hunt the entry file, read html | One call returns filtered, sorted, structured layers         |
| Density      | Raw huge JSON served as-is                             | Positional arrays + noise filtering; repeats fold losslessly |
| Fetch scope  | Whole files only                                       | `rect` region / `name` / `type` / `limit` pagination         |
| Text & style | Guess text from pixels, dig styles out of raw JSON     | `content` direct; `css` as a curated declaration array       |
| Assets       | Find and process images, browse preview folders        | webp auto-export with global dedup; previews provided        |
| Repeat cost  | The whole process repeats every session                | Results cached on disk; no recompute until design changes    |
| Verification | Eyeball two images side by side                        | compare similarity score + diff image, quantified            |

Highlights: layout-weight ordering (`-l 20` fetches the skeleton first) · design tokens aggregated by frequency (ready for theme variables, spots near-duplicate hex typos) · self-healing cache (design updates or cleaned-up assets recompute automatically).

In one sentence: **the model renders, the tool feeds it data**. Tokens saved on probing for data are all spent writing code.

## 2.x Capabilities

Four tools, available as both CLI and MCP tools (identical parameters):

| Capability      | CLI                  | MCP tool         |
| --------------- | -------------------- | ---------------- |
| Artboard list   | `mcp-sketch list`    | `sketch_list`    |
| Layer analysis  | `mcp-sketch analyze` | `sketch_analyze` |
| Dev server      | `mcp-sketch dev`     | `sketch_dev`     |
| Screenshot diff | `mcp-sketch compare` | `sketch_compare` |

**list — artboard overview**

- Outputs every artboard's name, preview image path, and layer data size (`size` estimates the analyze payload with the same measure, for estimating payload size and deciding whether to fetch per region); written to `.sketch-cache/{design}/list.json`
- Includes a design-token aggregation: colors / font sizes / font families / radii / shadows / named styles ranked by usage frequency — ready to use for theme variables, and useful for spotting near-duplicate hex typos in the design
- Artboards whose slice share is an outlier across the design (≥ max(10%, 3× the median share of all artboards) get flagged `sliceBoard: true` — suspected, confirmed by the AI from the preview image; a common designer habit of collecting all slices in one artboard, and such artboards are not pages to reproduce
- Never serves stale cache after the design updates: regenerates automatically if the design is newer than list.json

**analyze — layer analysis**

- Layers returned in descending layout-weight order (area-based), with non-visual layers already filtered out
- Filtering & pagination: region `rect`, exclusion `exclude_rects`, name keyword `name`, type `type` (text/shape/slice), `limit/offset`, plus a `total` count to know when paging ends
- Output is a token-efficient positional format: `columns` declares the column order once and each layer is a row array read by position
- Heavily repeated layers (table cells, list items, etc.) collapse automatically — lossless compression that roughly halves output on table-heavy artboards
- `css` carries the main style declarations (fonts/colors/gradients/radii/shadows, default-value noise filtered out); `assets` is a plain path array (relative to the project root, compressed to webp, ready to import)
- `slice` assets are auto-exported with global content deduplication (icons shared across artboards are stored only once); artboard previews are generated automatically, and region queries generate a cropped preview of that region

**dev — dev server**

- Starts the dev server in the background and polls the configured `PREVIEW_URL` until it is reachable; returns immediately if already running

**compare — screenshot diff**

- A pure two-image differ: `-b` base image (design side) vs `-s` implementation screenshot (page side), pixel-wise — returning a similarity score plus an amplified diff image, enabling a quantified "edit code → screenshot → compare → fix" loop
- Base image sources: the artboard `previewPath` from `list` for a whole page; the region `previewPath` from `analyze -r` (already cropped to the rect) for a single component, paired with a playwright-cli element screenshot (`screenshot "{selector}"`) for component-level diffing
- The browser screenshot is taken with playwright-cli (plain CLI, no MCP configuration or session restart; see [setup below](#install-playwright-cli-optional-dependency-for-compare))

## Usage

### Install the skill (recommended)

```bash
npx -y mcp-sketch install
```

Select your platform interactively; files are written to:

| Platform        | Skill directory     |
| --------------- | ------------------- |
| **Claude Code** | `.claude/skills/`   |
| **OpenCode**    | `.opencode/skills/` |

The skill teaches the AI when and with which parameters to call the tools above (including three fixed commands: `/sketch init` to learn the project and check sketch-related configs (`.env.sketch`, `.gitignore` cache ignore, playwright-cli availability), `/sketch overview` to overview a design, `/sketch draw` to draw a page). Existing files can be overwritten or skipped per file.

### Configure the MCP server

Set `MCP_MODE=1` and register it as a local MCP server in your AI tool:

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

### Install playwright-cli (optional, dependency for compare)

`compare` takes a browser screenshot as input. playwright-cli opens the page, explores the rendered result, and takes the screenshot — plain CLI, no MCP configuration, no session restart:

```bash
# Option 1: global install
npm install -g @playwright/cli@latest
playwright-cli install      # installs the default chromium browser (large download)

# Option 2: no global install, via npx; commands are equivalent (playwright-cli → npx -y @playwright/cli)
npx -y @playwright/cli install
```

- When a private registry mirror lags behind and fetching `@latest` fails, check available versions with `npm view @playwright/cli versions --json` and retry with an older one via `npx -y @playwright/cli@<version>`
- A system browser channel (`--browser=msedge` or `chrome` on `open`) skips the browser download
- Pages behind login: `attach --extension=chrome` attaches to your own browser, or `open --persistent` keeps a persistent profile

### Use the CLI directly

> Without a global install, use `npx -y mcp-sketch <cmd>`; for frequent use, `npm i -g mcp-sketch` is recommended (avoids npx's per-run registry lookup latency)

```bash
# Artboard overview (generates list.json and all previews)
mcp-sketch list -f "design.zip"

# Layer analysis: top 20 layers of an artboard
mcp-sketch analyze -f "design.zip" -p "PageName" -a "ArtboardName" -l 20

# Region analysis: the login-box region, excluding a child component's area
mcp-sketch analyze -f "design.zip" -p "PageName" -a "ArtboardName" -r "[695,200,530,660]" -e "[[700,600,120,40]]"

# Quick lookup by name / type
mcp-sketch analyze -f "design.zip" -p "PageName" -a "ArtboardName" -n "logo"
mcp-sketch analyze -f "design.zip" -p "PageName" -a "ArtboardName" -t text

# Screenshot comparison (-b base image: artboard/region preview; -s implementation screenshot)
mcp-sketch compare -b "preview.webp" -s "screenshot.png"
```

> Run `mcp-sketch <cmd> --help` for full parameter details

## Configuration

`.env.sketch` in the project root (optional):

| Field            | Required | Default             | Description                                         |
| ---------------- | -------- | ------------------- | --------------------------------------------------- |
| `SERVER_COMMAND` | No       | `npm run dev`       | Command to start the dev server                     |
| `PREVIEW_URL`    | No       | -                   | Dev server URL; required when using `dev`           |
| `CWD`            | No       | Current directory   | Project root                                        |
| `ASSETS_PATH`    | No       | `src/assets/sketch` | Image asset output path                             |
| `LAYER_DEDUP`    | No       | on                  | Repeated-layer collapse; `off`/`0`/`false` disables |
| `LOG_LEVEL`      | No       | `info`              | Log level                                           |

> On **Linux / macOS / WSL**, the `dev` command requires tmux: `brew install tmux` (macOS) / `sudo apt install tmux` (Ubuntu/Debian/WSL). No extra setup needed on Windows

## Output Layout

```
.sketch-cache/{design}/list.json                        # artboard list + design tokens
.sketch-cache/{design}/analyze/                          # analyze result cache ({page}--{artboard}--{params}--{hash}.json)
.sketch-cache/assets-index.json                         # asset content index (global dedup + pinyin → original file/layer-name origins)
.sketch-cache/{design}/{page}/{artboard}/               # artboard/region previews (webp)
.sketch-cache/{design}/{page}/{artboard}/compare/       # compare diff images ({timestamp}.webp)
.sketch-cache/{design}/{page}/{artboard}/screenshot/    # browser screenshots (saved by the skill)
{ASSETS_PATH}/{page-pinyin}/{artboard-pinyin}/          # image assets (webp, globally deduped)
```

## 2.x vs 1.x

The 1.x releases shipped a full multi-agent pipeline (component splitting, code generation, review); 2.x drops it — models are now strong enough to reproduce a design directly from the unzipped files, and the only remaining pain point is data extraction. 2.x does exactly that one thing: turn extraction into tools, and hand rendering decisions back to the model.

> To keep using 1.x: pin `npx -y mcp-sketch@1` in installs and MCP config, and globally replace `npx -y mcp-sketch ` inside installed agents / skills with `npx -y mcp-sketch@1 `
