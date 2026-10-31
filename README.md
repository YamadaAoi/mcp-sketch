# mcp-sketch

[English](./README_EN.md) | 中文

MCP 服务 & CLI：把 Sketch Meaxure 导出的设计稿（zip 或目录）解析成结构化图层数据，配合 AI 编码工具（Claude Code / OpenCode 等）高效还原设计稿页面。

> 建议使用多模态模型（需要查看画板预览图理解布局）

## 2.x 与 1.x 的关系

1.x 提供了一整套智能体流水线（leader / analyzer / developer / checker 多 agent 协作拆分组件、生成代码、审核）。2.x 放弃了这套模式，原因很直接：**模型越来越强了**。把解压后的设计稿文件直接交给 kimi3 这类新一代模型，也能还原得很好——1.x 的多 agent 编排本质上是对模型能力不足时代的补偿，如今反而成了负担：流程复杂、状态管理繁琐、出错面大。

AI 直接读设计稿只剩一个痛点：**需要不断试探怎么取数据**——找入口文件、解析内嵌的数据变量、逐文件翻图层，来回浪费大量 token。2.x 只解决这一件事：把取数工具化，把还原的决策交还给模型。

> 想继续使用 1.x 智能体模式，需要把版本锁死在三处：
>
> 1. 安装：`npx -y mcp-sketch@1 install`
> 2. MCP 配置：命令改为 `npx -y mcp-sketch@1`
> 3. 已安装的 agents / skills：其内嵌的 CLI 调用默认拉最新版本，会与 1.x 流程不兼容。在项目内全局搜索 `npx -y mcp-sketch `，替换为 `npx -y mcp-sketch@1 `（涉及 `.claude/agents/`、`.claude/skills/`、`.opencode/agents/`、`.opencode/skills/`）

## 2.x 能力

四个工具，CLI 与 MCP 双形态（参数一致）：

| 能力     | CLI                  | MCP 工具         |
| -------- | -------------------- | ---------------- |
| 画板概览 | `mcp-sketch list`    | `sketch_list`    |
| 图层解析 | `mcp-sketch analyze` | `sketch_analyze` |
| 开发服务 | `mcp-sketch dev`     | `sketch_dev`     |
| 截图对比 | `mcp-sketch compare` | `sketch_compare` |

**list — 画板概览**

- 输出全部画板的名称、预览图路径、图层数据量，写入 `.sketch-cache/{design}/list.json`
- 附带设计 token 聚合：颜色 / 字号 / 字体 / 圆角 / 阴影 / 命名样式按使用频次排序，可直接用于建立主题变量，也能发现设计稿里的近似色号笔误
- 设计稿更新后不会返回过期缓存：再次调用时自动比对（zip 按文件 mtime，目录按内部文件最新 mtime），发现设计稿比 list.json 新则重新生成

**analyze — 图层解析**

- 图层按布局权重（面积为主）降序返回，已过滤无视觉属性的图层
- 过滤与分页：区域矩形 `rect`、排除区域 `exclude_rects`、名称关键词 `name`、类型 `type`（text/shape/slice）、`limit/offset`，返回 `total` 总数便于翻页
- 每个图层携带：`rect` 坐标、`index`（z-order，判断遮挡关系）、文本 `content`、`css` 样式声明（字体/颜色/渐变/圆角/阴影，默认值已过滤）、非默认的 `opacity`/`rotation`
- `slice` 图层自动导出切图（压缩为 webp），同内容切图全局去重（跨画板共享的图标只存一份）
- 自动生成画板预览图；区域查询时生成对应区域的裁剪预览

**dev — 开发服务**

- 后台启动 dev server（Windows 用 PowerShell，类 Unix 用 tmux），轮询就绪后返回访问地址

**compare — 截图对比**

