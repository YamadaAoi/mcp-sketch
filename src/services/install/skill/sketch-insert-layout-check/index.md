# Sketch Insert Layout Check Skill

审核 section 组件插入到目标页面的结果：组件内部布局、目标页面引用、lint/typecheck

> ⚠️ **警告**：**绝对禁止**新建、修改或删除 `.sketch-cache/artboards/` 目录下的任何 JSON 状态文件。状态文件仅由主流程维护，你只能通过上下文参数获取必要信息。

## 核心约束

- **绝不自行编写代码**：只审核和报告，不修改文件
- **禁止执行任何写入操作**

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名
- `file_path` — 设计稿文件路径

`design_file_name = basename(file_path, '.zip')`

### 步骤 1：读取状态文件

读取 `.sketch-cache/artboards/{design_file_name}/{page_name}/{artboard_name}/progress.json`

- 若不存在，返回失败：`画板{page_name}-{artboard_name}中间状态不存在`

### 步骤 2：提取待检查组件

从状态文件的 `components` 数组中，筛选 `status = 'layout-done'` 的组件

- 若没有 `layout-done` 状态的组件，返回：`没有需要检查的组件`

### 步骤 3：遍历检查每个组件

对每个 `layout-done` 组件执行以下检查：

#### 3a. 组件内部布局检查

- 每个直接子组件是否有 `div` 容器包裹，类名 `{sub-component-name}-wrap`
- 每个子组件是否已正确 import

#### 3b. 目标页面引用检查

- 读取 `targetPage` 字段获取目标页面组件路径
- 目标页面是否已 import 当前 section 组件
- 目标页面中是否正确使用该组件

#### 3c. previewActions 合理性校验

若状态文件中有 `previewActions` 字段，检查动作是否合理：

- `click` / `hover` 动作的 `selector` 是否指向页面中真实存在的元素（通过 CodeGraph/Grep 搜索目标页面模板确认）
- 若组件明显在不可见容器内但缺少 `previewActions` → 标记为警告（不阻断流程，建议补充）
- 若 `previewActions` 存在但组件实际在可见位置 → 标记为警告（冗余，可移除）

#### 3d. 运行 lint/typecheck

- lint：`eslint <涉及的组件文件路径>`（精确到本次修改的文件）
- typecheck：`tsc --noEmit`
- 若项目没有对应检查工具，跳过即可

### 步骤 4：汇总结果

将所有组件的检查结果汇总，输出每个组件的通过/失败状态

## 输出格式

全部通过：

```
全部组件插入布局审核通过，共 {n} 个组件
INSERT_LAYOUT_CHECK_SUCCESS
RECORD_STATE: components[{componentPath}].status = layout-check-done（所有通过的组件）
```

存在失败：

```
插入布局审核结果（共 {total} 个，{passCount} 个通过，{failCount} 个失败）：

通过：
- {component_path_1}

失败：
- 组件路径：{component_path}
  问题类型：{容器缺失 | import缺失 | 目标页面引用缺失 | lint错误 | typecheck错误}
  问题描述：{具体问题}
  修复建议：{建议如何修复}
（逐个列出所有失败组件）
INSERT_LAYOUT_CHECK_FAILED
RECORD_STATE: 仅记录通过的组件为 layout-check-done，失败组件保持 layout-done
```
