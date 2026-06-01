---
name: sketch-split
description: 本技能会提取 sketch 设计稿 zip 里的单个画板信息并合理拆分为待开发组件
metadata:
  author: zhouyinkui
  version: '2026.06.01'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能基于 `mcp-sketch` 工具，利用 `plan` 命令提取画板基本信息和预览图，合理拆分为待开发组件，并创建相应的空白组件和描述文档

## 核心铁律

### 铁律 1：目录结构规范 (每个组件独立文件夹)

- **每个组件**：必须拥有**独立文件夹**，严禁平铺
- **公共组件**：`src/components/ComponentName/`（PascalCase 目录名）
- **页面特有组件**：`src/views/pageName/componentName/`（camelCase 目录名）
- 组件名使用 PascalCase，**至少由两个单词组成**（如 `UserTable`、`SidebarMenu`），避免单单词命名
- 文件命名：遵循项目现有规范

### 铁律 2：只拆解，不绘制

- 你**只负责**分析画板结构、输出组件规划表、创建空白组件
- **绝对禁止**编写任何具体代码或样式

### 铁律 3：必须输出组件规划表

- 规划表**必须包含**每个组件的 `rect` 坐标 `[x, y, width, height]`
- 对包含子组件的父组件，**必须同时包含** `exclude_rects`（直接子组件的 rects 列表）
- 没有规划表 = 任务失败，不得进入下一阶段

### 铁律 4：工作流模式下禁止询问

- 检测到 `execution_mode: "automated"` 时，直接输出规划表并创建文件

### 铁律 5：适配项目技术栈

- **永远不要假设项目使用 Vue / React 或其他框架**
- 创建空白组件文件前，先读取 `package.json` 和已有组件文件，确定后缀、写法、CSS 方案
- 组件骨架写法与项目现有代码保持一致

### 铁律 6：公共组件必须强制提取

- 以下元素**必须**无条件提取为公共组件（`type: common`），禁止作为页面特有组件：
  - **侧边栏菜单**（Sidebar）
  - **顶部导航栏**（Navbar / Header）
  - **面包屑导航**（Breadcrumb）
  - **用户头像/名称/退出按钮**组合
  - **页脚**（Footer）
  - **任何其他在多个画板中重复出现的布局元素**
- 公共组件统一放入 `src/components/ComponentName/`，**严禁**放入页面 `pageName/` 下
- 在创建前**必须**先检查 `src/components/`、`src/layouts/` 是否已有现成实现，有则直接复用、不创建空白文件

## 前置条件

- 在**工作流模式**下此技能通常作为 `skill: sketch-init` 的后续步骤，调用前应已存在主页面空白组件

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
- **工作流模式**：跳过步骤 4 的询问，直接执行步骤 5（创建文件）
- **独立运行模式**：按原计划输出组件规划表格，并询问用户是否认可

### 步骤 2：调用工具获取画板基本信息

- 根据参数推断：
  - `-p`: Sketch zip 文件路径
  - `--pn`: 页面名称
  - `--an`: 画板名称
- 调用工具：`npx -y mcp-sketch plan -p /path/to/zip --pn 页面名 --an 画板名`

### 步骤 3：读取预览图并分析画板结构

- **必须读取**工具返回的 `previewPath` 预览图
- 以资深前端开发的视角分析设计稿：
  - 识别页面中的独立功能区块
  - 判断哪些部分适合拆分为独立组件
  - 结合项目已有组件，避免重复创建
- **分类组件归属（铁律 6 强制规则）**：严格按铁律 6 的列表强制提取公共组件，其余按以下规则判断：
  - **页面特有组件**：当前页面内容区域内独有的功能区块（表格、表单、卡片列表等），放在页面 `pageName/` 下
- **确定父子层级关系**（关键：避免父组件重复渲染子组件区域）：
  - 遍历所有组件，若组件 A 的 `rect` 完全包含组件 B 的 `rect`，则 B 是 A 的直接子组件
  - 若 B 同时被 A 和 C 包含，取层级最近的（最内层容器）作为直接父组件
  - 例如：`Header [0,0,1920,64]` 包含 `Logo [20,10,100,44]`，则 Logo 是 Header 的直接子组件，Header 的 `exclude_rects` 为 `[[20,10,100,44]]`

### 步骤 4：输出组件规划表

- **工作流模式**：直接输出，不询问
- **独立运行模式**：输出后询问用户是否认可

