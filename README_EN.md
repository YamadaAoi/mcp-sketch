# mcp-sketch

English | [中文](./README.md)

An MCP server & CLI that parses Sketch Meaxure design exports (zip or folder) into structured layer data, so AI coding agents (Claude Code / OpenCode, etc.) can reproduce design pages efficiently.

> A multimodal model is recommended (the agent needs to view artboard preview images to understand layout)

## 2.x vs 1.x

The 1.x releases shipped a full agent pipeline (leader / analyzer / developer / checker — multiple agents collaborating to split components, generate code, and review). 2.x drops that approach, for a simple reason: **models keep getting stronger**. Hand the unzipped design files directly to a new-generation model like kimi3 and it reproduces the design quite well — the 1.x multi-agent orchestration was essentially compensation for an era of weaker models, and has now become a burden: complex workflows, tedious state management, and a large surface for errors.

One pain point remains when an AI reads design files directly: **it has to keep probing how to extract data** — locating the entry file, parsing the embedded data variables, digging through files layer by layer, burning tokens back and forth. 2.x does exactly one thing: turn data extraction into tools, and hand rendering decisions back to the model.

> To keep using the 1.x agent pipeline, you need to pin the version in three places:
>
> 1. Install: `npx -y mcp-sketch@1 install`
> 2. MCP config: change the command to `npx -y mcp-sketch@1`
> 3. Installed agents / skills: their embedded CLI calls resolve to the latest version by default, which is incompatible with the 1.x workflow. Search your project for `npx -y mcp-sketch ` and replace it with `npx -y mcp-sketch@1 ` (covers `.claude/agents/`, `.claude/skills/`, `.opencode/agents/`, `.opencode/skills/`)

## 2.x Capabilities

Four tools, available as both CLI and MCP tools (identical parameters):

| Capability      | CLI                  | MCP tool         |
| --------------- | -------------------- | ---------------- |
| Artboard list   | `mcp-sketch list`    | `sketch_list`    |
| Layer analysis  | `mcp-sketch analyze` | `sketch_analyze` |
| Dev server      | `mcp-sketch dev`     | `sketch_dev`     |
| Screenshot diff | `mcp-sketch compare` | `sketch_compare` |

**list — artboard overview**

- Outputs every artboard's name, preview image path, and layer data size; written to `.sketch-cache/{design}/list.json`
- Includes a design-token aggregation: colors / font sizes / font families / radii / shadows / named styles ranked by usage frequency — ready to use for theme variables, and useful for spotting near-duplicate hex typos in the design
- Never serves stale cache after the design updates: each call re-checks freshness (zip by file mtime, folder by the latest inner-file mtime) and regenerates if the design is newer than list.json

**analyze — layer analysis**

- Layers returned in descending layout-weight order (area-based), with non-visual layers already filtered out
- Filtering & pagination: region `rect`, exclusion `exclude_rects`, name keyword `name`, type `type` (text/shape/slice), `limit/offset`, plus a `total` count to know when paging ends
- Each layer carries: `rect` coordinates, `index` (z-order, for occlusion relationships), text `content`, `css` declarations (fonts/colors/gradients/radii/shadows, default values filtered out), and non-default `opacity`/`rotation`
- `slice` layers auto-export image assets (compressed to webp), with global content deduplication (icons shared across artboards are stored only once)
- Artboard preview images are generated automatically; region queries generate a cropped preview of that region

**dev — dev server**

- Starts the dev server in the background (PowerShell on Windows, tmux on Unix-like systems), polls until ready, and returns the URL

**compare — screenshot diff**

