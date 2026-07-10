# Sketch Gen Base Skill

基于提供的组件规划布局数据，生成基础的组件代码

> ⚠️ **警告**：你**绝对禁止**新建、修改或删除 `.sketch-cache/artboards/` 目录下的任何 JSON 状态文件。状态文件仅由主流程维护，你只能通过上下文参数获取必要信息。

## 执行步骤

以下步骤中的 `page_name`、`artboard_name`、`component_path`、`errorDescription` 均由调用方传入上下文

### 步骤 1：读取 `.sketch-cache/proj-init.md` 确认技术栈、样式写法

- 若文件不存在，跳过之后所有步骤，返回失败信息：`proj-init.md 文件不存在`

### 步骤 2：读取 `.sketch-cache/artboards/{page_name}-{artboard_name}.json` 文件

- 若不存在，跳过之后所有步骤，返回失败信息：`画板{page_name}-{artboard_name}中间状态不存在`

### 步骤 3：检查`components`数组是否存在`component_path`组件

- 若不存在，跳过之后所有步骤，返回失败信息：`画板{page_name}-{artboard_name}中未找到 {component_path} 组件`

### 步骤 4：分析 `errorDescription`，确定修复方式

- 若包含
  - 1. 分析 `errorDescription`，判断问题类型：
    - **可简单修复**（格式问题如 prettier 格式异常、文件命名不规范、组件描述文档字段错误等表层问题）→ 定位到具体问题直接修正，修复完成后跳到输出格式，无需重新生成组件骨架
    - **需重新生成**（DOM 结构错误、组件类型错误、路径规划错误等深层问题）→ 查看之前的组件生成方案，带着 `errorDescription` 继续执行步骤 5
- 若不包含
  直接执行步骤 5

### 步骤 5：根据组件规划布局数据，生成基础的组件代码

调用方传入的 `component_path` 来自 `sketch-split` 的组件规划表，严格按照规划的路径和组件名创建文件。

- 1. 从 `component_path` 提取组件名（如 `src/views/loginPage/LoginPage.vue` → `LoginPage`），CSS 类名 = 组件名转 kebab-case（如 `LoginPage` → `login-page`）

- 2. 生成基础组件代码，**必须满足**以下要求：
  - **DOM结构约束**: 只包含**单个根节点**，类名为上一步得到的 kebab-case 值，严禁增加任何额外的包裹层或嵌套
  - **核心功能**: 作为一个占位容器，宽高撑满父级，内容显示组件名称
  - **样式约束**:
    - 宽度 100%，高度 100%
    - position: relative
    - 使用 Flex 布局实现组件名称的水平与垂直居中
    - 设置一个随机的护眼背景色（如浅绿、淡蓝等），透明度固定为 50%
  - **输出要求**:
    - 仅输出该基础组件的基础代码，不包含任何业务逻辑或额外的导入语句

- 3. 创建组件描述文档，位于组件同目录、同名、扩展名改为 `.md`（如 `LoginPage.vue` → `LoginPage.md`），格式如下：

  ```markdown
  ---
  type: page|common|page-specific
  component_path: relative/path/to/ComponentName
  file_path: relative/path/to/sketch/export.zip
  page_name: somePage
  artboard_name: someArtboard
  ---

  ## 组件描述
  ```

## 输出格式

成功：

```
已完成组件【componentPath】创建，组件描述文档【componentMdPath】已生成

GEN_BASE_SUCCESS
```

失败：

```
<错误描述>
GEN_BASE_FAILED
```
