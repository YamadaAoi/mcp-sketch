# Sketch Layout Skill

配置画板对应页面的路由，为父组件编写子组件的 import 语句和 div 容器，搭建组件层级骨架。具体的组件细节绘制由后续 高级前端开发 负责

> ⚠️ **警告**：你**绝对禁止**新建、修改或删除 `sketch-cache/artboards/` 目录下的任何 JSON 状态文件。状态文件仅由主流程维护，你只能通过上下文参数获取必要信息。

## 核心约束

- **禁止自行解压**任何压缩文件！
- **禁止直接读取设计稿文件**

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名
- `errorDescription`（可选） — 修复模式下传入的用户反馈，描述布局问题

### 步骤 1：读取 `sketch-cache/proj-init.md` 确认技术栈、样式写法、路由文件位置、导入方式、本地开发服务器配置

- 若文件不存在，跳过之后所有步骤，返回失败信息：`proj-init.md 文件不存在`

### 步骤 2：读取 `sketch-cache/artboards/{page_name}-{artboard_name}.json` 文件

- 若不存在，跳过之后所有步骤，返回失败信息：`画板{page_name}-{artboard_name}中间状态不存在`

### 步骤 3：检查`components`字段是否为非空数组

- 若不是，跳过之后所有步骤，返回失败信息：`画板{page_name}-{artboard_name}中间状态不存在 components 字段`

### 步骤 4：查看输入参数是否包含`errorDescription`

- 若包含
  - 1. 查看之前的组件布局方案
  - 2. 带着 `errorDescription` 继续执行步骤 5，根据实际情况重新布局组件
- 若不包含
  直接执行步骤 5

### 步骤 5：读取组件布局规划

- 获取 `components` 数组中每个组件的 `children`/`rect`/`excludeRects`

### 步骤 6：路由配置更新

- 检查是否已配置当前画板对应入口页面组件的路由：
  - 已配置 → 直接跳过
  - 未配置 → 按 `sketch-cache/proj-init.md` 中的路由规范插入新路由，与现有路由写法保持一致

### 步骤 7：组件布局

- 1. 根据 `sketch-cache/proj-init.md` 确定技术栈、导入方式、样式写法
- 2. 从入口页面组件（`type: page`）开始，按组件依赖树**深度优先遍历** `components` 中的每个组件：
  - `children` 为空 → 直接跳过
  - `children` 不为空：
    - 1. 根据 `rect` / `excludeRects` 计算每个子组件的布局信息
    - 2. 检查组件内容，如果组件已实现布局样式且符合布局信息，**直接跳过**
    - 3. 为每个直接子组件编写容器 `div`，**必须**使用`响应式布局`，灵活运用 `%`、`flex`、`calc` 等 CSS 布局技术**控制子组件的位置和大小**
      - 容器 `div` 的类名基于子组件名称`{sub-component-name}-wrap`
      - 正确 `import` 子组件到当前组件，填入相应的 `div` 容器中
      - 判断组件是否相对父级组件是上下或左右居中，若居中则优先使其居中
      - 布局技术优先级
        - flex 弹性布局
        - calc 相对单位
        - % 相对单位

## 输出格式

成功：

```
路由和父组件布局已完成
LAYOUT_SUCCESS
```

失败：

```
<错误描述>
LAYOUT_FAILED
```
