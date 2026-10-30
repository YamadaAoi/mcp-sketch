## 铁律

1. **禁止以任何方式解压任何压缩包**

## 调用 `sketch_list`（MCP 工具）或 `npx -y mcp-sketch list`（CLI）获取设计稿内所有画板信息

```bash
npx -y mcp-sketch list -f "{file_path}"
```

- 工具直接返回画板列表 JSON，同时写入 `.sketch-cache/{design_file_name}/list.json`（`design_file_name = basename(file_path, '.zip')`）
- 后续可直接读取 list.json，无需重复调用

## list.json文件格式

| 字段         | 类型   | 描述               |
| ------------ | ------ | ------------------ |
| pageName     | string | 页面名称           |
| artboardName | string | 画板名称           |
| size         | number | 图层数据量（字节） |
| previewPath  | string | 画板预览图片路径   |
