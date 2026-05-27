---
name: sketch-draw
description: 当需要根据 sketch 设计稿 zip 里的画板绘制页面时，该技能会解析并提取出有效图层，切图和预览图供 AI 参考
metadata:
  author: zhouyinkui
  version: '2026.05.27'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能旨在使用工具分析 `sketch meaxure` 导出的 `zip` 文件，提取出有效图层、切图和预览图，作为 AI 绘制前端页面的参考。

## 核心铁律

### 铁律 1：必须基于 rect 坐标绘制

- 你**必须**接收 `rect` 参数 `[x, y, width, height]`
- 你**只能**绘制该矩形区域内的内容
- 没有 rect 参数 = 拒绝执行

### 铁律 2：必须调用 analyze 工具

- **禁止**仅凭预览图直接写代码
- **必须**先调用 `mcp-sketch analyze` 获取图层结构信息
- 工具返回的 `artboard` 数据是代码生成的唯一依据

### 铁律 3：工作流模式下静默执行

- 检测到工作流模式时，生成完毕后直接输出 `DRAW_SUCCESS`
- **禁止**询问"是否满意"或"是否需要调整"
- **禁止**输出总结性文字

## 前置条件

- 此技能通常由 `sketch-split` 触发，用于处理特定矩形区域（rect）的代码生成。
- 调用前应具备：
  - 画板的 `.md` 描述文档（含 rect 坐标）
  - 对应的空白组件文件

## 工具介绍

```shell
$ npx -y mcp-sketch analyze -h

Usage: mcp-sketch analyze [options]

parsing Sketch Meaxure exported HTML zip archives and extracting design structure information

Options:
  -p, --file_path <PATH>                Sketch HTML zip archive path
  --pn, --page_name [PAGENAME]          Page name
  --an, --artboard_name [ARTBOARDNAME]  Artboard name
  -r, --rect [RECT]                     Specify rectangular region to parse, format: [x, y, width, height] (x, y is top-left corner)
  --ap, --assets_path [ASSETSPATH]      Assets output path, default: src/assets/sketch
  --sr, --save_result [SAVERESULT]      Whether to save analysis result to local file, default: false
```

## 执行步骤

### 步骤 1：参数校验

在调用工具前，验证以下参数：

- [ ] `file_path`：Sketch zip 文件路径（必填）
- [ ] `page_name`：页面名称（必填）
- [ ] `artboard_name`：画板名称（必填）
- [ ] `rect`：矩形区域坐标 `[x, y, width, height]`（必填）
- [ ] `assets_path`：切图存放路径（可选，默认 `src/assets/sketch`）

**如果 rect 参数缺失，输出错误并拒绝执行。**

### 步骤 2：调用 analyze 工具

```shell
npx -y mcp-sketch analyze -p /path/to/zip --pn 页面名 --an 画板名 -r "[x,y,w,h]" --ap /path/to/assets
```

### 步骤 3：读取工具返回结果

工具返回格式：`{artboard: {...}, previewPath: "..."}`

#### 3.1 解析 artboard 数据

- 画板有固定长宽，绘制时需考虑响应式适配
- 各图层坐标相对于画板，`(0,0)` 为左上角，x 轴向右，y 轴向下
- 提取所有有效图层信息：
  - 文本图层：内容、字体、颜色、位置
  - 图片图层：文件名、位置、尺寸
  - 形状图层：类型、颜色、边框、圆角
  - 容器图层：子元素、布局方式

#### 3.2 读取预览图

- 使用 `previewPath` 读取预览图
- 核对 `artboard` 数据，确认没有遗漏重要图层
- 辅助理解组件的视觉层级关系

### 步骤 4：代码生成

根据工具返回的图层信息生成 Vue 组件代码。

#### 4.1 绘制原则

- **禁止绝对定位**：优先使用 flex/grid 布局
- **相对单位优先**：使用 `%`、`rem`、`vw/vh`，仅图标/固定尺寸元素使用 `px`
- **CSS 背景优先**：图片优先用 `background-image` 而非 `<img>`
- **语义化标签**：合理使用 `header`、`main`、`section`、`nav` 等
- **遵循项目规范**：
  - `<script setup lang="ts">`
  - `<style scoped lang="scss">`
  - 顺序：script → template → style
  - 无分号、单引号、无尾逗号、2 空格缩进

#### 4.2 组件结构

```vue
<template>
  <!-- 根据图层结构生成模板 -->
</template>

<script setup lang="ts">
// 根据需要定义响应式数据、方法
// 遵循项目 TypeScript 规范
</script>

<style scoped lang="scss">
// 根据设计稿生成样式
// 遵循项目 SCSS 规范
</style>
```

### 步骤 5：还原度自检

生成代码后，对照预览图自检：

- [ ] 布局结构与设计稿一致
- [ ] 元素位置关系正确
- [ ] 颜色、字体与设计稿一致
- [ ] 图片/图标正确引用
- [ ] 响应式适配合理
- [ ] 最低保证 90% 还原度

### 步骤 6：输出结果

#### 工作流模式下

```
组件 [ComponentName] 生成完毕
DRAW_SUCCESS
```

#### 独立运行模式下

输出完整代码，并询问用户是否满意。

## 约束

### 静默执行约束

当被 `sketch-workflow` 批量调用时：

- **禁止**在生成单个组件后询问用户"是否满意"或"是否需要调整"
- **禁止**输出任何总结性文字
- 只需输出"组件 [ComponentName] 生成完毕"
- 最后输出状态码 `DRAW_SUCCESS`，以便 Workflow 识别并启动下一个组件

### 代码质量约束

- 遵循项目 `.editorconfig` 和 `.prettierrc` 规范
- 遵循项目 AGENTS.md 中的编码规范
- 使用项目已有的组件库（Element Plus）
- 遵循项目命名规范（PascalCase 组件、camelCase 文件）

## 违规检测

如果你发现自己有以下行为，说明违反了技能规范：

- [ ] 没有调用 `mcp-sketch analyze` 就直接写代码
- [ ] 没有使用 rect 参数，绘制了整个画板而非指定区域
- [ ] 使用了绝对定位（`position: absolute`）作为主要布局方式
- [ ] 工作流模式下询问用户是否满意
- [ ] 工作流模式下输出总结性文字
- [ ] 没有输出 `DRAW_SUCCESS` 状态码
- [ ] 代码还原度明显低于 90%
