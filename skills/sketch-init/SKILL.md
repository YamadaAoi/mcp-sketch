---
name: sketch-init
description: 本技能会提取 sketch 设计稿 (zip 或目录) 里所有画板并规划路由
metadata:
  author: zhouyinkui
  version: '2026.06.01'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能基于 `mcp-sketch` 工具，利用 `list` 命令轻量级提取 Sketch 导出文件（zip 或目录）中的所有画板（名称、预览图），通过多模态模型读取预览图，智能规划路由结构

# 阶段隔离声明

- 本技能只负责创建**空白组件**
- **禁止**在本阶段编写任何逻辑、样式、事件处理代码
- 完整代码必须在`skill: sketch-draw`阶段生成

## 核心铁律

### 铁律 1：基于现状，能复用不重复 (关键)

- **路由复用**：在更新路由配置前，**必须**读取现有路由文件。如果路由已存在，**直接跳过**，禁止重复写入或覆盖
- **文件复用**：在创建组件前，**必须**检查文件路径。如果文件已存在，**禁止覆盖**，提示跳过

### 铁律 2：目录结构规范 (每个组件独立文件夹)

- **主页面**：`src/views/pageName/PageName` + `PageName.md`
- **子组件/子页面**：必须拥有**独立文件夹**，严禁平铺
  - 路径：`src/views/pageName/componentName/ComponentName` + `ComponentName.md`
  - 目录名使用`camelCase`，文件名使用`PascalCase`
  - 组件名**至少由两个单词组成**（如 `UserTable`、`HeaderNav`），避免单单词命名
  - 每个子组件都在 `pageName/` 下有自己的子目录

### 铁律 3：必须经用户按需选择

- **无论工作流模式还是独立运行模式**，都必须展示画板列表供用户选择
- 提供"全部"选项，方便全选
- 禁止不经用户确认直接处理所有画板

### 铁律 4：适配项目技术栈

- **永远不要假设项目使用 Vue / React 或其他框架**
- 生成文件前，读取 `package.json` 的 `dependencies` 确定技术栈，查看已有组件文件确定写法
- 路由配置、组件文件后缀、导入方式都必须与项目现有代码一致

## 工具介绍

```shell
$ npx -y mcp-sketch list -h

Usage: npx -y mcp-sketch list [options]

Returns the basic data for all artboards from the Sketch Meaxure export archive (zip or folder).

Options:
  -p, --file_path <PATH>                Sketch HTML export path (zip or folder)
```

## 执行步骤

### 步骤 1：调用 list 获取全量画板

- 根据用户输入或参数推断 `-p` 文件路径
- 调用工具：`npx -y mcp-sketch list -p /path/to/sketch/export.zip`
- **list 仅在此处调用一次**，后续所有过滤与分析均基于本次返回结果

### 步骤 2：画板枚举与用户选择

- 展示所有画板列表（画板名 + 预览图），提供"全部"选项
- 根据当前工具环境选择最友好的交互方式供用户多选
- 等待用户选择，解析输入，生成目标画板列表

### 步骤 3：过滤与层级分析

- **过滤列表**：使用用户在步骤 2 中选择的画板列表
- **层级分析**：
  - 遍历工具返回的画板列表，**必须读取每个画板的 `previewPath` 缩略图**
  - 根据视觉内容判断层级：
    - **主页面**：具有独立导航入口的页面
    - **子页面/组件**：弹窗、浮层、Tab 内容等依附于主页面的元素
- 制定路由规划方案

### 步骤 4：创建空白组件和描述文档 (核心步骤)

对**每个目标画板**执行：

- **现状检查 (强制)**：
  - 检查目标组件文件路径是否已存在
  - **如果存在**：输出日志 `"跳过已存在的组件：[Path]"`，**不再创建**
  - **如果不存在**：继续创建

- **主页面处理**：
  - 目录：`src/views/camelCaseName/`
  - 文件：`PageName` + `PageName.md`
  - 组件内容**只能是空白组件**，技术栈由项目决定
  - **描述文档 (`PageName.md`)**：

    ```markdown
    ---
    type: page
    component_path: src/views/camelCaseName/PageName(relative path)
    file_path: src/sketch/export.zip(relative path)
    page_name: somePage
    artboard_name: someArtboard
    preview_path: src/path/to/previewImage(relative path)
    ---

    ### 组件描述

    组件功能描述
    ```

- **子页面/组件处理**：
  - 目录：`src/views/pageName/componentName/`
  - 文件：`ComponentName` + `ComponentName.md`
  - 组件内容**只能是空白组件**
  - **描述文档**：同上，记录 `type: component` 或 `type: modal`

### 步骤 5：路由配置更新 (现状检查)

- **读取现状**：找到项目中的路由配置文件（根据项目技术栈）
- **检查复用**：
  - 遍历规划的路由，检查是否已存在于配置中
  - **如果路由已存在**：直接跳过，**禁止重复写入**
  - **如果路由不存在**：按项目规范插入新路由，与现有路由写法保持一致
- **路径规范**：
  - 主页面：`src/views/pageName/PageName`
  - 子页面：`src/views/pageName/componentName/ComponentName`
- **规范遵循**：
  - 保持与现有代码风格一致（lazy-load / eager import / 其他模式）

### 步骤 6：产物验证 (强制)

创建完成后，**必须**逐个验证以下产物（针对目标画板）：

- [ ] 新建组件内容是否大于`10`行，如果大于`10`行，判断是否是空白组件
- [ ] 目录结构符合"每个组件独立文件夹"规范
- [ ] 所有目标主页面的空白组件文件已创建（或确认已存在）
- [ ] 所有目标子页面的空白组件文件已创建（或确认已存在），且位于 `pageName/` 下的独立文件夹中
- [ ] 所有对应的 `.md` 描述文档已创建，且位于对应组件文件夹内
- [ ] 路由配置文件中已包含目标路由（或确认已存在）

**如果任一检查项失败（且非跳过原因），输出错误信息并终止**

## 输出格式

输出必须包含已选画板列表，供 `sketch-workflow` 阶段 2 遍历，如果用户选择"全部"，则输出所有画板

```
路由规划已完成，共发现 X 个目标页面
已创建/跳过空白组件 X 个，描述文档 X 个
目录结构已规范化
路由配置已更新/复用

选中画板列表：
- page_name: 页面名1, artboard_name: 画板名1
- page_name: 页面名2, artboard_name: 画板名2
```

## 后续动作

- **工作流模式**下项目路由规划完成后，**必须等待 `skill: sketch-workflow` 调用 `skill: sketch-split`** 进行组件拆解

## 违规检测

如果你发现自己有以下行为，说明违反了技能规范：

- [ ] 将多个子组件或 `.md` 文件平铺在同一个 `pageName/` 目录下
- [ ] 覆盖了已存在的组件文件
- [ ] 重复写入了已存在的路由
- [ ] 在空白组件中编写了具体业务代码
