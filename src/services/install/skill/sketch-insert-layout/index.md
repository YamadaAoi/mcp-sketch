# Sketch Insert Layout Skill

将 gen-base 生成的 section 组件布局并插入到目标页面中

## 核心约束

- **禁止自行解压**任何压缩文件！
- **禁止直接读取设计稿文件**
- **前置状态校验**：若存在 `gen-base-done` 状态的组件（即 gen-base-check 未完成），中断流程并反馈
- **状态文件只读**：禁止直接新建、修改或删除 `.sketch-cache/` 下的状态文件。状态仅通过 `RECORD_STATE` 输出标记，由 Leader 负责写入

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名
- `file_path` — 设计稿文件路径（用于定位状态文件目录）
- `requirements`（可选） — 额外要求。重试/修复调用传 check 失败原因或用户反馈

`design_file_name = basename(file_path, '.zip')`

### 步骤 1：读取项目配置

读取 `.sketch-cache/proj-init.md` 确认技术栈、样式写法、路由文件位置、导入方式、本地开发服务器配置

- 若文件不存在，返回失败：`proj-init.md 文件不存在`

### 步骤 2：读取状态文件

读取 `.sketch-cache/artboards/{design_file_name}/{page_name}/{artboard_name}/progress.json`

- 若不存在，返回失败：`画板{page_name}-{artboard_name}中间状态不存在`

### 步骤 3：校验目标页面

从状态文件读取 `targetPage` 字段

- **不存在或为空** → 返回失败：`未配置目标页面（targetPage），请确认 split 阶段已推断并写入 targetPage`
- **存在** → 后续插入操作的目标页面路径

### 步骤 4：前置状态校验

检查 `components` 数组中是否存在 `status = 'gen-base-done'` 的组件

- **存在** → 中断流程，返回失败：`存在 {n} 个组件未通过 gen-base-check（状态仍为 gen-base-done），请先完成 gen-base-check`
- **不存在** → 继续

### 步骤 5：提取待处理组件

从 `components` 数组中筛选需要处理的组件：

- **需布局+插入**：`status = 'gen-base-check-done'` 且 `type = 'section'` 的组件
- **仅需插入**：`type = 'reuse'` 的组件（不做布局，直接插入目标页面）

- 若两类都为空，返回：`没有需要处理的组件`

### 步骤 6：分析 `requirements`，确定修复方式

- 若 `requirements` 描述了需要修复的问题（如 check 失败原因）
  - **可简单修复**（import 路径错误、CSS 属性值偏差等表层问题）→ 定位到具体代码直接修正，跳到输出格式
  - **需重新布局**（插入位置错误、组件内部布局错误等深层问题）→ 带着 `requirements` 继续执行步骤 7
- 若不包含，直接执行步骤 7

### 步骤 7：读取布局规划

- 获取每个 section 组件的 `children`/`rect`/`excludeRects`
- 获取每个 reuse 组件的 `rect`（用于确定在目标页面的插入位置）

### 步骤 8：组件布局（仅 section 组件，reuse 组件跳过）

- 根据 `proj-init.md` 确定技术栈、导入方式、样式写法
- 读取预览图判断布局模式（参照 layout skill 的布局模式速查）
- 遍历 section 组件：
  - `children` 为空 → 跳过
  - `children` 不为空：
    - 为每个直接子组件编写容器 `div`，类名 `{sub-component-name}-wrap`
    - 正确 `import` 子组件到当前组件，填入 `div` 容器
    - 编写 CSS 控制子组件位置和大小

### 步骤 9：插入目标页面

- 读取状态文件中的 `targetPage` 对应的页面组件文件
- 遍历所有待处理组件（section + reuse）：
  - 在目标页面中 import 当前组件
  - 根据 `rect` 和预览图判断在页面中的插入位置
  - 在目标页面的合适位置使用该组件（替换占位内容或追加到指定区域）

### 步骤 9：推断预览 URL

读取目标页面的 state 文件，获取其 `previewUrl`：

- 目标页面 state 存在且有 previewUrl → 直接使用
- 目标页面 state 不存在或无 previewUrl → 输出 `UNKNOWN`，由 Leader 询问用户确认

## 输出格式

成功：

```
插入布局已完成 | 无子组件，跳过布局步骤
已插入到：{targetPage}
已修改组件：
- {componentPath1}
- {componentPath2}
...
INSERT_LAYOUT_SUCCESS
RECORD_STATE: previewUrl, each modified section component → components[{componentPath}].status = layout-done
```

失败：

```
<错误描述>
INSERT_LAYOUT_FAILED
```
