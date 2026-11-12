## 铁律

1. **禁止以任何方式解压任何压缩包**

## 调用 `sketch_list`（MCP 工具）或 `npx -y mcp-sketch list`（CLI）获取设计稿内所有画板信息

```bash
npx -y mcp-sketch list -f "{file_path}"
```

- 工具直接返回画板列表 JSON，同时写入 `.sketch-cache/{design_file_name}/list.json`（`design_file_name = basename(file_path, '.zip')`）
- 后续可直接读取 list.json，无需重复调用

## list.json文件格式

```json
{
  "artboards": [
    {
      "pageName": "...",
      "artboardName": "...",
      "size": 123,
      "previewPath": "..."
    }
  ],
  "tokens": {
    "colors": { "#FFFFFF": 381 },
    "fontSizes": { "14px": 484 },
    "fontFamilies": { "MicrosoftYaHei": 300 },
    "radii": { "4px": 128 },
    "shadows": { "0 2px 8px rgba(0,0,0,.15)": 20 },
    "styleNames": {
      "14px/☀️default/2正文 body": { "count": 244, "css": ["..."] }
    }
  }
}
```

### artboards 数组

| 字段         | 类型   | 描述                               |
| ------------ | ------ | ---------------------------------- |
| pageName     | string | 页面名称                           |
| artboardName | string | 画板名称                           |
| size         | number | 图层数据量（字节）                 |
| previewPath  | string | 画板预览图片路径（相对项目根目录） |

### tokens 对象

设计系统聚合，各字段均为 `{ 值: 使用次数 }` 并按频次降序：

- `colors` / `fontSizes` / `fontFamilies` / `radii` / `shadows`：颜色、字号、字体、圆角、阴影
- `styleNames`：设计师命名的共享样式（前 20 组），`css` 为该样式的代表性 CSS 声明

用途：建立项目主题变量时直接取高频值；发现近似色号并存时可向用户确认是否为设计笔误
