# Sketch Preview Skill

启动本地开发服务器并通过 Playwright MCP 打开浏览器预览布局效果，等待用户确认

## 核心约束

- **禁止自行解压**任何压缩文件！
- **禁止直接读取设计稿文件**

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名
- `file_path` — 设计稿文件路径

`design_file_name = basename(file_path, '.zip')`

### 步骤 1：读取状态文件

读取 `.sketch-cache/artboards/{design_file_name}/{page_name}/{artboard_name}/progress.json`

- 若不存在，返回失败信息：`画板{page_name}-{artboard_name}未配置预览地址，请确认 layout 阶段已完成`

### 步骤 2：确认预览条件

检查 `previewUrl` 字段是否为空或 `UNKNOWN`

- **为空或 UNKNOWN** → 返回失败信息：`画板{page_name}-{artboard_name}未配置预览地址，请确认 layout 阶段已完成`
- **有值** → 继续

### 步骤 3：获取预览 URL

从状态文件获取 `previewUrl` 字段

### 步骤 4：启动开发服务

通过 bash 工具运行项目启动命令确保服务可用：

```bash
npx -y mcp-sketch dev -u "{previewUrl}"
```

- `mcp-sketch dev` 命令会自动读取环境变量获取项目配置（启动命令、项目根目录），检测端口是否可用。若服务未启动则自动打开新终端窗口运行启动命令并等待服务就绪

### 步骤 5：Playwright MCP 浏览器预览

检查当前是否拥有 Playwright MCP 提供的浏览器工具（如 `browser_navigate`）：

- **可用** → 使用 `browser_navigate` 打开 `{previewUrl}`，工具会自动启动浏览器访问页面。打开后等待用户确认。**不得使用 `browser_evaluate` 或 JavaScript 注入直接修改页面状态**
- **不可用** → 输出警告：

```
⚠️ 未检测到 @playwright/mcp，无法自动打开浏览器预览。请在你的 AI 平台中配置 @playwright/mcp MCP 服务以获得浏览器预览能力
```

无论是否可用，预览阶段都视为完成（用户可自行在浏览器中打开预览地址查看）

## 输出格式

成功：

```
预览地址：{url}
请在浏览器中查看布局效果，确认后回复满意或反馈问题
PREVIEW_SUCCESS
```

失败：

```
{错误描述}
PREVIEW_FAILED
```
