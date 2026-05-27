---
name: sketch-draw
description: 当需要根据sketch设计稿zip里的画板绘制页面时，该技能会解析并提取出有效图层，切图和预览图供AI参考
metadata:
  author: zhouyinkui
  version: '2026.04.08'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能旨在使用工具分析`sketch meaxure`导出的`zip`文件，提取出有效图层，切图和预览图，作为`ai`绘制前端页面的参考

## 前置条件

- 此技能通常由`sketch-split`触发，用于处理特定矩形区域（rect）的代码生成。请专注于利用`rect`参数进行局部精准解析

## 工具介绍

```shell
$ npx -y mcp-sketch analyze -h

Usage: mcp-sketch analyze [options]

parsing Sketch Meaxure exported HTML zip archives and extracting design structure information

Options:
  -p, --file_path <PATH>                Sketch HTML zip archive path
  --pn, --page_name [PAGENAME]          Page name
  --an, --artboard_name [ARTBOARDNAME]  Artboard name
  -r, --rect [RECT]                     Specify rectangular region to parse, format: `[x, y, width, height]` (x, y is top-left corner)
  --ap, --assets_path [ASSETSPATH]      Assets output path, default: `src/assets/sketch`
  --sr, --save_result [SAVERESULT]      Whether to save analysis result to local file, default: `false` (default: false)
```

## 步骤

### 1、根据用户输入，推断并组装用户提及的参数，调用工具分析文件， 推荐用 rect 参数模块化解析画板特定区域

- 例：`绘制sketch设计稿src/sketch/export.zip里的 首页 - 用户管理 画板头部[0,0,1920,64]，切图存到src/assets/images`
  - 推断【-p】参数为：`src/sketch/export.zip`，尝试获取文件绝对路径`/path/to/sketch/export.zip`
  - 推断【--pn】参数为：`首页`
  - 推断【--an】参数为：`用户管理`
  - 推断【-r】参数为：`[0,0,1920,64]`
  - 推断【--ap】参数为：`src/assets/images`，尝试分析目录绝对路径`/path/to/assets/images`
  - 调用工具分析文件：`npx -y mcp-sketch analyze -p /path/to/sketch/export.zip --pn 首页 --an 用户管理 -r "[0,0,1920,64]" --ap /path/to/assets/images`

### 2、读取工具返回结果

工具会返回文本：`{artboard: {解析结果}, previewPath: "预览图路径"}`

- `artboard`包含画板和有效图层的信息
  - 画板有固定长宽，绘制页面需考虑适配不同尺寸屏幕
  - 各图层坐标相对于画板，0,0为左上角，x轴向右，y轴向下
  - 罗列出图层里所有图片，优先采用css背景展示
  - 切记：避免使用绝对定位绘制页面，合理使用百分比、flex/grid等方式绘制更健壮的页面，优先使用相对单位（%、rem、vw/vh）而非绝对像素(px)，除非是图标或固定尺寸元素
- `previewPath`
  - 推荐读取预览图修正设计结构，核对`artboard`里的无效图层或未提及的图层

## 目标

- 结合设计稿输出高质量自适应页面或组件，最低保证90%还原度

## 约束

- **静默执行约束**：当被`sketch-workflow`批量调用时，**禁止**在生成单个组件后询问用户“是否满意”或“是否需要调整”。只需在控制台输出“组件 [ComponentName] 生成完毕”，并继续处理下一个
- 如果当前组件绘制成功，且上下文显示处于工作流中，不要输出任何总结性文字，直接输出状态码 DRAW_SUCCESS，以便 Workflow 脚本识别并立即启动下一个组件的绘制
