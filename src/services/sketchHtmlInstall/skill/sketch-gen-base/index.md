# Sketch Gen Base Skill

基于提供的组件规划布局数据，生成基础的组件代码

> ⚠️ **警告**：你**绝对禁止**新建、修改或删除 `sketch-cache/artboards/` 目录下的任何 JSON 状态文件。状态文件仅由主流程维护，你只能通过上下文参数获取必要信息。

## 执行步骤

以下步骤中的 `page_name`、`artboard_name`、`component_path` 均由调用方传入上下文

### 步骤 1：读取 `sketch-cache/proj-init.md` 确认技术栈、样式写法

- 若文件不存在，跳过之后所有步骤，返回失败信息：`proj-init.md 文件不存在`

### 步骤 2：读取 `sketch-cache/artboards/{page_name}-{artboard_name}.json` 文件

> ⚠️ 仅读取，禁止修改此文件

- 若不存在，跳过之后所有步骤，返回失败信息：`画板{page_name}-{artboard_name}中间状态不存在`

### 步骤 3：检查`components`数组是否存在`component_path`组件

- 若不存在，跳过之后所有步骤，返回失败信息：`画板{page_name}-{artboard_name}中间状态不存在 {component_path} 组件`

### 步骤 4：根据组件规划布局数据，生成基础的组件代码

只关注以下字段：

```
**componentPath**：需要创建的组件路径
**rect**：组件的矩形区域，包含 x, y, width, height
```

- 1. 根据 `sketch-cache/proj-init.md` 中的技术栈生成标准基础组件，**必须满足**以下要求：
  - **组件名称**: ComponentName
  - **DOM结构约束**: 只包含**单个根节点**，类名为 component-name，严禁增加任何额外的包裹层或嵌套
  - **核心功能**: 作为一个占位容器，宽高撑满父级，内容显示组件名称
  - **样式约束**:
    - 宽度 100%，高度 100%
    - position: relative
    - 使用 Flex 布局实现组件名称的水平与垂直居中
    - 设置一个随机的护眼背景色（如浅绿、淡蓝等），透明度固定为 50%
  - **输出要求**:
    - 仅输出该基础组件的基础代码，不包含任何业务逻辑或额外的导入语句

- 2. 创建组件描述文档，**必须去掉组件文件扩展名**后加 `.md`（如 `component_path` 为 `src/views/login/Login.vue`，则描述文件为 `src/views/login/Login.md`），格式如下：

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

### 步骤 5：自校验

输出后必须自我验证：

1. 检查 `component_path` 组件文件是否存在
2. 检查组件是否有自己的专属同名文件夹
3. 检查组件描述文件是否存在（`component_path` 去掉扩展名加 `.md`，如 `Login.vue` → `Login.md`）且格式正确
4. 检查 DOM 结构：单根节点、根节点类名 `component-name`、根节点内只包含组件名称
5. 检查样式：宽高 100%、position relative、Flex 居中、护眼背景色（透明度 50%）
6. 确认没有导入语句
7. 运行 lint/typecheck：
   - lint：`eslint <component_path>`（精确到组件文件，无需全量扫描）
   - typecheck：`tsc --noEmit`（不支持指定文件，需全量检查，过滤 `component_path` 相关错误）
8. 有任一项不符合 → 定位并修复 → 重新验证（最多内部重试 3 次）
9. 若 3 次后仍未通过，返回 `GEN_BASE_FAILED`

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
