# mcp-sketch

[English](./README_EN.md) | 中文

<a href="https://glama.ai/mcp/servers/YamadaAoi/mcp-sketch">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/YamadaAoi/mcp-sketch/badge" />
</a>

本地 MCP 服务，用于解析 Sketch 导出的 HTML zip 压缩包并提取设计结构信息。

## 功能

- 解析 Sketch 导出的 HTML zip 压缩包并提取设计结构
  - 支持按 page、artboard 筛选
  - 支持指定矩形区域解析
  - 输出设计结构 JSON 和预览图供 AI 参考

## 使用方法

### 1. 配置 MCP 客户端

配置为本地 MCP 服务，具体配置方式参考各工具配置 MCP 的文档。

- `opencode`：

```json
{
  "mcp": {
    "mcp-sketch": {
      "type": "local",
      "command": ["npx", "-y", "mcp-sketch"],
      "enabled": true,
      "environment": {
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

- `Trae`：

```json
{
  "mcpServers": {
    "mcp-sketch": {
      "command": "npx",
      "args": ["-y", "mcp-sketch"]
    }
  }
}
```

### 2. 调用工具

使用 `sketch_html_analyze` 工具分析从 Sketch 导出的 HTML zip 压缩包：

| 参数          | 类型     | 必填 | 说明                                                                                                  |
| ------------- | -------- | ---- | ----------------------------------------------------------------------------------------------------- |
| file_path     | string   | 是   | Sketch HTML zip 压缩包路径                                                                            |
| page_id       | string   | 否   | 页面 ID                                                                                               |
| page_name     | string   | 否   | 页面名称                                                                                              |
| artboard_id   | string   | 否   | 画板 ID                                                                                               |
| artboard_name | string   | 否   | 画板名称                                                                                              |
| rect          | number[] | 否   | 指定解析矩形区域，格式为 `[x, y, width, height]`（x, y 为左上角坐标，width, height 为矩形宽度和高度） |
| assets_path   | string   | 否   | 切图存放路径，默认 `src/assets/sketch`                                                                |
| saveResult    | boolean  | 否   | 是否保存分析结果到本地文件，默认 `true`                                                               |

### 选择优先级

- **page**: `page_id` > `page_name` > 第一个 page
- **artboard**: `artboard_id` > `artboard_name` > 第一个 artboard
- **rect**: 指定解析矩形区域，过滤规则是只要元素的`x,y`在矩形内，就会被解析。

### 返回结果

工具会返回文本：`Sketch Structure JSON: {解析结果}\nSketch Preview Image: {预览图路径}`

- 解析结果
  - **meta**: 描述信息
  - **artboard**: 画板数据，包含图层、样式、图片等信息

### 示例

- 分析 Sketch HTML zip 压缩包中第一个页面第一个画板：

```
sketch_html_analyze({ file_path: "/path/to/export.zip" })
```

- 分析指定页面第一个画板：

```
sketch_html_analyze({ file_path: "/path/to/export.zip", page_name: "首页" })
```

- 分析指定页面指定画板：

```
sketch_html_analyze({ file_path: "/path/to/export.zip", page_name: "首页", artboard_name: "用户管理" })
```

- 分析指定页面指定画板指定区域，如解析用户管理画板顶部导航栏：

```
sketch_html_analyze({ file_path: "/path/to/export.zip", page_name: "首页", artboard_name: "用户管理", rect: [0, 0, 1920, 64] })
```

## 输出文件位置

- 解析的切图默认保存在 `src/assets/sketch/` 目录下（可通过 `assets_path` 自定义）
- 解析的设计内容默认保存到本地 JSON 文件中（用于人工审核），存放文件夹默认与 zip 包同名同级

## 使用建议

- 使用支持多模态的模型，可读取预览图修正设计结构
- 解析给 AI的数据量不超过`50KB`以提高 AI 分析准确率（本地存储的 JSON 文件是格式化后的，传递给 AI 的是紧凑格式）
- **推荐使用 `rect` 参数解析画板中的特定区域，模块化开发，提升颗粒度。**
