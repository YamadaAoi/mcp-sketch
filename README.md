# mcp-sketch

[English](./README_EN.md) | 中文

## 声明

- 使用**多模态模型**，`sketch-*`技能需要分析预览图
- 工具会过滤一部分无意义图层，但不排除误过滤有效图层的情况
- 建议与设计师沟通：复杂效果切图，简单效果设 `radius`（哪怕 1）

## 工具

### list

返回所有画板的基础信息（页面名称、画板名称、预览图路径）。

CLI: `npx -y mcp-sketch list [options]`
MCP: `sketch_html_list`

| 参数     | CLI 选项                 | MCP 参数  | 必填 | 说明       |
| -------- | ------------------------ | --------- | ---- | ---------- |
| 文件路径 | `-p, --file_path <PATH>` | file_path | 是   | zip 或目录 |

例：`npx -y mcp-sketch list -p /path/to/export.zip`

### plan

轻量规划，返回画板预览图路径及基本信息（宽高、名称），不提取图层细节。

CLI: `npx -y mcp-sketch plan [options]`
MCP: `sketch_html_plan`

| 参数     | CLI 选项                 | MCP 参数      | 必填 | 说明       |
| -------- | ------------------------ | ------------- | ---- | ---------- |
| 文件路径 | `-p, --file_path <PATH>` | file_path     | 是   | zip 或目录 |
| 页面名称 | `--pn, --page_name`      | page_name     | 否   |            |
| 画板名称 | `--an, --artboard_name`  | artboard_name | 否   |            |

例：`npx -y mcp-sketch plan -p /path/to/export.zip --pn 首页`

### locate

定位画板中最影响布局的前 `n` 个图层及其坐标，用于在 `sketch-split` 阶段修正组件规划表中的 `rect`。

CLI: `npx -y mcp-sketch locate [options]`
MCP: `sketch_html_locate`

| 参数     | CLI 选项                 | MCP 参数      | 必填 | 说明            |
| -------- | ------------------------ | ------------- | ---- | --------------- |
| 文件路径 | `-p, --file_path <PATH>` | file_path     | 是   | zip 或目录      |
| 页面名称 | `--pn, --page_name`      | page_name     | 否   |                 |
| 画板名称 | `--an, --artboard_name`  | artboard_name | 否   |                 |
| 图层数量 | `-r, --rank`             | rank          | 否   | 返回前 n 个图层 |

例：`npx -y mcp-sketch locate -p /path/to/export.zip --pn 首页 --an 用户管理 -r 10`

### analyze

完整解析，提取图层结构、样式、切图，输出设计 JSON + 预览图。

CLI: `npx -y mcp-sketch analyze [options]`
MCP: `sketch_html_analyze`

| 参数           | CLI 选项                 | MCP 参数      | 必填 | 说明                                             |
| -------------- | ------------------------ | ------------- | ---- | ------------------------------------------------ |
| 文件路径       | `-p, --file_path <PATH>` | file_path     | 是   | zip 或目录                                       |
| 页面名称       | `--pn, --page_name`      | page_name     | 否   |                                                  |
| 画板名称       | `--an, --artboard_name`  | artboard_name | 否   |                                                  |
| 矩形区域       | `-r, --rect`             | rect          | 否   | `[x, y, width, height]`                          |
| 排除矩形区域   | `-e, --exclude_rects`    | exclude_rects | 否   | `[[x, y, width, height], ...]`                   |
| 切图存放路径   | `--ap, --assets_path`    | assets_path   | 否   | 默认 `src/assets/sketch`                         |
| 保存结果到文件 | `--sr, --save_result`    | save_result   | 否   | 保存 JSON 到 `{input}.cache/` 目录，默认 `false` |

例：`npx -y mcp-sketch analyze -p /path/to/export.zip --pn 首页 --an 用户管理 -r "[0,0,1920,64]"`

## Skills & Agents

> **注意**：技能和 agent 仍在持续迭代优化中，AI 大模型存在不确定性。安装后请根据自身项目的实际需求灵活调整 prompt 内容和工具权限，以达到最佳效果。

### 安装

通过 CLI 一键安装技能和 agent 到当前项目：

