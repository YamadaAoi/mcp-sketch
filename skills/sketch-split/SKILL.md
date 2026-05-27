---
name: sketch-split
description: 当需要根据 sketch 设计稿 zip 里的画板合理拆分出待开发组件时，该技能会提取画板基础信息和预览图供 AI 参考
metadata:
  author: zhouyinkui
  version: '2026.05.27'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能旨在结合 `sketch meaxure` 导出的 `zip` 文件，使用工具提取画板基本信息和预览图，合理拆分为待开发组件，并创建相应的空白组件和描述文档。

## 核心铁律

### 铁律 1：目录结构规范 (每个组件独立文件夹)

- **子组件/子页面**：必须拥有**独立文件夹**，严禁平铺。
- 路径：`src/views/parent-name/modules/component-name/ComponentName` + `ComponentName.md`
- 目录名使用 kebab-case，文件名使用 PascalCase。

### 铁律 2：只拆解，不绘制

- 你**只负责**分析画板结构、输出组件规划表、创建空白组件。
- **绝对禁止**在 sketch-split 阶段编写任何具体代码或样式。
- 具体代码生成留给 `sketch-draw`。

### 铁律 3：必须输出组件规划表

- 规划表**必须包含**每个组件的 `rect` 坐标 `[x, y, width, height]`。
- 没有规划表 = 任务失败，不得进入下一阶段。

### 铁律 4：工作流模式下禁止询问

- 检测到 `execution_mode: "automated"` 时，直接输出规划表并创建文件。
- **严禁**询问如"您看这样拆分行吗？"

## 前置条件

- 此技能通常作为 `sketch-init` 的后续步骤。
- 调用前应已存在由 `sketch-init` 创建的主页面空白组件。

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

## 执行步骤

### 步骤 1：判断执行模式

- 检查上下文是否包含 `{"execution_mode": "automated", "parent_workflow": true}`
- **工作流模式**：直接执行步骤 5（创建文件），完全跳过步骤 4 的询问。
- **独立运行模式**：按原计划输出组件规划表格，并询问用户是否认可。

### 步骤 2：调用工具获取画板基本信息

- 根据参数推断：
  - `-p`: Sketch zip 文件路径。
  - `--pn`: 页面名称。
  - `--an`: 画板名称。
- 调用工具：`npx -y mcp-sketch plan -p /path/to/zip --pn 页面名 --an 画板名`。

### 步骤 3：读取预览图并分析画板结构

- **必须读取**工具返回的 `previewPath` 预览图。
- 以资深前端开发的视角分析设计稿：
  - 识别页面中的独立功能区块。
  - 判断哪些部分适合拆分为独立组件。
  - 结合项目已有组件，避免重复创建。

### 步骤 4：输出组件规划表

- **工作流模式**：直接输出，不询问。
- **独立运行模式**：输出后询问用户是否认可。

**规划表格式（必须包含以下字段）**：

| 组件名称  | 组件路径                                           | 组件描述       | 组件类型  | rect 坐标             | 归属画板 |
| --------- | -------------------------------------------------- | -------------- | --------- | --------------------- | -------- |
| Header    | views/layout/modules/Header                        | 页面头部导航栏 | component | [0, 0, 1920, 64]      | 用户管理 |
| UserTable | views/user-management/modules/user-table/UserTable | 用户列表表格   | component | [200, 120, 1720, 600] | 用户管理 |

**字段说明**：

- **组件路径**：必须包含独立文件夹，如 `modules/component-name/ComponentName`。
- **rect 坐标**：`[x, y, width, height]` 格式，单位 px。

### 步骤 5：创建空白组件和描述文档

根据规划表，为**每个组件**创建：

#### 5.1 目录结构 (强制)

- 主页面目录：`src/views/page-name/`
- 子组件目录：`src/views/page-name/modules/component-name/` (kebab-case 目录名)
- **严禁**将所有子组件文件平铺在 `modules/` 下。

#### 5.2 空白组件

```vue
<template>
  <div class="component-name"></div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.component-name {
}
</style>
```

**注意**：组件内容**只能是空骨架**。

#### 5.3 描述文档

- 文件名：`ComponentName.md`
- 位置：与组件文件同级。
- 格式：

  ```markdown
  ---
  type: component | modal
  component_path: src/views/parent-name/modules/component-name/ComponentName
  file_path: src/sketch/export.zip
  page_name: somePage
  artboard_name: someArtboard
  rect: [x, y, width, height]
  preview_path: path/to/previewImage
  ---

  ### 组件描述

  组件功能描述
  ```

### 步骤 6：产物验证 (强制)

创建完成后，必须验证：

- [ ] 组件规划表已输出（包含所有组件的 rect 坐标）。
- [ ] 目录结构符合"每个组件独立文件夹"规范。
- [ ] 所有空白组件文件已创建。
- [ ] 所有 `.md` 描述文档已创建，且位于对应组件文件夹内。

**如果任一检查项失败，输出错误并终止。**

## 后续动作

- 组件拆解完成后，**由 `sketch-workflow` 调用 `sketch-draw`** 进行代码生成。
- 本技能**不负责**代码绘制。

## 违规检测

如果你发现自己有以下行为，说明违反了技能规范：

- [ ] 将多个子组件或 `.md` 文件平铺在同一个 `modules/` 目录下。
- [ ] 在空白组件中编写了具体业务代码。
- [ ] 没有输出组件规划表。
- [ ] 规划表中缺少 rect 坐标。
- [ ] 没有创建 `.md` 描述文档。
- [ ] 直接开始调用 `sketch-draw`（应由 workflow 调用）。