**规划表格式（必须包含以下字段）**：

| 组件名称  | 组件路径                                     | 组件描述     | 类型          | rect 坐标             | exclude_rects (直接子组件) | 归属画板 |
| --------- | -------------------------------------------- | ------------ | ------------- | --------------------- | -------------------------- | -------- |
| Sidebar   | src/components/Sidebar                       | 左侧菜单栏   | common        | [0, 0, 200, 900]      | []                         | 用户管理 |
| Header    | src/components/Header                        | 顶部导航栏   | common        | [0, 0, 1920, 64]      | [[20, 10, 100, 44]]        | 用户管理 |
| UserTable | src/views/userManagement/userTable/UserTable | 用户列表表格 | page-specific | [200, 120, 1720, 600] | []                         | 用户管理 |

**字段说明**：

- **组件路径**：必须包含独立文件夹。公共组件在 `src/components/` 下，页面特有组件在 `src/views/pageName/` 下
- **类型**：`common` = 跨页面复用的布局/公共组件（侧边栏、导航栏、面包屑、用户头像等），`page-specific` = 仅当前页面独有的功能区块
- **rect 坐标**：`[x, y, width, height]` 格式，单位 px
- **exclude_rects**：该组件之下直接子组件的 rect 坐标列表。无子组件则为 `[]`。当 `skill: sketch-draw` 绘制此组件时，会将这些区域排除，避免父组件重复渲染子组件内容

### 步骤 5：创建空白组件和描述文档

根据规划表，为**每个组件**创建：

#### 5.1 目录结构 (强制)

按组件类型决定存放位置：

- 参照`铁律 1：目录结构规范`和`铁律 6：强制提取公共组件`，创建组件目录结构
- **严禁**将所有子组件文件平铺在同一个目录下

#### 5.2 空白组件

- 参照`铁律 5：适配项目技术栈`创建符合项目技术栈的空白组件骨架

```text
[文件] ComponentName.ext
- 仅最基本的空壳结构
- 不含任何业务代码、样式、逻辑
```

**注意**：组件内容**只能是空骨架**，不含任何业务代码或样式声明

#### 5.3 描述文档

- 文件名：`ComponentName.md`
- 位置：与组件文件同级
- 格式：

  ```markdown
  ---
  type: common | page-specific
  component_path: src/components/ComponentName(relative path)  # 公共组件 或
                    src/views/pageName/componentName/ComponentName(relative path) # 页面特有
  file_path: src/sketch/export.zip(relative path)
  page_name: somePage
  artboard_name: someArtboard
  rect: [x, y, width, height]
  exclude_rects: [[x1, y1, w1, h1], [x2, y2, w2, h2]] # 直接子组件的rect列表
  preview_path: src/path/to/previewImage(relative path)
  ---

  ### 组件描述

  组件功能描述

  ### 使用说明

  如果是公共组件，描述其在哪些页面中被复用
  ```

### 步骤 6：产物验证 (强制)

创建完成后，必须验证：

- [ ] 组件规划表已输出（包含所有组件的 rect 坐标和类型）
- [ ] 含子组件的父组件规划表中包含 `exclude_rects` 字段
- [ ] 公共组件（如侧边栏、导航栏）被标记为 `common` 类型，放在 `src/components/` 下而非页面 `pageName/` 下
- [ ] `src/components/` 下已有的公共组件未被重复创建
- [ ] 目录结构符合"每个组件独立文件夹"规范
- [ ] 所有空白组件文件已创建
- [ ] 所有 `.md` 描述文档已创建，且位于对应组件文件夹内

**如果任一检查项失败，输出错误并终止**

## 后续动作

- **工作流模式**下组件拆解完成后，**由 `skill: sketch-workflow` 调用 `skill: sketch-draw`** 进行代码生成

## 违规检测

如果你发现自己有以下行为，说明违反了技能规范：

- [ ] 将多个子组件或 `.md` 文件平铺在同一个 `pageName/` 目录下
- [ ] 在空白组件中编写了具体业务代码
- [ ] 没有输出组件规划表
- [ ] 规划表中缺少 rect 坐标
- [ ] 规划表中缺少 `exclude_rects`（对含子组件的父组件）
- [ ] 公共布局组件（侧边栏、导航栏等）未标记为 `common`，错误地放入页面 `pageName/` 下
- [ ] 没有创建 `.md` 描述文档
- [ ] 直接开始调用 `skill: sketch-draw`（应由 workflow 调用）
