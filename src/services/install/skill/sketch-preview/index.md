# Sketch Preview Skill

启动本地开发服务器并打开浏览器预览布局效果，等待用户确认

## 核心约束

- **禁止自行解压**任何压缩文件！
- **禁止直接读取设计稿文件**

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名

### 步骤 1：读取预览 URL

读取 `.sketch-cache/artboards/{page_name}-{artboard_name}.json`，获取 `previewUrl` 字段

若不存在，返回失败信息：`画板{page_name}-{artboard_name}未配置预览地址，请确认 layout 阶段已完成`

### 步骤 2：调用命令启动服务并打开浏览器预览

```bash
npx -y mcp-sketch preview -u "{previewUrl}"
```

- `mcp-sketch preview` 命令会自动读取环境变量获取项目配置（启动命令、项目根目录），检测端口是否可用。若服务未启动则自动打开新终端窗口运行启动命令，等待服务就绪后打开浏览器访问预览 URL

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
