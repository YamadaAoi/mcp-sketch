# Sketch Preview Skill

启动本地开发服务器并通过 Playwright MCP 打开浏览器预览布局效果，主动探索页面找到目标组件，等待用户确认

## 核心约束

- **禁止自行解压**任何压缩文件！
- **禁止直接读取设计稿文件**
- **禁止使用 `browser_evaluate` 或任何 JavaScript 注入方式直接修改页面状态/变量**，必须通过模拟真实用户操作（点击、滚动、切换 tab 等）使目标组件可见

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

### 步骤 3：启动开发服务

```bash
npx -y mcp-sketch dev -u "{previewUrl}"
```

`npx -y mcp-sketch dev` 会自动检测端口，若服务未启动则自动启动并等待就绪

### 步骤 4：浏览器预览与探索

检查是否拥有 Playwright MCP 工具（如 `browser_navigate`）：

- **不可用** → 输出警告，跳到步骤 5
- **可用** → `browser_navigate` 打开 `{previewUrl}`，优先通过模拟浏览器交互（点击、滚动、切换 tab 等）找到本次绘制的目标元素并展示给用户

若页面加载失败（白屏、控制台报错），检查 `browser_console_messages`，根据错误定位出错文件、分析原因（编译错误、运行时错误、框架兼容性问题等），输出诊断结果

### 步骤 5：输出

成功：

```
预览地址：{url}
请在浏览器中查看布局效果，确认后回复满意或反馈问题
PREVIEW_SUCCESS
```

页面加载失败：

```
页面加载失败，发现以下问题：
- 错误类型：{编译错误 | 运行时错误 | 框架兼容性问题}
- 错误信息：{具体错误描述}
- 出错文件：{文件路径}
- 修复建议：{建议如何修复}
PREVIEW_FAILED
```

找不到目标组件：

```
页面已加载但无法找到目标组件：
- 尝试操作：{点击了 xxx 按钮 / 切换了 xxx Tab / 滚动到 xxx 区域}
- 当前页面状态：{描述当前可见的内容}
PREVIEW_FAILED
```

Playwright 不可用：

```
⚠️ 未检测到 @playwright/mcp，无法自动打开浏览器预览。请在你的 AI 平台中配置 @playwright/mcp MCP 服务以获得浏览器预览能力
请在浏览器中打开 {previewUrl} 查看布局效果
PREVIEW_SUCCESS
```
