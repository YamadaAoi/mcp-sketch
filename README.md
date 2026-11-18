# mcp-sketch

[English](./README_EN.md) | 中文

MCP 服务 & CLI：把 Sketch Meaxure 导出的设计稿（zip 或目录）解析成结构化图层数据，配合 AI 编码工具（Claude Code / OpenCode 等）高效还原设计稿页面。

> 建议使用多模态模型（需要查看画板预览图理解布局）

## 与 AI 直接读设计稿相比

新一代模型直接读解压后的文件也能还原得不错，贵的是取数过程本身。mcp-sketch 把取数工具化，省 token 也省 AI 的工作：

| 维度       | AI 直接读解压文件                                | mcp-sketch                                    |
| ---------- | ------------------------------------------------ | --------------------------------------------- |
| 取数方式   | 反复试探：解压、翻目录找入口、读 html 猜内嵌变量 | 一次调用拿到过滤、排序后的结构化图层          |
| 输出密度   | 原始大 JSON 照单全收                             | 定位数组 + 噪音过滤；重复图层无损折叠省约一半 |
| 按需取数   | 只能整文件读                                     | `rect` 区域 / `name` / `type` / `limit` 分页  |
| 文本与样式 | 看图猜字，从大 JSON 里捞样式                     | `content` 直出；`css` 已整理成声明数组        |
| 切图与预览 | 自己找图处理、翻 preview 目录                    | webp 自动导出全局去重；预览图直接给出         |
| 重复成本   | 每次会话重复全部过程                             | 结果落盘缓存，设计稿没变不重算                |
| 还原度检查 | 肉眼对比两张图                                   | compare 相似度分数 + 差异图，量化收敛         |

亮点：布局权重降序（`-l 20` 先拿骨架）· 设计 token 按频次聚合（直接建主题变量、发现近似色笔误）· 缓存自愈（设计稿更新或切图被清理自动重算）。

一句话：**模型负责还原，工具负责喂料**。省下试探取数的 token，全部花在写代码上。

## 2.x 能力

四个工具，CLI 与 MCP 双形态（参数一致）：

| 能力     | CLI                  | MCP 工具         |
| -------- | -------------------- | ---------------- |
| 画板概览 | `mcp-sketch list`    | `sketch_list`    |
| 图层解析 | `mcp-sketch analyze` | `sketch_analyze` |
| 开发服务 | `mcp-sketch dev`     | `sketch_dev`     |
| 截图对比 | `mcp-sketch compare` | `sketch_compare` |

**list — 画板概览**

- 输出全部画板的名称、预览图路径、图层数据量（`size` 按 analyze 同口径估算，用于估算单次取数量、决定是否按区域分批；切图按原始引用近似计量，与实际导出路径字节略有出入），写入 `.sketch-cache/{design}/list.json`
- 附带设计 token 聚合：颜色 / 字号 / 字体 / 圆角 / 阴影 / 命名样式按使用频次排序，可直接用于建立主题变量，也能发现设计稿里的近似色号笔误
- 切图类图层占比大于阈值（默认 90%）的画板标记 `sliceBoard: true`——设计师把切图集中成一个画板的常见习惯，这类画板不是待还原页面；阈值可经 `SLICE_BOARD_RATIO` 调整
- 设计稿更新后不会返回过期缓存：再次调用时自动比对（zip 按文件 mtime，目录按内部文件最新 mtime），发现设计稿比 list.json 新则重新生成

**analyze — 图层解析**

