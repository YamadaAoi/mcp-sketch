# Sketch Layout Check Skill

审核父组件的布局是否符合要求：子组件容器包裹、布局合理性、lint/typecheck

> ⚠️ **警告**：你**绝对禁止**新建、修改或删除 `sketch-cache/artboards/` 目录下的任何 JSON 状态文件。状态文件仅由主流程维护，你只能通过上下文参数获取必要信息。

## 核心约束

- **绝不自行编写代码**：只审核和报告，不修改文件
- **禁止执行任何写入操作**

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名

### 步骤 1：读取状态文件和预览图

读取 `sketch-cache/artboards/{page_name}-{artboard_name}.json`，获取 `components` 数组。读取预览图辅助判断布局模式。

### 步骤 2：遍历有子组件的父组件，逐项检查

**2a. 容器包裹检查**

每个直接子组件是否有 `div` 容器包裹，类名 `{sub-component-name}-wrap`

**2b. 布局响应式检查**

检查容器样式是否使用了响应式布局技术：

| 检查项      | 合规                                       | 违规                                       |
| ----------- | ------------------------------------------ | ------------------------------------------ |
| 水平排列    | `display: flex` + `flex-direction: row`    | 固定 `position: absolute` + 固定 `left` 值 |
| 垂直排列    | `display: flex` + `flex-direction: column` | 固定 `position: absolute` + 固定 `top` 值  |
| 左侧固定栏  | `width: 固定px` + `flex-shrink: 0`         | `width: 100%`（应为固定宽度）              |
| 右侧自适应  | `flex: 1`                                  | `width: 固定px`（应为自适应）              |
| 顶部/底部栏 | `height: 固定px` + `flex-shrink: 0`        | `height: 100%`（应为固定高度）             |
| 中间内容区  | `flex: 1` + `overflow: auto`               | `height: 100%`（应为 flex: 1）             |
| 居中卡片    | flex 居中或 transform 居中                 | `position: absolute` + 固定 `top/left` 值  |
| 网格布局    | `display: grid` + `grid-template`          | 多个绝对定位元素拼凑                       |

**2c. 常见布局错误检查**

| 问题             | 说明                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| 子组件溢出父容器 | 子组件宽高超过父容器，未设置 `overflow`                               |
| 固定像素溢出     | 使用固定 `px` 宽度导致小屏幕溢出                                      |
| 缺少 overflow    | 内容区未设置 `overflow: auto/scroll`，内容溢出不可见                  |
| flex 未生效      | 父容器未设置 `display: flex`，子组件 `flex` 属性无效                  |
| 高度塌陷         | 父容器 `height: 100%` 但未设置 `display: flex`，子组件 `flex: 1` 无效 |

### 步骤 3：运行 lint/typecheck

- lint：`eslint <涉及的组件文件路径>`（精确到本次修改的文件，无需全量扫描）
- typecheck：`tsc --noEmit`（不支持指定文件，需全量检查，过滤本次修改的组件相关错误）

## 输出格式

成功：

```
布局审核通过
LAYOUT_CHECK_SUCCESS
```

失败：

```
布局审核失败：
- 组件路径：{component_path}
- 问题类型：{容器缺失 | 布局不响应式 | 溢出未处理 | flex失效 | 高度塌陷 | lint错误 | typecheck错误}
- 问题描述：{具体问题}
- 修复建议：{建议如何修复}
LAYOUT_CHECK_FAILED
```
