# Sketch Draw Check Skill

审核绘制的组件是否符合要求

## 核心约束

- **绝不自行编写代码**
- **禁止执行任何写入操作**

## 执行步骤

以下步骤中的 `component_path` 均由调用方传入上下文

### 步骤 1：检查 `component_path` 组件内容是否符合要求

若违反以下要求，跳过之后所有步骤，返回失败信息：`{component_path}` 组件违反的规则列表

**1a. UI 组件库使用检查**

- 输入框、按钮、选择器、开关等基础组件，是否使用了项目 UI 组件库中的组件

**1b. 未使用的 import**

- 检查组件文件中是否有导入了但未使用的 import 语句

### 步骤 2：代码质量检查

读取 `.sketch-cache/proj-init.md` 获取格式化、代码检查、类型检查的完整命令并执行：

- 若项目没有对应的检查工具，跳过即可
- 执行时精确到 `component_path` 组件文件（如 `eslint <component_path>`），无需全量扫描
- typecheck（如 `tsc --noEmit`）不支持指定文件，需全量检查，过滤与 `component_path` 相关的错误
- 若有报错，检查报错内容是否涉及 `component_path` 组件文件：
  - 涉及 → 返回失败信息，附上与 `component_path` 相关的具体错误和修复命令
  - 不涉及（报错全是已有项目错误）→ 无视，视为通过

## 输出格式

成功：

```
`{component_path}` 组件符合要求
DRAW_CHECK_SUCCESS
```

失败：

```
审核失败：
- 组件路径：{component_path}
- 错误类型：<UI组件库未使用 | 未使用import | 代码质量问题>
- 错误描述：<具体错误信息>
- 修复建议：<修复方案描述>
DRAW_CHECK_FAILED
```