- 图层按布局权重（面积为主）降序返回，已过滤无视觉属性的图层
- 过滤与分页：区域矩形 `rect`、排除区域 `exclude_rects`、名称关键词 `name`、类型 `type`（text/shape/slice）、`limit/offset`，返回 `total` 总数便于翻页
- 输出为省 token 的定位数组格式：`columns` 一次性声明列序，每个图层一行按位读取（index/name/type/rect/content/css/assets）；偶现的非默认 `opacity`/`rotation` 收录在按 `index` 索引的稀疏 `extras` 里；空值按列类型固定（content 为 `""`，css/assets 为 `[]`）
- 大面积重复图层（表格单元格/列表项等）自动折叠：除位置与文案外完全相同、成员数 ≥3 的组保留一行宿主，其余进按宿主 `index` 索引的 `clones` 坐标表（`[index, x, y]`，文案非空时附加）——无损压缩，表格类画板输出可省约一半；`.env.sketch` 配 `LAYER_DEDUP=off|0|false` 可关闭
- `css` 承载主要样式声明（字体/颜色/渐变/圆角/阴影，默认值噪音已过滤）；`assets` 为纯路径数组（相对项目根目录，已压缩为 webp，可直接 import）
- `slice` 图层自动导出切图，同内容全局去重（跨画板共享的图标只存一份）；自动生成画板预览图，区域查询时生成对应区域的裁剪预览
- 结果按参数组合落盘缓存于 `.sketch-cache/{design}/analyze/`（文件名含参数摘要，CLI 与 MCP 共用同一份）：命中直接返回；设计稿更新（版本戳变化）或引用文件（预览图/切图）缺失时自动重算

**dev — 开发服务**

- 后台启动 dev server（Windows 用 PowerShell，类 Unix 用 tmux），轮询配置的 `PREVIEW_URL` 直到可访问；已在运行则直接返回。地址取自配置，不做自动探测

**compare — 截图对比**