- 浏览器截图与画板预览图逐像素对比，返回相似度分数与差异放大图，支持"改代码 → 截图 → 对比 → 修正"的量化收敛循环
- 浏览器截图依赖 Playwright MCP（见下方[配置](#配置-playwright-mcpcompare-截图依赖可选)），由 AI 打开页面、探索渲染结果并截图

## 与 AI 直接读设计稿相比

| 维度       | AI 直接读解压文件                       | mcp-sketch                                   |
| ---------- | --------------------------------------- | -------------------------------------------- |
| 解压/解析  | 需要解压 zip、翻目录找入口              | zip 或目录直接传入，零准备                   |
| 取数方式   | 反复试探：读 html → 找内嵌变量 → 猜结构 | 一次调用拿到过滤、排序后的结构化图层         |
| 文本内容   | 看图猜字                                | `content` 字段直接给出                       |
| 图层样式   | 从原始大 JSON 里捞                      | `css` 声明数组，噪音已过滤                   |
| 切图       | 找到图片再自己处理                      | 自动导出 webp 并全局去重                     |
| 预览图     | 自己翻 preview 目录                     | 画板级 / 区域级预览直接给出                  |
| 重复成本   | 每次会话重复全部过程                    | 解析结果按设计稿版本缓存，list.json 落盘复用 |
| 还原度检查 | 肉眼对比两张图                          | compare 相似度分数 + 差异图                  |

一句话：**模型负责还原，工具负责喂料**。省下试探取数的 token，全部花在写代码上。

## 使用

### 安装 skill（推荐）

```bash
npx -y mcp-sketch install
```

交互选择平台，写入对应目录：

| 平台            | skill 目录          |
| --------------- | ------------------- |
| **Claude Code** | `.claude/skills/`   |
| **OpenCode**    | `.opencode/skills/` |

skill 会教 AI 在什么时机、用什么参数调用上述工具（含 `/sketch init` 了解项目、`/sketch overview` 概览设计稿两个固定指令），已存在的文件可逐文件选择覆盖或跳过。

### 配置 MCP 服务

设置 `MCP_MODE=1`，在 AI 工具中配置为本地 MCP 服务：

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

### 配置 Playwright MCP（compare 截图依赖，可选）

`compare` 的输入是浏览器截图，推荐配置 Playwright MCP，让 AI 自主打开页面、探索渲染结果并截图：

- [Claude Code 配置](https://playwright.dev/mcp/clients/claude-code)
- [OpenCode 配置](https://playwright.dev/mcp/clients/other-clients#opencode)
- [保持登录状态（浏览器扩展方案）](https://playwright.dev/mcp/configuration/browser-extension)

### 直接使用 CLI

> 未全局安装时用 `npx -y mcp-sketch <cmd>`；频繁使用建议 `npm i -g mcp-sketch`（避免 npx 每次查询 registry 的冷启动延迟）

```bash
# 画板概览（生成 list.json 与全部预览图）
mcp-sketch list -f "设计稿.zip"

# 图层解析：整个画板前 20 个图层
mcp-sketch analyze -f "设计稿.zip" --pn "页面名" --an "画板名" --limit 20

# 区域解析：登录框区域，排除子组件占位区
mcp-sketch analyze -f "设计稿.zip" --pn "页面名" --an "画板名" -r "[695,200,530,660]" -e "[[700,600,120,40]]"

# 按名称/类型快速定位
mcp-sketch analyze -f "设计稿.zip" --pn "页面名" --an "画板名" -n "logo"
mcp-sketch analyze -f "设计稿.zip" --pn "页面名" --an "画板名" -t text

# 截图对比（Playwright 等工具截图后）
mcp-sketch compare -f "设计稿.zip" --pn "页面名" --an "画板名" -s "screenshot.png"
```

> `mcp-sketch <cmd> --help` 查看完整参数

## 配置

项目根目录 `.env.sketch`（可选）：

| 字段              | 必填 | 默认值              | 说明                            |
| ----------------- | ---- | ------------------- | ------------------------------- |
| `SERVER_COMMAND`  | 否   | `npm run dev`       | dev 服务启动命令                |
| `PREVIEW_URL`     | 否   | -                   | dev 服务地址，使用 `dev` 时必填 |
| `CWD`             | 否   | 当前目录            | 项目根目录                      |
| `ASSETS_PATH`     | 否   | `src/assets/sketch` | 切图输出路径                    |
| `DESIGN_MEMO_MAX` | 否   | `8`                 | 设计稿解析进程内缓存上限        |
| `LOG_LEVEL`       | 否   | `info`              | 日志级别                        |

> **Linux / macOS / WSL** 使用 `dev` 命令需安装 tmux：`brew install tmux`(macOS) / `sudo apt install tmux`(Ubuntu/Debian/WSL)，Windows 无需额外安装

## 输出目录

```
.sketch-cache/{设计稿名}/list.json          # 画板列表 + 设计 token
.sketch-cache/assets-index.json             # 切图内容索引（全局去重）
.sketch-cache/{设计稿名}/{页面}/{画板}/     # 画板/区域预览图（webp）、对比差异图
{ASSETS_PATH}/{页面}/{画板}/                # 切图（webp，全局去重）
```