```bash
npx -y mcp-sketch install
```

指定工作目录：

```bash
npx -y mcp-sketch install --cwd /path/to/project
```

交互式选择 AI 工具平台（Claude Code / OpenCode），自动将文件写入对应目录：

| 平台            | 技能目录            | agent 目录          |
| --------------- | ------------------- | ------------------- |
| **Claude Code** | `.claude/skills/`   | `.claude/agents/`   |
| **OpenCode**    | `.opencode/skills/` | `.opencode/agents/` |

> 目前仅支持 Claude Code 和 OpenCode 一键安装。其他工具（如 Trae、Cursor 等）如兼容 `.claude` 目录结构，可选择以 Claude Code 方式安装；否则请先以 Claude Code 方式安装，再对照安装后的文件内容手动粘贴到对应工具的合适位置。

安装后的文件结构：

```
{skills}/sketch-workflow/SKILL.md    ← 总指挥：定义 5 阶段流水线的状态机
{agents}/
├── sketch-init.md                  ← 子agent：项目架构师
├── sketch-pick.md                  ← 子agent：设计稿解析专员
├── sketch-split.md                 ← 子agent：资深前端架构师
├── sketch-layout.md                ← 子agent：布局工程师
└── sketch-draw.md                  ← 子agent：高级前端开发
```

### 工作流

主 agent 加载 `sketch-workflow` 技能后，按状态机调度 5 个子agent：

`sketch-init → sketch-pick → sketch-split → sketch-layout → sketch-draw`

每阶段执行：

1. 创建子agent 并传入参数
2. 等待子agent 返回 `SUCCESS`/`FAILED` 标记
3. 磁盘验证（不信任子agent 自述，以磁盘事实为准）
4. 更新 `sketch-cache/` 状态文件，进入下一阶段

> agents/\*.md 的 frontmatter（mode/tools/permission）为 opencode 专用格式。各平台的 agent 配置方式请查阅对应文档：[opencode agents](https://opencode.ai/docs/zh-cn/agents)、[Claude Code sub-agents](https://code.claude.com/docs/zh-CN/sub-agents)。各 agent 指令内容平台无关，均可在任意 AI 工具中使用。

## MCP 配置

MCP 模式需要设置环境变量 `MCP_MODE=1`，在 AI 工具中配置为本地 MCP 服务：

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

- **Trae / 其他兼容工具**

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

## 参数优先级

- **page**: `page_name` > 第一个 page
- **artboard**: `artboard_name` > 第一个 artboard
- **rect**（仅 analyze）: 过滤规则为元素 `x, y, x+width, y+height` 全部在矩形内才保留
- **exclude_rects**（仅 analyze）: 排除规则为元素 `x, y, x+width, y+height` 全部在任一排除矩形内则丢弃，与 `rect` 同时使用时先生效

## 返回结果

### list

`[{ pageName, artboardName, previewPath }]`（所有画板的数组）

### analyze

`{ artboard: { 图层、样式、图片等 }, previewPath: "预览图路径" }`

预览图使用 `sharp`（optionalDependencies）处理。若 `sharp` 安装失败（libvips 问题），返回原始画板图片；安装成功则调整尺寸、按 `rect` 截取、压缩为 webp。仅处理预览图，不处理切图。

### locate

`[{ name, type, rect: [x, y, w, h] }]`（前 n 个最影响布局的图层坐标列表）

### plan

`{ previewPath, filePath, pageName, artboardName, width, height }`

## 输出文件位置

- 切图：默认 `src/assets/sketch/`（可通过 `assets_path` 自定义）
- JSON 结果：`{input}.cache/` 目录下
- 预览图：`{input}.cache/` 目录下（webp 格式，sharp 不可用时为原始格式）

## 使用建议

- 传给 AI 的数据尽量不超过 50KB（本地 JSON 是格式化后的，传给 AI 的是紧凑格式）
- **推荐用 `rect` 参数模块化解析画板特定区域**

## 引导

<img width="359" height="438" alt="example" src="https://github.com/user-attachments/assets/ab7ba022-0cde-4c95-a060-c8f3adae035e" />
