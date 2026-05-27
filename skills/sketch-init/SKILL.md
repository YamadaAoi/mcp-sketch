---
name: sketch-init
description: 当需要概览sketch设计稿zip里所有画板时，该技能会提取所有画板并规划路由
metadata:
  author: zhouyinkui
  version: '2026.05.26'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能旨在结合`sketch meaxure`导出的`zip`文件，使用工具提取所有画板基本信息，合理规划路由，并创建相应的空白组件和描述文档

## 工具介绍

```shell
$ npx -y mcp-sketch list -h

Usage: npx -y mcp-sketch list [options]

Returns the basic data for all artboards from the Sketch Meaxure export zip.

Options:
  -p, --file_path <PATH>                Sketch HTML zip archive path
```

## 步骤

### 1、根据用户输入，推断并组装用户提及的参数，调用工具获取所有画板信息

- 例：`概览sketch设计稿src/sketch/export.zip里的所有画板`
  - 推断【-p】参数为：`src/sketch/export.zip`，尝试获取文件绝对路径`/path/to/sketch/export.zip`
  - 调用工具分析文件：`npx -y mcp-sketch list -p /path/to/sketch/export.zip`

### 2、根据所有画板信息，制定任务，逐个创建组件和描述文档

- 制定任务，每一张画板对应一个任务，工具会返回每个画板的`pageName`、`artboardName`、`previewPath`
  - 读取画板的`previewPath`预览图，判断页面的内容和功能，推断是页面主入口还是同一页面的子页面，如弹窗，tab页等
  - 如果是页面主入口，创建对应的空白页面入口组件【ComponentName】和描述文档【ComponentName.md】，并根据项目情况添加到路由配置中
  - 如果是同一页面的子页面，根据对应的父页面组件【ComponentName】，在子文件夹内创建对应的空白子页面组件【ComponentName-子页面名称】和描述文档【ComponentName-子页面名称.md】
  - 注意项目已有组件，避免创建重复的组件和描述文档
  - 描述文档的格式如下：

```markdown
---
component_path: path/to/ComponentName
file_path: src/sketch/export.zip
page_name: somePage
artboard_name: someArtboard
preview_path: /path/to/preview.webp
---

### 组件描述

组件功能描述
```

### 3、检查创建的组件和描述文档是否是最优解

- 随着每个画板对应的任务的完成，你有了设计稿的整体视图，可以检查并调整组件和描述文档，确保其符合设计图的要求
- 注意组件之间的关系和交互，避免创建重复的组件和描述文档
- 注意组件的命名规范，避免使用过长或过短的名称

## 目标

- 结合设计稿合理规划组件，确保组件之间的关系和交互符合设计图的要求

```

```
