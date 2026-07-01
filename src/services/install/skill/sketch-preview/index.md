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

读取 `.sketch-cache/proj-init.md`，获取：

- 启动命令（如 `vite`、`npm run dev` 等）
- 路由模式（hash 或 history）
- 监听端口

若文件不存在或缺少启动命令，返回失败信息：`proj-init.md 不存在或未配置启动命令`

### 步骤 2：确定路由路径

读取 `.sketch-cache/artboards/{page_name}-{artboard_name}.json`，获取入口页面组件的 `componentPath`（`type: page` 的组件）。

读取项目路由配置文件（`proj-init.md` 中记录的路由文件位置），在路由定义中查找该组件对应的路由路径：

- Vue Router：在 `router/index.ts` 中查找 `component: () => import('...组件路径...')` 对应的 `path`
- React Router：在路由配置文件中查找 `element={<...组件名... />}` 或 `lazy: () => import('...')` 对应的 `path`
- 其他路由方案：同理，根据实际配置查找

若找不到对应路由，返回失败信息：`未找到组件 {componentPath} 对应的路由配置`

### 步骤 3：拼接预览 URL

根据路由模式拼接完整 URL：

- hash 模式：`http://localhost:{端口}/#/{路由路径}`
- history 模式：`http://localhost:{端口}/{路由路径}`

### 步骤 4：检测端口是否已启动

```bash
npx -y mcp-sketch check-port -p {端口}
```

- 若返回 `open`（端口已被占用）→ 跳到步骤 6（直接打开浏览器）
- 若返回 `closed`（端口未被占用）→ 继续步骤 5

### 步骤 5：在新终端窗口启动开发服务器

先检测当前运行平台，再用对应命令打开新终端：

**Windows（PowerShell）**：

```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '{项目根目录}'; {启动命令}"
```

**Windows（cmd）**：

```cmd
Start-Process cmd -ArgumentList "/k", "cd /d {项目根目录} && {启动命令}"
```

**macOS**：

```bash
osascript -e 'tell application "Terminal" to do script "cd {项目根目录} && {启动命令}"'
```

**Linux（gnome-terminal）**：

```bash
gnome-terminal -- bash -c "cd {项目根目录} && {启动命令}; exec bash"
```

**Linux（xterm，备选）**：

```bash
xterm -e "cd {项目根目录} && {启动命令}"
```

### 步骤 6：打开浏览器访问预览 URL

```bash
npx -y mcp-sketch preview -u {预览URL}
```

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
