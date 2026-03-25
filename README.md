# mcp-sketch

本地 MCP 服务，用于解析 Sketch 设计文件并提取设计结构信息。

## 功能

- 解析 Sketch 文件并提取页面、画板、图层结构
- - 支持按 page、artboard、node 精确筛选
- - 输出设计结构 JSON 文件供 AI 参考
- 解析 Sketch 导出的 HTML zip 压缩包并提取设计结构（推荐）
- - 支持按 page、artboard 精确筛选
- - 输出设计结构 JSON 文件 和 预览图 供 AI 参考

## 使用方法

### 1. 配置 MCP 客户端

将本项目配置为本地 MCP 服务，以`opencode`文件为例：

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

### 2. 调用工具

使用 `sketch_analyze` 工具分析 Sketch 文件：

| 参数          | 类型    | 必填 | 说明                                       |
| ------------- | ------- | ---- | ------------------------------------------ |
| file_path     | string  | 是   | Sketch 文件路径                            |
| page_id       | string  | 否   | 页面 ID                                    |
| page_name     | string  | 否   | 页面名称                                   |
| artboard_id   | string  | 否   | 画板 ID                                    |
| artboard_name | string  | 否   | 画板名称                                   |
| node_id       | string  | 否   | 节点 ID                                    |
| node_name     | string  | 否   | 节点名称                                   |
| assets_path   | string  | 否   | 静态资源存放路径，默认 `src/assets/sketch` |
| saveResult    | boolean | 否   | 是否保存分析结果JSON文件(可选)，默认true   |

### 选择优先级

- **page**: `page_id` > `page_name` > 第一个 page
- **artboard**: `artboard_id` > `artboard_name` > 第一个 artboard
- **node**: `node_id` > `node_name` > 所有子节点

### 返回结果

工具会生成 JSON 文件，包含以下结构：

- **meta**: 描述信息
- **globalResources**: 共享样式和 Symbol 定义
- **layers**: 图层结构数组

## 使用 `sketch_html_analyze` 工具分析 Sketch HTML zip 压缩包

使用 `sketch_html_analyze` 工具分析从 Sketch 导出的 HTML 压缩包：

| 参数          | 类型    | 必填 | 说明                                       |
| ------------- | ------- | ---- | ------------------------------------------ |
| file_path     | string  | 是   | Sketch HTML 压缩包路径                     |
| page_id       | string  | 否   | 页面 ID                                    |
| page_name     | string  | 否   | 页面名称                                   |
| artboard_id   | string  | 否   | 画板 ID                                    |
| artboard_name | string  | 否   | 画板名称                                   |
| assets_path   | string  | 否   | 静态资源存放路径，默认 `src/assets/sketch` |
| saveResult    | boolean | 否   | 是否保存分析结果JSON文件(可选)，默认true   |

### 选择优先级

- **page**: `page_id` > `page_name` > 第一个 page
- **artboard**: `artboard_id` > `artboard_name` > 第一个 artboard

### sketch_analyze 示例

分析 Sketch 文件中第一个页面第一个画板全部图层：

```
sketch_analyze({ file_path: "/path/to/design.sketch" })
```

分析指定页面第一个画板全部图层：

```
sketch_analyze({ file_path: "/path/to/design.sketch", page_name: "首页" })
```

分析指定页面指定画板全部图层：

```
sketch_analyze({ file_path: "/path/to/design.sketch", page_name: "首页", artboard_name: "iPhone 14" })
```

分析指定页面指定画板指定节点：

```
sketch_analyze({ file_path: "/path/to/design.sketch", page_name: "首页", artboard_name: "iPhone 14", node_name: "按钮" })
```

### sketch_html_analyze 示例

分析 Sketch HTML 压缩包中第一个页面第一个画板：

```
sketch_html_analyze({ file_path: "/path/to/export.zip" })
```

分析指定页面第一个画板：

```
sketch_html_analyze({ file_path: "/path/to/export.zip", page_name: "首页" })
```

分析指定页面指定画板：

```
sketch_html_analyze({ file_path: "/path/to/export.zip", page_name: "首页", artboard_name: "iPhone 14" })
```

## 输出文件位置

- 解析的图片文件默认保存在 `src/assets/sketch/` 目录下（可通过 `assets_path` 参数自定义）。
- 解析的设计内容JSON文件默认与`file_path`同级，文件夹与`sketch`文件同名。

## 使用建议

- 建议使用 `sketch_html_analyze` 工具分析 Sketch HTML 压缩包，因为`sketch_analyze`只是简单地解析了 Sketch 文件的页面、画板、图层结构。而sketch导出的html已经进行了图形叠加渲染，所以解析的结果数据量相对较小，且相对准确。
- 推荐使用支持多模态的模型读取预览图修正设计结构。
