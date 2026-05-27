# mcp-sketch

[English](./README_EN.md) | 中文

## 声明

- 工具会过滤一部分无意义图层，但不排除误过滤有效图层的情况
- 建议与设计师沟通：复杂效果切图，简单效果设 `radius`（哪怕 1）

## 工具

### list

返回所有画板的基础信息（页面名称、画板名称、预览图路径）。

CLI: `npx -y mcp-sketch list [options]`
MCP: `sketch_html_list`

| 参数     | CLI 选项                 | MCP 参数  | 必填 | 说明 |
| -------- | ------------------------ | --------- | ---- | ---- |
| zip 路径 | `-p, --file_path <PATH>` | file_path | 是   |      |

例：`npx -y mcp-sketch list -p /path/to/export.zip`

#### Skill: `npx skills@latest add YamadaAoi/mcp-sketch -s sketch-init`

- 结合 skill：AI 基于所有画板概览项目全貌、规划路由、创建空白组件和描述文档。

### plan

轻量规划，返回画板预览图路径及基本信息（宽高、名称），不提取图层细节。

CLI: `npx -y mcp-sketch plan [options]`
MCP: `sketch_html_plan`

| 参数     | CLI 选项                 | MCP 参数      | 必填 | 说明 |
| -------- | ------------------------ | ------------- | ---- | ---- |
| zip 路径 | `-p, --file_path <PATH>` | file_path     | 是   |      |
| 页面名称 | `--pn, --page_name`      | page_name     | 否   |      |
| 画板名称 | `--an, --artboard_name`  | artboard_name | 否   |      |

例：`npx -y mcp-sketch plan -p /path/to/export.zip --pn 首页`

#### Skill: `npx skills@latest add YamadaAoi/mcp-sketch -s sketch-split`

- 结合 skill：AI 基于设计图拆解组件、规划目录结构、创建组件描述文档。

### analyze

完整解析，提取图层结构、样式、切图，输出设计 JSON + 预览图。

CLI: `npx -y mcp-sketch analyze [options]`
MCP: `sketch_html_analyze`

| 参数           | CLI 选项                 | MCP 参数      | 必填 | 说明                                    |
| -------------- | ------------------------ | ------------- | ---- | --------------------------------------- |
| zip 路径       | `-p, --file_path <PATH>` | file_path     | 是   |                                         |
| 页面名称       | `--pn, --page_name`      | page_name     | 否   |                                         |
| 画板名称       | `--an, --artboard_name`  | artboard_name | 否   |                                         |
| 矩形区域       | `-r, --rect`             | rect          | 否   | `[x, y, width, height]`                 |
| 切图存放路径   | `--ap, --assets_path`    | assets_path   | 否   | 默认 `src/assets/sketch`                |
| 保存结果到文件 | `--sr, --save_result`    | save_result   | 否   | 保存 JSON 到 zip 同级目录，默认 `false` |

例：`npx -y mcp-sketch analyze -p /path/to/export.zip --pn 首页 --an 用户管理 -r "[0,0,1920,64]"`

#### Skill: `npx skills@latest add YamadaAoi/mcp-sketch -s sketch-draw`

- 结合 skill：AI 自动推断参数、调用工具、读预览图修正结构，输出高还原度页面。

### 工作流：一键生成

#### Skill: `npx skills@latest add YamadaAoi/mcp-sketch -s sketch-workflow`

- 结合 skill：AI 自动编排 init（规划）、split（拆解）、draw（绘制）三个技能，串联成完整流水线，实现"一键生成项目"的终极体验。

## MCP 配置

MCP 模式需要设置环境变量 `MCP_MODE=1`，在 AI 工具中配置为本地 MCP 服务：

- **opencode**

```json
{
  "mcp": {
    "mcp-sketch": {
      "type": "local",
      "command": ["npx", "-y", "mcp-sketch"],
      "enabled": true,
      "environment": { "MCP_MODE": "1", "LOG_LEVEL": "debug" }
    }
  }
}
```

- **Trae / 其他兼容工具**

```json
{
  "mcpServers": {
    "mcp-sketch": {
      "command": "npx",
      "args": ["-y", "mcp-sketch"],
      "env": { "MCP_MODE": "1" }
    }
  }
}
```

## 参数优先级

- **page**: `page_name` > 第一个 page
- **artboard**: `artboard_name` > 第一个 artboard
- **rect**（仅 analyze）: 过滤规则为元素 `x, y, x+width, y+height` 全部在矩形内才保留

## 返回结果

### list

`[{ pageName, artboardName, previewPath }]`（所有画板的数组）

### analyze

`{ artboard: { 图层、样式、图片等 }, previewPath: "预览图路径" }`

预览图使用 `sharp`（optionalDependencies）处理。若 `sharp` 安装失败（libvips 问题），返回原始画板图片；安装成功则调整尺寸、按 `rect` 截取、压缩为 webp。仅处理预览图，不处理切图。

### plan

`{ previewPath, filePath, pageName, artboardName, width, height }`

## 输出文件位置

- 切图：默认 `src/assets/sketch/`（可通过 `assets_path` 自定义）
- JSON 结果：与 zip 包同名的目录下

## 使用建议

- 使用多模态模型读取预览图修正设计结构
- 传给 AI 的数据尽量不超过 50KB（本地 JSON 是格式化后的，传给 AI 的是紧凑格式）
- **推荐用 `rect` 参数模块化解析画板特定区域**

## 引导

<img width="359" height="438" alt="example" src="https://github.com/user-attachments/assets/ab7ba022-0cde-4c95-a060-c8f3adae035e" />
