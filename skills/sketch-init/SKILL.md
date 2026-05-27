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

### 铁律 1：只创建空白组件，不写业务代码

- 你创建的组件文件**只能包含基本骨架**
- **绝对禁止**在 sketch-init 阶段编写任何具体的业务逻辑、样式、组件引用
- 具体代码生成留给后续的 `sketch-split` 和 `sketch-draw`

### 铁律 2：工作流模式下禁止询问用户

- 当检测到 `execution_mode: "automated"` 时，直接执行，不输出确认提示
- 独立运行模式下，画板超过 10 个才需要用户确认

## 工具介绍

`npx -y mcp-sketch list` 是专门用于全量解析 Sketch 导出包的命令。它会遍历 zip 内所有画板并返回结构化数据，是进行项目路由规划的前置必备步骤。

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
- **工作流模式**：强制开启"静默模式"。直接执行批量创建，绝对禁止输出"请确认路由图"并等待回复
- **独立运行模式**：如果画板数量超过 10 个，必须先展示规划的路由树状图，获得用户明确确认后再执行创建

### 步骤 2：调用工具获取所有画板信息

- 根据用户输入推断参数：
  - 例：`概览 sketch 设计稿 src/sketch/export.zip 里的所有画板`
  - 推断 `-p` 参数为：`src/sketch/export.zip`，获取文件绝对路径
  - 调用工具：`npx -y mcp-sketch list -p /path/to/sketch/export.zip`

### 步骤 3：分析画板层级并规划路由

- 遍历工具返回的画板列表，**必须读取每个画板的 `previewPath` 缩略图**
- 根据视觉内容判断层级：
  - **主页面**：具有独立导航入口的页面（如：登录页、设备管理、用户管理、审计管理）
  - **子页面/组件**：弹窗、浮层、Tab 内容等依附于主页面的元素
- 制定路由规划方案

### 步骤 4：创建空白组件和描述文档（核心步骤）

- **主页面处理**：
  - 创建空白组件文件（以vue组件 `src/views/login/LoginPage.vue`为例，如果是react或者其他框架，根据框架规范创建）
  - 组件内容**只能是基本骨架**，示例：

    ```vue
    <template>
      <div class="login-page"></div>
    </template>

    <script setup lang="ts"></script>

    <style scoped lang="scss"></style>
    ```

  - 创建描述文档 `LoginPage.md`，格式见下方
  - 将路由插入项目路由配置文件

- **子页面处理**：
  - 在父组件子目录下创建空白组件（以vue组件 `src/views/device-management/modules/DeviceStatus.vue`为例，如果是react或者其他框架，根据框架规范创建）
  - 创建描述文档 `DeviceStatus.md`
  - 在父组件描述文档中建立关联引用

- **去重检查**：创建前检查目标路径是否已存在同名文件，若存在则跳过

- **描述文档格式**：

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

### 步骤 5：路由配置更新

- 读取现有路由文件（如 `src/router/index.ts`）
- 按项目规范插入新路由
- 遵循 lazy-load 规范：`component: () => import('@/views/xxx/Xxx.vue')`
- 保持与现有代码风格一致

### 步骤 6：产物验证（强制）

创建完成后，必须验证以下产物：

- [ ] 所有主页面的空白组件文件已创建
- [ ] 所有子页面的空白组件文件已创建
- [ ] 所有对应的 `.md` 描述文档已创建
- [ ] 路由配置文件已更新
- [ ] 目录结构符合项目规范

**如果任一检查项失败，输出错误信息并终止，不得继续执行后续流程。**

## 输出格式

### 工作流模式下

```
路由规划已完成，共发现 X 个页面，Y 个子组件。
已创建空白组件 X 个，描述文档 X 个。
路由配置已更新。
```

### 独立运行模式下

先展示路由树状图，等待用户确认后输出相同结果。

## 后续动作

- 项目路由规划完成后，**必须等待 `sketch-workflow` 调用 `sketch-split`** 进行组件拆解
- 本技能**不负责**组件拆分和代码生成

## 违规检测

如果你发现自己有以下行为，说明违反了技能规范：

- [ ] 在空白组件中编写了具体业务代码（如表单、表格、按钮逻辑）
- [ ] 在空白组件中编写了具体样式（除了基本布局 class）
- [ ] 没有创建 `.md` 描述文档
- [ ] 没有更新路由配置
- [ ] 创建了组件但内容是完整的业务实现而非骨架
