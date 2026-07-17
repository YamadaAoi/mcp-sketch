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

## 使用

### 切换到 Leader

- **OpenCode**：启动后按 `TAB` 切换到 `sketch-leader`
- **Claude Code**：`claude --agent sketch-leader`

### 场景一：创建新页面

```
根据设计稿 设计稿.zip，创建一个用户登录页
```

流程：选画板 → 拆分组件 → 生成骨架 → 布局（含路由） → 预览确认 → 绘制功能代码

### 场景二：插入到现有页面

```
根据设计稿 设计稿.zip，把右上角的用户信息卡片提取出来，插入到 /dashboard 页面
```

流程：选画板 → 拆分指定区域 → 组件内布局 → 绘制 → 插入到目标页面 → 预览确认

## 工具箱

| skill           | 归属 agent       | 说明                         |
| --------------- | ---------------- | ---------------------------- |
| sketch-pick     | sketch-analyzer  | 提取画板列表供用户选择       |
| sketch-split    | sketch-analyzer  | 分析画板，拆分组件           |
| sketch-preview  | sketch-analyzer  | 启动服务并预览页面           |
| sketch-init     | sketch-architect | 扫描项目，生成配置文档       |
| sketch-gen-base | sketch-architect | 生成基础组件骨架代码         |
| sketch-layout   | sketch-architect | 配置路由和父组件布局         |
| sketch-draw     | sketch-developer | 根据设计稿绘制组件功能代码   |
| sketch-code     | sketch-developer | 修改/重构/插入等无设计稿任务 |
| sketch-\*-check | sketch-checker   | 审核各阶段输出质量           |

## 环境变量

项目根目录 `.env.sketch`：

| 字段             | 必填 | 默认值                      | 说明                |
| ---------------- | ---- | --------------------------- | ------------------- |
| `CHROME_PATH`    | 是   | -                           | Chrome 路径         |
| `SERVER_COMMAND` | 是   | `npm run dev`               | 启动命令            |
| `CWD`            | 否   | 当前目录                    | 项目根目录          |
| `USER_DATA_DIR`  | 否   | `~/.mcp-sketch-chrome-data` | Chrome 用户数据目录 |
| `DEBUG_PORT`     | 否   | `9222`                      | 调试端口            |

> 配置本地开发服务器时关闭自动打开浏览器，例如 Vite 设置 `server.open: false`

## 前置依赖

预览和截图需后台启动本地服务。**Linux / macOS / WSL** 依赖 `tmux`：

```bash
brew install tmux        # macOS
sudo apt install tmux    # Ubuntu/Debian/WSL
```

Windows 无需额外安装

## 工具

> `npx -y mcp-sketch <cmd> --help` 查看完整参数

- **list** `[-f <path>]` — 列出画板
- **analyze** `-f <path> [--pn <page>] [--an <artboard>] [-r <rect>] [-e <rects>] [--ap <path>] [-l <n>] [-o <n>]` — 解析图层/样式/切图
- **preview** `-u <url>` — 打开浏览器预览，自动启动本地服务
- **screenshot** `-f <path> --pn <page> --an <artboard> -u <url>` — 截图用于视觉比对
- **state** `-f <path> --pn <page> --an <artboard> -c '<yaml>' [-r]` — 管理画板状态

切图输出：`src/assets/sketch/`，预览图：`.sketch-cache/artboards/{design_file_name}/`（webp）

## MCP 配置

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

## Demo

<img width="359" height="438" alt="example" src="https://github.com/user-attachments/assets/ab7ba022-0cde-4c95-a060-c8f3adae035e" />