- 纯两图差异器：`-b` 基准图（设计侧）与 `-s` 实现截图（页面侧）逐像素比对，截图按基准图宽度缩放后取共同高度计算差异，返回相似度分数与差异放大图，支持"改代码 → 截图 → 对比 → 修正"的量化收敛循环；工具本身不含设计栈知识，两侧的区域定位在上游完成
- 基准图来源：整页比对用 `list` 返回的画板 `previewPath`；单个组件用 `analyze -r` 返回的区域 `previewPath`（已按 rect 裁剪），配合 playwright-cli 元素截图（`screenshot "{selector}"`）即可做组件级比对
- 差异图归档到基准图同目录的 `compare/{timestamp}.webp`，多轮修正结果可回溯对比
- 浏览器截图由 playwright-cli 完成（纯命令行，无需 MCP 配置与重启会话，见下方[安装](#安装-playwright-clicompare-截图依赖可选)）

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

skill 会教 AI 在什么时机、用什么参数调用上述工具（含 `/sketch init` 了解项目并检查 sketch 相关配置（`.env.sketch`、`.gitignore` 缓存忽略、playwright-cli 可用性）、`/sketch overview` 概览设计稿、`/sketch draw` 绘制页面三个固定指令），已存在的文件可逐文件选择覆盖或跳过。

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

### 安装 playwright-cli（compare 截图依赖，可选）

`compare` 的输入是浏览器截图，由 playwright-cli 打开页面、探索渲染结果并截图，纯命令行驱动，无需 MCP 配置、无需重启会话：

```bash
# 方式一：全局安装
npm install -g @playwright/cli@latest
playwright-cli install      # 安装默认浏览器 chromium（下载量大）

# 方式二：npx 免安装，两种方式的命令等价（playwright-cli → npx -y @playwright/cli）
npx -y @playwright/cli install
```

- 使用系统浏览器通道（`open` 时配 `--browser=msedge` 或 `chrome`）可跳过浏览器安装
- 复用登录状态：`attach --extension=chrome` 接管装了 Playwright 插件的浏览器，或 `open --persistent` 用持久化配置目录

### 直接使用 CLI

> 未全局安装时用 `npx -y mcp-sketch <cmd>`；频繁使用建议 `npm i -g mcp-sketch`（避免 npx 每次查询 registry 的冷启动延迟）

```bash
# 画板概览（生成 list.json 与全部预览图）
mcp-sketch list -f "设计稿.zip"

# 图层解析：整个画板前 20 个图层
mcp-sketch analyze -f "设计稿.zip" -p "页面名" -a "画板名" -l 20

# 区域解析：登录框区域，排除子组件占位区
mcp-sketch analyze -f "设计稿.zip" -p "页面名" -a "画板名" -r "[695,200,530,660]" -e "[[700,600,120,40]]"

# 按名称/类型快速定位
mcp-sketch analyze -f "设计稿.zip" -p "页面名" -a "画板名" -n "logo"
mcp-sketch analyze -f "设计稿.zip" -p "页面名" -a "画板名" -t text

# 截图对比（-b 基准图：画板/区域预览图；-s 实现截图）
mcp-sketch compare -b "preview.webp" -s "screenshot.png"
```

> `mcp-sketch <cmd> --help` 查看完整参数

## 配置

项目根目录 `.env.sketch`（可选）：

| 字段                | 必填 | 默认值              | 说明                                                  |
| ------------------- | ---- | ------------------- | ----------------------------------------------------- |
| `SERVER_COMMAND`    | 否   | `npm run dev`       | dev 服务启动命令                                      |
| `PREVIEW_URL`       | 否   | -                   | dev 服务地址，使用 `dev` 时必填                       |
| `CWD`               | 否   | 当前目录            | 项目根目录                                            |
| `ASSETS_PATH`       | 否   | `src/assets/sketch` | 切图输出路径                                          |
| `LAYER_DEDUP`       | 否   | 开启                | 重复图层折叠开关，配 `off`/`0`/`false` 关闭           |
| `SLICE_BOARD_RATIO` | 否   | `0.9`               | 切图画板标记阈值，切图占比大于该值时标记 `sliceBoard` |
| `DESIGN_MEMO_MAX`   | 否   | `8`                 | 设计稿解析进程内缓存上限（analyze 结果另有落盘缓存）  |
| `LOG_LEVEL`         | 否   | `info`              | 日志级别                                              |

> **Linux / macOS / WSL** 使用 `dev` 命令需安装 tmux：`brew install tmux`(macOS) / `sudo apt install tmux`(Ubuntu/Debian/WSL)，Windows 无需额外安装

## 输出目录

```
.sketch-cache/{设计稿名}/list.json                        # 画板列表 + 设计 token
.sketch-cache/{设计稿名}/analyze/                          # analyze 结果缓存（{页面}--{画板}--{参数}--{hash}.json）
.sketch-cache/assets-index.json                           # 切图内容索引（全局去重 + 拼音名 → 原始文件名/图层溯源）
.sketch-cache/{设计稿名}/{页面}/{画板}/                   # 画板/区域预览图（webp）
.sketch-cache/{设计稿名}/{页面}/{画板}/compare/           # 对比差异图（{timestamp}.webp）
.sketch-cache/{设计稿名}/{页面}/{画板}/screenshot/        # 浏览器截图（AI 按 skill 约定保存）
{ASSETS_PATH}/{页面拼音}/{画板拼音}/                      # 切图（webp，全局去重）
```

## 2.x 与 1.x 的关系

1.x 提供了一整套智能体流水线（leader / analyzer / developer / checker 多 agent 协作拆分组件、生成代码、审核）。2.x 放弃了这套模式，原因很直接：**模型越来越强了**。把解压后的设计稿文件直接交给 kimi3 这类新一代模型，也能还原得很好——1.x 的多 agent 编排本质上是对模型能力不足时代的补偿，如今反而成了负担：流程复杂、状态管理繁琐、出错面大。

AI 直接读设计稿只剩一个痛点：**需要不断试探怎么取数据**——找入口文件、解析内嵌的数据变量、逐文件翻图层，来回浪费大量 token。2.x 只解决这一件事：把取数工具化，把还原的决策交还给模型。

> 想继续使用 1.x 智能体模式，需要把版本锁死在三处：
>
> 1. 安装：`npx -y mcp-sketch@1 install`
> 2. MCP 配置：命令改为 `npx -y mcp-sketch@1`
> 3. 已安装的 agents / skills：其内嵌的 CLI 调用默认拉最新版本，会与 1.x 流程不兼容。在项目内全局搜索 `npx -y mcp-sketch `，替换为 `npx -y mcp-sketch@1 `（涉及 `.claude/agents/`、`.claude/skills/`、`.opencode/agents/`、`.opencode/skills/`）
