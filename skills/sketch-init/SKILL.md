---
name: sketch-init
description: 当需要概览sketch设计稿zip里所有画板时，该技能会提取所有画板并规划路由
metadata:
  author: zhouyinkui
  version: '2026.05.26'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能基于`mcp-sketch`工具，利用 list 模式轻量级提取 Sketch 导出 zip 中的所有画板（名称、预览图）。旨在通过多模态模型读取预览图，智能规划路由结构

## 工具介绍

`npx -y mcp-sketch list` 是专门用于全量解析 Sketch 导出包的命令。它会遍历 zip 内所有画板并返回结构化数据，是进行项目路由规划的前置必备步骤

```shell
$ npx -y mcp-sketch list -h

Usage: npx -y mcp-sketch list [options]

Returns the basic data for all artboards from the Sketch Meaxure export zip.

Options:
  -p, --file_path <PATH>                Sketch HTML zip archive path
```

## 步骤

### 1、判断执行模式与确认策略

- 检查对话历史或上下文，如果发现`sketch-workflow`的调用痕迹，或者包含“全自动”、“批量处理”、“流水线”等关键词
- **工作流模式**：强制开启“静默模式”。直接执行批量创建，绝对禁止输出“请确认路由图”并等待回复
- **独立运行模式**：如果画板数量超过 10 个，必须先展示规划的路由树状图，获得用户明确确认后再执行创建

### 2、根据用户输入，推断并组装用户提及的参数，调用工具获取所有画板信息

- 例：`概览sketch设计稿src/sketch/export.zip里的所有画板`
  - 推断【-p】参数为：`src/sketch/export.zip`，尝试获取文件绝对路径`/path/to/sketch/export.zip`
  - 调用工具分析文件：`npx -y mcp-sketch list -p /path/to/sketch/export.zip`

### 3、根据所有画板信息，制定任务，逐个创建组件和描述文档

- 如果画板数量超过 10 个
  - **在工作流模式下**：直接在后台生成路由树状图并创建文件，无需询问用户，直接输出“路由规划已完成，共发现 X 个页面”。
  - **在独立运行模式下**：先向用户展示规划的路由树状图，获得用户确认后再批量创建文件。
- 分析层级：遍历工具返回的画板列表，必须读取每个画板的`previewPath`缩略图。根据视觉内容判断其层级：
  - 主页面：具有独立导航入口的页面
  - 子页面/组件：弹窗、浮层、Tab内容等依附于主页面的元素
- 执行创建：
  - 主页面：创建空白组件【ComponentName】及描述文档【ComponentName.md】，并将其按规范插入到项目的路由配置文件中
  - 子页面：在父组件子目录下创建【ComponentName-SubName】及描述文档【ComponentName-SubName.md】，并在父组件的描述文档中建立关联引用
  - 在创建组件名【ComponentName】时，请遵循项目现有的命名规范（如 PascalCase 或 kebab-case）。在添加到路由配置时，必须先读取现有的路由文件，确保新路由的插入位置和格式与现有代码风格一致。
- 去重检查：在创建前，检查目标路径是否已存在同名文件，若存在则跳过
- 描述文档的格式如下：

```markdown
---
type: page | modal | component
component_path: path/to/ComponentName
file_path: src/sketch/export.zip
page_name: somePage
artboard_name: someArtboard
preview_path: /path/to/previewImage
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

## 后续动作

- 项目路由规划完成后，请调用`sketch-split`技能对具体的画板进行组件拆解
