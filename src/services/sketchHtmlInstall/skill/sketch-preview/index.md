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

读取 `sketch-cache/proj-init.md`，获取：

- 启动命令（如 `vite`、`npm run dev` 等）
- 路由模式（hash 或 history）
- 监听端口

若文件不存在或缺少启动命令，返回失败信息：`proj-init.md 不存在或未配置启动命令`

### 步骤 2：确定路由路径

根据 `page_name` 确定路由路径：

- 读取 `sketch-cache/artboards/{page_name}-{artboard_name}.json`，获取入口页面组件路径
- 根据 `proj-init.md` 中的路由配置方式，确定该组件对应的路由路径

### 步骤 3：拼接预览 URL

根据路由模式拼接完整 URL：

- hash 模式：`http://localhost:{端口}/#/{路由路径}`
- history 模式：`http://localhost:{端口}/{路由路径}`

### 步骤 4：启动开发服务器（如未运行）

查看端口占用情况

- 若端口未被占用，打开**新终端窗口**，运行启动命令（根据操作系统选择不同的启动命令）
- 若端口已被占用，则认为项目已启动

### 步骤 5：打开浏览器

打开浏览器访问预览 URL，输出预览地址供用户确认

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
