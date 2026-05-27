---
name: sketch-split
description: 当需要根据sketch设计稿zip里的画板合理拆分出待开发组件时，该技能会提取画板基础信息和预览图供AI参考
metadata:
  author: zhouyinkui
  version: '2026.05.22'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能旨在结合`sketch meaxure`导出的`zip`文件，使用工具提取画板基本信息和预览图，合理拆分为待开发组件，并创建相应的空白组件和描述文档

## 前置条件

- 此技能通常作为 `sketch-init` 的后续步骤，用于对已规划的画板进行详细组件拆解。

## 工具介绍

```shell
$ npx -y mcp-sketch plan -h

Usage: npx -y mcp-sketch plan [options]

Returns the preview image path and other basic data for the specified artboard from the Sketch Meaxure export zip.

Options:
  -p, --file_path <PATH>                Sketch HTML zip archive path
  --pn, --page_name [PAGENAME]          Page name
  --an, --artboard_name [ARTBOARDNAME]  Artboard name
```

## 步骤

### 1、判断执行模式

- 检查当前任务是否由`sketch-workflow`触发（即上下文包含“工作流”、“全自动”等指令）
- **如果是工作流模式**：如果判定为工作流模式，请直接执行 步骤 5（创建文件），完全跳过 步骤 4 的输出和询问
- **如果是独立运行模式**：按原计划输出组件规划表格，并询问用户是否认可

### 2、根据用户输入，推断并组装用户提及的参数，调用工具获取画板基本信息

- 例：`拆分sketch设计稿src/sketch/export.zip里的 首页 - 用户管理 画板为空白组件`
  - 推断【-p】参数为：`src/sketch/export.zip`，尝试获取文件绝对路径`/path/to/sketch/export.zip`
  - 推断【--pn】参数为：`首页`
  - 推断【--an】参数为：`用户管理`
  - 调用工具分析文件：`npx -y mcp-sketch plan -p /path/to/sketch/export.zip --pn 首页 --an 用户管理`

### 3、作为一个前端高级开发，拥有丰富的根据UI图还原设计的经验，仅根据画板基本信息和预览图规划最佳的组件

- 仔细分析设计图，将整个页面拆解为多个组件，组件的布局和位置符合设计图的要求
- 结合项目中已有组件，避免重复创建相同组件

### 4、以表格形式输出最佳的组件规划，并询问用户是否认可，若用户认可则继续执行下一步，否则返回步骤3

- 按照固定的格式返回各个组件的规划
  - 组件名称（包含路径），如：`path/to/ComponentName`
  - 组件描述：组件的功能
  - 组件归属：设计文件路径、page_name、artboard_name 需要留存
  - 组件位置：组件在设计图中的位置，按照`[x,y,width,height]`的格式报错，精确到px，如：`[0,0,300,400]`

### 5、创建空白组件和描述文档

- 需要根据组件规划创建**空白**组件和描述文档【ComponentName.md】，文档内包含组件的路径、功能、位置、归属等信息。描述文档的格式如下：

```markdown
---
type: page | modal | component
component_path: path/to/ComponentName
file_path: src/sketch/export.zip
page_name: somePage
artboard_name: someArtboard
rect: [0, 0, 300, 400]
preview_path: /path/to/previewImage
---

### 组件描述

组件功能描述
```

## 目标

- 结合设计稿合理规划组件，确保组件之间的关系和交互符合设计图的要求

## 后续动作

- 当用户确认组件规划后，针对每一个需要开发的组件，请自动调用`sketch-draw`技能，并传入该组件对应的`rect`坐标区域，以生成高还原度的代码
- 可以询问用户：“已为您规划好组件结构。是否使用`sketch-draw`技能，针对 [组件名] 区域 [x,y,w,h] 进行精准代码生成”
