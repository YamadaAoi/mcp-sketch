---
name: sketch-plan
description: 当需要结合sketch meaxure导出的zip文件规划开发流程，该技能会解析并合理拆分出必要的组件
metadata:
  author: zhouyinkui
  version: '2026.05.22'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能旨在结合`sketch meaxure`导出的`zip`文件，使用工具分析指定页面，合理拆分出必要的组件，并创建相应的空白组件和描述文档

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

### 1、根据用户输入，推断并组装用户提及的参数，调用工具获取画板基本信息

- 例：`规划sketch meaxure导出的设计稿src/sketch/export.zip里的首页-用户管理画板`
  - 推断【-p】参数为：`src/sketch/export.zip`，尝试获取文件绝对路径`/path/to/sketch/export.zip`
  - 推断【--pn】参数为：`首页`
  - 推断【--an】参数为：`用户管理`
  - 调用工具分析文件：`npx -y mcp-sketch plan -p /path/to/sketch/export.zip --pn 首页 --an 用户管理`

### 2、作为一个前端高级开发，拥有丰富的根据UI图还原设计的经验，根据返回结果以表格形式输出最佳的组件规划，并询问用户是否认可

- 仔细分析设计图，将整个页面拆解为多个组件，组件的布局和位置符合设计图的要求
- 按照固定的格式返回各个组件的规划
  - 组件名称，如：`path/to/ComponentName`
  - 组件描述：组件的功能
  - 组件归属：设计文件路径、page_name、artboard_name 需要留存
  - 组件位置：组件在设计图中的位置，按照`[x,y,width,height]`的格式报错，精确到px，如：`[0,0,300,400]`

### 3、根据用户反馈，调整组件规划或创建空白组件和描述文档

- 若用户对组件规划有异议，需要根据用户反馈调整组件规划，直到用户认可为止
- 若用户认可组件规划，需要根据组件规划创建空白组件和描述文档【ComponentName.md】，文档内包含组件的路径、功能、位置、归属等信息。描述文档的格式如下：

```markdown
---
component_path: path/to/ComponentName
file_path: src/sketch/export.zip
page_name: somePage
artboard_name: someArtboard
rect: [0, 0, 300, 400]
---

### 组件描述

组件功能描述
```

## 目标

- 结合设计稿合理规划组件，确保组件之间的关系和交互符合设计图的要求
