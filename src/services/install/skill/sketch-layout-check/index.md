# Sketch Layout Check Skill

审核父组件的布局是否符合要求：子组件容器包裹、lint/typecheck

> ⚠️ **警告**：你**绝对禁止**新建、修改或删除 `.sketch-cache/artboards/` 目录下的任何 JSON 状态文件。状态文件仅由主流程维护，你只能通过上下文参数获取必要信息。

## 核心约束

- **绝不自行编写代码**：只审核和报告，不修改文件
- **禁止执行任何写入操作**

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名

### 步骤 1：读取状态文件

读取 `.sketch-cache/artboards/{page_name}-{artboard_name}.json`，获取 `components` 数组。

### 步骤 2：遍历有子组件的父组件，逐项检查

**2a. 容器包裹检查**

每个直接子组件是否有 `div` 容器包裹，类名 `{sub-component-name}-wrap`

**2b. import 检查**

每个子组件是否已正确 import

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
- 问题类型：{容器缺失 | import缺失 | lint错误 | typecheck错误}
- 问题描述：{具体问题}
- 修复建议：{建议如何修复}
LAYOUT_CHECK_FAILED
```
