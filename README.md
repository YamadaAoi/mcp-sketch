# mcp-sketch

[English](./README_EN.md) | 中文

需**多模态模型**（分析预览图）。agents 持续迭代中，安装后按需调整 prompt 和权限

## 安装

```bash
npx -y mcp-sketch install
```

交互选择平台，写入对应目录：

| 平台            | agent 目录          | skill 目录          |
| --------------- | ------------------- | ------------------- |
| **Claude Code** | `.claude/agents/`   | `.claude/skills/`   |
| **OpenCode**    | `.opencode/agents/` | `.opencode/skills/` |

安装后结构：

- `sketch-leader` — 主 agent
- `sketch-initializer` / `sketch-analyzer` / `sketch-architect` / `sketch-developer` / `sketch-checker` — 子 agent
- `sketch-pick` / `sketch-split` / `sketch-gen-base` / `sketch-layout` / `sketch-preview` / `sketch-draw` / `sketch-screenshot-check` / `*check` — skill

## 使用

**新流程**：告诉 leader 要实现什么页面，自动按工作流执行，layout 完成后暂停预览确认

**修复模式**：告诉 leader 问题（"间距太大""颜色不对"），它分析后调度对应子 agent 修复

### 切换到 Leader

- **OpenCode**：启动后按 `TAB` 切换到 `sketch-leader`
- **Claude Code**：`claude --agent sketch-leader`

### 工作流

| 阶段               | 子 agent           | skill                   | 并行 |
| ------------------ | ------------------ | ----------------------- | ---- |
| 初始化             | sketch-initializer | -                       | ❌   |
| 初始化审核         | sketch-checker     | sketch-init-check       | ❌   |
| 选择画板           | sketch-analyzer    | sketch-pick             | ❌   |
| 组件拆分           | sketch-analyzer    | sketch-split            | ❌   |
| 拆分审核           | sketch-checker     | sketch-split-check      | ❌   |
| 展示结果，等待确认 | -                  | -                       | ❌   |
| 生成骨架           | sketch-architect   | sketch-gen-base         | ✅   |
| 骨架审核           | sketch-checker     | sketch-gen-base-check   | ✅   |
| 布局骨架           | sketch-architect   | sketch-layout           | ❌   |
| 布局审核           | sketch-checker     | sketch-layout-check     | ❌   |
| 预览布局           | sketch-analyzer    | sketch-preview          | ❌   |
| 绘制功能           | sketch-developer   | sketch-draw             | ✅   |
| 绘制审核           | sketch-checker     | sketch-draw-check       | ✅   |
| 截图比对           | sketch-checker     | sketch-screenshot-check | ❌   |

### 状态文件

`.sketch-cache/artboards/{design_file_name}/{page_name}-{artboard_name}.json`，通过 `mcp-sketch state` 管理，中断可恢复

### 环境变量

项目根目录 `.env.sketch`：

| 字段             | 必填 | 默认值                      | 说明                |
| ---------------- | ---- | --------------------------- | ------------------- |
| `CHROME_PATH`    | 是   | -                           | Chrome 路径         |
| `SERVER_COMMAND` | 是   | `npm run dev`               | 启动命令            |
| `CWD`            | 否   | 当前目录                    | 项目根目录          |
| `USER_DATA_DIR`  | 否   | `~/.mcp-sketch-chrome-data` | Chrome 用户数据目录 |
| `DEBUG_PORT`     | 否   | `9222`                      | 调试端口            |

> **建议**：配置本地开发服务器时关闭自动打开浏览器，例如 Vite 项目设置 `server.open: false`

### 前置依赖

预览和截图需后台启动本地服务。**Linux / macOS / WSL** 依赖 `tmux`：

```bash
brew install tmux        # macOS
sudo apt install tmux    # Ubuntu/Debian/WSL
```

Windows 无需额外安装

## 工具

> 所有工具可用 `npx -y mcp-sketch <cmd> --help` 查看完整参数

- **list** `[-f <path>]` — 返回画板列表 `[{pageName, artboardName, previewPath}]`
- **analyze** `-f <path> [--pn <page>] [--an <artboard>] [-r <rect>] [-e <rects>] [--ap <path>] [-l <n>] [-o <n>]` — 解析图层/样式/切图，输出 JSON + 预览图
- **preview** `-u <url>` — 打开浏览器访问 URL，自动启动本地服务
- **screenshot** `-f <path> --pn <page> --an <artboard> -u <url>` — 截图保存，用于视觉比对
- **state** `-f <path> --pn <page> --an <artboard> -c '<yaml>' [-r]` — 创建/更新画板状态，YAML 格式要求：外层 `"`，值用单引号，冒号后空格

输出位置：切图默认 `src/assets/sketch/`，预览图在 `.sketch-cache/artboards/{design_file_name}/`（webp）

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

## Demo

<img width="359" height="438" alt="example" src="https://github.com/user-attachments/assets/ab7ba022-0cde-4c95-a060-c8f3adae035e" />