- Pixel-wise comparison between a browser screenshot and the artboard preview, returning a similarity score plus an amplified diff image — enabling a quantified "edit code → screenshot → compare → fix" loop
- The browser screenshot comes from Playwright MCP (see [configuration below](#configure-playwright-mcp-optional-dependency-for-compare)), with which the AI opens the page, explores the rendered result, and takes screenshots

## Compared to letting AI read design files directly

| Dimension    | AI reads unzipped files                        | mcp-sketch                                                         |
| ------------ | ---------------------------------------------- | ------------------------------------------------------------------ |
| Unzip/parse  | Must unzip, browse folders for the entry file  | Pass zip or folder directly, zero setup                            |
| Data access  | Trial and error: read html → find vars → guess | One call returns filtered, sorted, structured data                 |
| Text content | Guess text by looking at pixels                | Handed over via the `content` field                                |
| Layer styles | Dig through huge raw JSON                      | `css` declaration array, noise filtered                            |
| Image assets | Find images and process them yourself          | Auto-exported as webp and globally deduplicated                    |
| Previews     | Browse the preview folder yourself             | Artboard-level / region-level previews provided                    |
| Repeat cost  | The whole process repeats every session        | Parsed results cached per design version, list.json reused on disk |
| Verification | Eyeball two images side by side                | compare similarity score + diff image                              |

In one sentence: **the model renders, the tool feeds it data**. Tokens saved on probing for data are all spent writing code.

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

The skill teaches the AI when and with which parameters to call the tools above (including two fixed commands: `/sketch init` to learn the project, `/sketch overview` to overview a design). Existing files can be overwritten or skipped per file.

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

### Configure Playwright MCP (optional, dependency for compare)

`compare` takes a browser screenshot as input. Playwright MCP is recommended so the AI can open the page, explore the rendered result, and capture screenshots on its own:

- [Claude Code setup](https://playwright.dev/mcp/clients/claude-code)
- [OpenCode setup](https://playwright.dev/mcp/clients/other-clients#opencode)
- [Keeping login state (browser extension approach)](https://playwright.dev/mcp/configuration/browser-extension)

### Use the CLI directly

> Without a global install, use `npx -y mcp-sketch <cmd>`; for frequent use, `npm i -g mcp-sketch` is recommended (avoids npx's per-run registry lookup latency)

```bash
# Artboard overview (generates list.json and all previews)
mcp-sketch list -f "design.zip"

# Layer analysis: top 20 layers of an artboard
mcp-sketch analyze -f "design.zip" --pn "PageName" --an "ArtboardName" --limit 20

# Region analysis: the login-box region, excluding a child component's area
mcp-sketch analyze -f "design.zip" --pn "PageName" --an "ArtboardName" -r "[695,200,530,660]" -e "[[700,600,120,40]]"

# Quick lookup by name / type
mcp-sketch analyze -f "design.zip" --pn "PageName" --an "ArtboardName" -n "logo"
mcp-sketch analyze -f "design.zip" --pn "PageName" --an "ArtboardName" -t text

# Screenshot comparison (after capturing one with Playwright etc.)
mcp-sketch compare -f "design.zip" --pn "PageName" --an "ArtboardName" -s "screenshot.png"
```

> Run `mcp-sketch <cmd> --help` for full parameter details

## Configuration

`.env.sketch` in the project root (optional):

| Field             | Required | Default             | Description                               |
| ----------------- | -------- | ------------------- | ----------------------------------------- |
| `SERVER_COMMAND`  | No       | `npm run dev`       | Command to start the dev server           |
| `PREVIEW_URL`     | No       | -                   | Dev server URL; required when using `dev` |
| `CWD`             | No       | Current directory   | Project root                              |
| `ASSETS_PATH`     | No       | `src/assets/sketch` | Image asset output path                   |
| `DESIGN_MEMO_MAX` | No       | `8`                 | In-process design parse cache limit       |
| `LOG_LEVEL`       | No       | `info`              | Log level                                 |

> On **Linux / macOS / WSL**, the `dev` command requires tmux: `brew install tmux` (macOS) / `sudo apt install tmux` (Ubuntu/Debian/WSL). No extra setup needed on Windows

## Output Layout

```
.sketch-cache/{design}/list.json          # artboard list + design tokens
.sketch-cache/assets-index.json           # asset content index (global dedup)
.sketch-cache/{design}/{page}/{artboard}/ # artboard/region previews (webp), compare diff images
{ASSETS_PATH}/{page}/{artboard}/          # image assets (webp, globally deduped)
```
