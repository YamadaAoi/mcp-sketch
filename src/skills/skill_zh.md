---
name: sketch-html
description: 当需要分析sketch meaxure导出的zip文件，该技能会解析并提取出有效图层，切图和预览图。
metadata:
  author: zhouyinkui
  version: '2026.04.08'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能旨在使用工具分析`sketch meaxure`导出的`zip`文件，提取出有效图层，切图和预览图，作为`ai`绘制前端页面的参考。

## 步骤

### 1、调用帮助命令查看工具使用方法

```bash
npx -y mcp-sketch analyze -h
```

### 2、根据用户输入，推断并组装用户提及的参数，调用工具分析文件

- 例：`分析sketch meaxure导出的设计稿src/sketch/export.zip里的首页-用户管理画板头部[0,0,1920,64]，切图存到src/assets/images`
  - 推断【-p】参数为：`src/sketch/export.zip`，尝试分析文件绝对路径`/path/to/sketch/export.zip`
  - 推断【--pn】参数为：`首页`
  - 推断【--an】参数为：`用户管理`
  - 推断【-r】参数为：`[0,0,1920,64]`
  - 推断【--ap】参数为：`src/assets/images`，尝试分析目录绝对路径`/path/to/assets/images`
  - 调用工具分析文件：`npx -y mcp-sketch analyze -p /path/to/sketch/export.zip --pn 首页 --an 用户管理 --r "[0,0,1920,64]" --ap /path/to/assets/images`

### 3、读取工具返回结果

工具会返回文本：`{artboard: {解析结果}, previewPath: "预览图路径"}`

- `artboard`包含画板和有效图层的信息
  - 画板有固定长宽，绘制页面需考虑适配不同尺寸屏幕
  - 各图层坐标相对于画板，0,0为左上角，x轴向右，y轴向下
  - 罗列出图层里所有图片，优先采用css背景展示
  - 切记：避免使用绝对定位绘制页面，合理使用百分比、flex/grid等方式绘制更健壮的页面
- `previewPath`
  - 推荐读取预览图修正设计结构

## 目标

- 结合设计稿输出高质量自适应页面或组件，最低保证90%还原度
