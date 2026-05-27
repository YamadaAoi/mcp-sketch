---
name: sketch-init
description: 当需要概览 sketch 设计稿 zip 里所有画板时，该技能会提取所有画板并规划路由
metadata:
  author: zhouyinkui
  version: '2026.05.27'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能基于 `mcp-sketch` 工具，利用 list 模式轻量级提取 Sketch 导出 zip 中的所有画板（名称、预览图）。旨在通过多模态模型读取预览图，智能规划路由结构。

## 核心铁律

### 铁律 1：基于现状，能复用不重复 (关键)

- **路由复用**：在更新路由配置前，**必须**读取现有路由文件。如果路由已存在，**直接跳过**，禁止重复写入或覆盖。
- **文件复用**：在创建组件前，**必须**检查文件路径。如果文件已存在，**禁止覆盖**，提示跳过。
- **按需处理**：如果上下文提供了 `target_artboards` 列表，**只处理**列表中的画板，忽略其他。

### 铁律 2：目录结构规范 (每个组件独立文件夹)

- **主页面**：`src/views/page-name/PageName` + `PageName.md`
- **子组件/子页面**：必须拥有**独立文件夹**，严禁平铺。
  - 路径：`src/views/page-name/modules/component-name/ComponentName` + `ComponentName.md`
  - 目录名使用 kebab-case，文件名使用 PascalCase。
  - 每个子组件都在 `modules/` 下有自己的子目录。

### 铁律 3：只创建空白组件，不写业务代码

- 你创建的组件文件**只能包含基本骨架**。
- **绝对禁止**在 sketch-init 阶段编写任何具体的业务逻辑。
- 具体代码生成留给后续的 `sketch-split` 和 `sketch-draw`。

### 铁律 4：工作流模式下禁止询问

- 当检测到 `execution_mode: "automated"` 时，直接执行。

## 工具介绍

```shell
$ npx -y mcp-sketch list -h

Usage: npx -y mcp-sketch list [options]

Returns the basic data for all artboards from the Sketch Meaxure export zip.

Options:
  -p, --file_path <PATH>                Sketch HTML zip archive path
```

## 执行步骤

### 步骤 1：判断执行模式与确认策略

- 检查上下文是否包含 `{"execution_mode": "automated", "parent_workflow": true}`
- **工作流模式**：强制开启"静默模式"。直接执行批量创建。
- **独立运行模式**：如果画板数量超过 10 个，必须先展示规划的路由树状图，获得用户明确确认后再执行创建。

### 步骤 2：调用工具获取所有画板信息

- 根据用户输入推断参数：
  - 例：`概览 sketch 设计稿 src/sketch/export.zip 里的所有画板`
  - 推断 `-p` 参数为：`src/sketch/export.zip`，获取文件绝对路径。
  - 调用工具：`npx -y mcp-sketch list -p /path/to/sketch/export.zip`。

### 步骤 3：过滤与层级分析

- **过滤列表**：
  - 如果上下文提供了 `target_artboards` (选中的画板列表)，**仅遍历**该列表中的画板。
  - 如果未提供，则遍历所有画板。
- **层级分析**：
  - 遍历工具返回的画板列表，**必须读取每个画板的 `previewPath` 缩略图**。
  - 根据视觉内容判断层级：
    - **主页面**：具有独立导航入口的页面。
    - **子页面/组件**：弹窗、浮层、Tab 内容等依附于主页面的元素。
- 制定路由规划方案。

### 步骤 4：创建空白组件和描述文档 (核心步骤)

对**每个目标画板**执行：

- **现状检查 (强制)**：
  - 检查目标组件文件路径是否已存在。
  - **如果存在**：输出日志 `"跳过已存在的组件：[Path]"`，**不再创建**。
  - **如果不存在**：继续创建。

- **主页面处理**：
  - 目录：`src/views/kebab-case-name/`
  - 文件：`PageName` + `PageName.md`
  - 组件内容**只能是基本骨架**：

    ```vue
    <template>
      <div class="page-name"></div>
    </template>

    <script setup lang="ts"></script>

    <style scoped lang="scss"></style>
    ```

  - **描述文档 (`PageName.md`)**：

    ```markdown
    ---
    type: page
    component_path: src/views/kebab-case-name/PageName
    file_path: src/sketch/export.zip
    page_name: somePage
    artboard_name: someArtboard
    preview_path: path/to/previewImage
    ---

    ### 组件描述

    组件功能描述
    ```

- **子页面/组件处理**：
  - 目录：`src/views/parent-name/modules/component-name/`
  - 文件：`ComponentName` + `ComponentName.md`
  - 组件内容**只能是基本骨架**。
  - **描述文档**：同上，记录 `type: component` 或 `type: modal`。

### 步骤 5：路由配置更新 (现状检查)

- **读取现状**：读取现有路由文件（如 `src/router/index.ts`）。
- **检查复用**：
  - 遍历规划的路由，检查是否已存在于配置中。
  - **如果路由已存在**：直接跳过，**禁止重复写入**。
  - **如果路由不存在**：按项目规范插入新路由。
- **路径规范**：
  - 主页面：`@/views/page-name/PageName`
  - 子页面：`@/views/page-name/modules/component-name/ComponentName`
- **规范遵循**：
  - 遵循 lazy-load 规范：`component: () => import('@/views/...')`。
  - 保持与现有代码风格一致。

### 步骤 6：产物验证 (强制)

创建完成后，必须验证以下产物（针对目标画板）：

- [ ] 目录结构符合"每个组件独立文件夹"规范。
- [ ] 所有目标主页面的空白组件文件已创建（或确认已存在）。
- [ ] 所有目标子页面的空白组件文件已创建（或确认已存在），且位于 `modules/` 下的独立文件夹中。
- [ ] 所有对应的 `.md` 描述文档已创建，且位于对应组件文件夹内。
- [ ] 路由配置文件中已包含目标路由（或确认已存在）。

**如果任一检查项失败（且非跳过原因），输出错误信息并终止。**

## 输出格式

### 工作流模式下

```
路由规划已完成，共发现 X 个目标页面。
已创建/跳过空白组件 X 个，描述文档 X 个。
目录结构已规范化。
路由配置已更新/复用。
```

## 后续动作

- 项目路由规划完成后，**必须等待 `sketch-workflow` 调用 `sketch-split`** 进行组件拆解。
- 本技能**不负责**组件拆分和代码生成。

## 违规检测

如果你发现自己有以下行为，说明违反了技能规范：

- [ ] 将多个子组件或 `.md` 文件平铺在同一个 `modules/` 目录下。
- [ ] 覆盖了已存在的组件文件。
- [ ] 重复写入了已存在的路由。
- [ ] 忽略了 `target_artboards`，处理了未选中的画板。
- [ ] 在空白组件中编写了具体业务代码。
