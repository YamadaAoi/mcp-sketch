# Sketch Preview Skill

启动本地开发服务器并打开浏览器预览布局效果，等待用户确认

## 核心约束

- **禁止自行解压**任何压缩文件！
- **禁止直接读取设计稿文件**

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名

### 步骤 1：读取项目配置

读取 `.sketch-cache/proj-init.md`，获取启动命令（如 `npm run dev`、`pnpm dev` 等）

若文件不存在或缺少启动命令，返回失败信息：`proj-init.md 不存在或未配置启动命令`

### 步骤 2：读取预览 URL

读取 `.sketch-cache/artboards/{page_name}-{artboard_name}.json`，获取 `previewUrl` 字段

若不存在，返回失败信息：`画板{page_name}-{artboard_name}未配置预览地址，请确认 layout 阶段已完成`

### 步骤 3：调用 preview 启动服务并打开浏览器

- **Windows**

```bash
Start-Process cmd -ArgumentList '/c npx -y mcp-sketch preview -u "{previewUrl}" -c "{启动命令}" -p "{项目根目录}"'
```

- **macOS**：使用`osascript`启动新窗口并运行`npx -y mcp-sketch preview`命令

- **Linux**: 使用`x-terminal-emulator`启动新窗口并运行`npx -y mcp-sketch preview`命令

**参数说明**：

| 参数 | 必填 | 说明                                                                                                       |
| ---- | ---- | ---------------------------------------------------------------------------------------------------------- |
| `-u` | ✅   | 预览 URL，从状态文件 `previewUrl` 获取                                                                     |
| `-c` | ✅   | 启动命令，从 `proj-init.md` 中读取                                                                         |
| `-p` | ❌   | 项目根目录。如果当前工作目录就是项目根目录（能直接运行启动命令），则无需传；否则需要传入 `-p` 指定项目路径 |

`preview` 命令会自动检测端口是否可用，若服务未启动则在新的终端窗口中运行启动命令，等待服务就绪后打开浏览器访问预览 URL

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
