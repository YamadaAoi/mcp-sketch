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

| 平台            | agent 目录          | skill 目录          |
| --------------- | ------------------- | ------------------- |
| **Claude Code** | `.claude/agents/`   | `.claude/skills/`   |
| **OpenCode**    | `.opencode/agents/` | `.opencode/skills/` |

安装后的文件结构：

```
{agents}/
├── sketch-leader.md         ← 主 agent：前端 Leader
├── sketch-recorder.md       ← 子 agent：状态记录员
├── sketch-initializer.md    ← 子 agent：项目架构师
├── sketch-analyzer.md       ← 子 agent：分析师（pick/split/preview）
├── sketch-architect.md      ← 子 agent：架构师（gen-base/layout）
├── sketch-developer.md      ← 子 agent：开发工程师（draw）
└── sketch-checker.md        ← 子 agent：审核专员（所有 check）

{skills}/
├── sketch-pick/             ← 选择画板
├── sketch-split/            ← 组件拆分
├── sketch-split-check/      ← 拆分审核
├── sketch-gen-base/         ← 生成骨架
├── sketch-gen-base-check/   ← 骨架审核
├── sketch-layout/           ← 布局骨架
├── sketch-layout-check/     ← 布局审核
├── sketch-preview/          ← 预览布局
├── sketch-draw/             ← 绘制功能
├── sketch-draw-check/       ← 绘制审核
└── sketch-init-check/       ← 初始化审核
```

### Leader 架构

sketch-leader 是**主 agent**，用户直接与它对话，它负责分析需求、调度子 agent、审核结果。

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

| 阶段       | 子 agent           | skill                 | 并行 |
| ---------- | ------------------ | --------------------- | ---- |
| 初始化     | sketch-initializer | -                     | ❌   |
| 初始化审核 | sketch-checker     | sketch-init-check     | ❌   |
| 选择画板   | sketch-analyzer    | sketch-pick           | ❌   |
| 创建状态   | sketch-recorder    | -                     | ❌   |
| 组件拆分   | sketch-analyzer    | sketch-split          | ❌   |
| 拆分审核   | sketch-checker     | sketch-split-check    | ❌   |
| 记录拆分   | sketch-recorder    | -                     | ❌   |
| 生成骨架   | sketch-architect   | sketch-gen-base       | ✅   |
| 骨架审核   | sketch-checker     | sketch-gen-base-check | ✅   |
| 记录骨架   | sketch-recorder    | -                     | ❌   |
| 布局骨架   | sketch-architect   | sketch-layout         | ❌   |
| 布局审核   | sketch-checker     | sketch-layout-check   | ❌   |
| 预览布局   | sketch-analyzer    | sketch-preview        | ❌   |
| 记录布局   | sketch-recorder    | -                     | ❌   |
| 绘制功能   | sketch-developer   | sketch-draw           | ✅   |
| 绘制审核   | sketch-checker     | sketch-draw-check     | ✅   |
| 记录完成   | sketch-recorder    | -                     | ❌   |

### 使用方式

**新流程**：告诉 leader 你要实现什么页面，它会自动按工作流执行，layout 完成后暂停让你预览确认。

**修复模式**：告诉 leader 哪里有问题（如"间距太大"、"颜色不对"），它会分析问题、调用对应子 agent 修复。

**问题类型判断**：

| 问题                  | 调用谁          |
| --------------------- | --------------- |
| 组件划分不合理        | sketch-split    |
| 组件之间布局问题      | sketch-layout   |
| 组件内部布局/样式问题 | sketch-draw     |
| 基础组件代码不规范    | sketch-gen-base |

### 状态文件

- 项目配置：`sketch-cache/proj-init.md`
- 画板状态：`sketch-cache/artboards/{page_name}-{artboard_name}.json`

Leader 只能读取状态文件，所有写入操作委托给 sketch-recorder。中断后可恢复进度。所有文件路径使用相对路径。

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
| 数量限制       | `-l, --limit`            | limit         | 否   | 返回图层数量，根据画板复杂度自定义               |
| 起始偏移       | `-o, --offset`           | offset        | 否   | 从第 m 个图层开始返回（默认 0）                  |
| 保存结果到文件 | `--sr, --save_result`    | save_result   | 否   | 保存 JSON 到 `{input}.cache/` 目录，默认 `false` |

例：`npx -y mcp-sketch analyze -p /path/to/export.zip --pn 首页 --an 用户管理 -r "[0,0,1920,64]" --limit 20`

返回结果：`{ artboard: { 图层、样式、图片等 }, previewPath: "预览图路径" }`

预览图使用 `sharp`（optionalDependencies）处理。若 `sharp` 安装失败（libvips 问题），返回原始画板图片；安装成功则调整尺寸、按 `rect` 截取、压缩为 webp。

## 参数优先级

- **page**: `page_name` > 第一个 page
- **artboard**: `artboard_name` > 第一个 artboard
- **rect**（仅 analyze）: 过滤规则为元素 `x, y, x+width, y+height` 全部在矩形内才保留
- **exclude_rects**（仅 analyze）: 排除规则为元素 `x, y, x+width, y+height` 全部在任一排除矩形内则丢弃，与 `rect` 同时使用时先生效

## 输出文件位置

- 切图：默认 `src/assets/sketch/`（可通过 `assets_path` 自定义）
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
