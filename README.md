# mcp-sketch

[English](./README_EN.md) | 中文

## 声明

- 使用**多模态模型**，`sketch-*`工作流需要分析预览图

## Agents

> **注意**：agents 仍在持续迭代优化中，AI 大模型存在不确定性。安装后请根据自身项目的实际需求灵活调整 prompt 内容和工具权限。

> 目前仅支持 Claude Code 和 OpenCode 一键安装。其他工具如兼容 `.claude` 目录结构，可选择以 Claude Code 方式安装。

### 安装

```bash
npx -y mcp-sketch install
```

交互式选择 AI 工具平台，自动将文件写入对应目录：

| 平台            | agent 目录          |
| --------------- | ------------------- |
| **Claude Code** | `.claude/agents/`   |
| **OpenCode**    | `.opencode/agents/` |

安装后的文件结构：

```
{agents}/
├── sketch-leader.md              ← 主agent：前端 Leader
├── sketch-init.md                ← 子agent：项目架构师
├── sketch-pick.md                ← 子agent：设计稿解析专员
├── sketch-split.md               ← 子agent：资深前端架构师
├── sketch-bound.md               ← 子agent：边界修正专员
├── sketch-gen-base.md            ← 子agent：基础组件生成
├── sketch-layout.md              ← 子agent：布局工程师
├── sketch-draw.md                ← 子agent：高级前端开发
└── sketch-draw-check.md          ← 子agent：组件审核专员
```

### Leader 架构

sketch-leader 是**主 agent**，用户直接与它对话，它负责分析需求、调度子 agent、审核结果、管理状态文件。

### 切换到 Leader

**OpenCode**：

- 启动`opencode`后通过`TAB`键切换到`sketch-leader`

**Claude Code**：

- 启动`claude`时指定`agent`为`sketch-leader`

```
claude --agent sketch-leader
```

切换后，你的所有消息都会发送给 sketch-leader，由它调度子 agent 完成工作。

### 工作流

| 阶段     | 子 agent          | 并行 |
| -------- | ----------------- | ---- |
| 初始化   | sketch-init       | ❌   |
| 选择画板 | sketch-pick       | ❌   |
| 组件拆分 | sketch-split      | ❌   |
| 边界修正 | sketch-bound      | ❌   |
| 生成骨架 | sketch-gen-base   | ✅   |
| 布局骨架 | sketch-layout     | ❌   |
| 绘制功能 | sketch-draw       | ✅   |
| 审核     | sketch-draw-check | ✅   |

### 使用方式

**新流程**：告诉 leader 你要实现什么页面，它会自动按工作流执行，layout 完成后暂停让你预览确认。

**修复模式**：告诉 leader 哪里有问题（如"间距太大"、"颜色不对"），它会分析问题、调用对应子 agent 修复。

**问题类型判断**：

| 问题                  | 调用谁        |
| --------------------- | ------------- |
| 组件划分不合理        | sketch-split  |
| 组件之间布局问题      | sketch-layout |
| 组件内部布局/样式问题 | sketch-draw   |
| 组件位置/大小不对     | sketch-bound  |

### 状态文件

- 项目配置：`sketch-cache/proj-init.md`
- 画板状态：`sketch-cache/artboards/{pageName}-{artboardName}.json`

Leader 在每个子 agent 完成后更新状态文件，中断后可恢复进度。所有文件路径使用相对路径。

## 工具

> 以下是底层工具，供 Agent 调用或单独使用。

### list

返回所有画板的基础信息（页面名称、画板名称、预览图路径）。

CLI: `npx -y mcp-sketch list [options]`
MCP: `sketch_html_list`

| 参数     | CLI 选项                 | MCP 参数  | 必填 | 说明       |
| -------- | ------------------------ | --------- | ---- | ---------- |
| 文件路径 | `-p, --file_path <PATH>` | file_path | 是   | zip 或目录 |

例：`npx -y mcp-sketch list -p /path/to/export.zip`

返回结果：`[{ pageName, artboardName, previewPath }]`

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

返回结果：`{ previewPath, filePath, pageName, artboardName, width, height }`

### locate

定位画板中最影响布局的前 `n` 个图层及其坐标，用于在 `sketch-split` 阶段修正组件规划表中的 `rect`。

CLI: `npx -y mcp-sketch locate [options]`
MCP: `sketch_html_locate`

| 参数     | CLI 选项                 | MCP 参数      | 必填 | 说明                    |
| -------- | ------------------------ | ------------- | ---- | ----------------------- |
| 文件路径 | `-p, --file_path <PATH>` | file_path     | 是   | zip 或目录              |
| 页面名称 | `--pn, --page_name`      | page_name     | 否   |                         |
| 画板名称 | `--an, --artboard_name`  | artboard_name | 否   |                         |
| 起始偏移 | `--offset`               | offset        | 否   | 起始索引（默认 0）      |
| 数量限制 | `--limit`                | limit         | 否   | 返回图层数量（默认 10） |

例：`npx -y mcp-sketch locate -p /path/to/export.zip --pn 首页 --an 用户管理 --limit 10`

返回结果：`[{ name, type, rect: [x, y, w, h] }]`

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

返回结果：`{ artboard: { 图层、样式、图片等 }, previewPath: "预览图路径" }`

预览图使用 `sharp`（optionalDependencies）处理。若 `sharp` 安装失败（libvips 问题），返回原始画板图片；安装成功则调整尺寸、按 `rect` 截取、压缩为 webp。仅处理预览图，不处理切图。

## 参数优先级

- **page**: `page_name` > 第一个 page
- **artboard**: `artboard_name` > 第一个 artboard
- **rect**（仅 analyze）: 过滤规则为元素 `x, y, x+width, y+height` 全部在矩形内才保留
- **exclude_rects**（仅 analyze）: 排除规则为元素 `x, y, x+width, y+height` 全部在任一排除矩形内则丢弃，与 `rect` 同时使用时先生效

## 输出文件位置

- 切图：默认 `src/assets/sketch/`（可通过 `assets_path` 自定义）
- JSON 结果：`{input}.cache/` 目录下
- 预览图：`{input}.cache/` 目录下（webp 格式，sharp 不可用时为原始格式）

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

## 引导

<img width="359" height="438" alt="example" src="https://github.com/user-attachments/assets/ab7ba022-0cde-4c95-a060-c8f3adae035e" />
