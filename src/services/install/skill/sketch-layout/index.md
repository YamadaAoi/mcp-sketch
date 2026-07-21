# Sketch Layout Skill

配置画板对应页面的路由，为父组件编写子组件的 import 语句和 div 容器，搭建组件层级骨架。具体的组件细节绘制由后续 高级前端开发 负责

## 核心约束

- **禁止自行解压**任何压缩文件！
- **禁止直接读取设计稿文件**
- **前置状态校验**：若存在 `gen-base-done` 状态的组件（即 gen-base-check 未完成），中断流程并反馈，禁止在错误基础上继续任务
- **状态文件只读**：禁止直接新建、修改或删除 `.sketch-cache/` 下的状态文件。状态仅通过 `RECORD_STATE` 输出标记，由 Leader 负责写入

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名
- `file_path` — 设计稿文件路径（用于定位状态文件目录）
- `layout_mode`（可选） — `page`（完整页面布局，含路由）或 `component`（组件内布局），默认 `page`
- `requirements`（可选） — 额外要求。首次调用传空；重试/修复调用传 check 失败原因或用户反馈

`design_file_name = basename(file_path, '.zip')`

### 步骤 1：读取 `.sketch-cache/proj-init.md` 确认技术栈、样式写法、路由文件位置、导入方式、本地开发服务器配置

- 若文件不存在，跳过之后所有步骤，返回失败信息：`proj-init.md 文件不存在`

### 步骤 2：读取状态文件

读取 `.sketch-cache/artboards/{design_file_name}/{page_name}/{artboard_name}/progress.json` 文件

- 若不存在，跳过之后所有步骤，返回失败信息：`画板{page_name}-{artboard_name}中间状态不存在`

### 步骤 3：前置状态校验

检查 `components` 数组中是否存在 `status = 'gen-base-done'` 的组件

- **存在** → 中断流程，返回失败信息：`存在 {n} 个组件未通过 gen-base-check（状态仍为 gen-base-done），请先完成 gen-base-check`
- **不存在** → 继续

### 步骤 4：提取待处理组件

从 `components` 数组中筛选 `status = 'gen-base-check-done'` 的组件

- 若没有，返回：`没有需要配置布局的组件`

### 步骤 5：分析 `requirements`，确定修复方式

- 若 `requirements` 描述了需要修复的问题（如 check 失败原因）
  - 1. 分析 `requirements`，判断问题类型：
    - **可简单修复**（格式问题如 prettier 格式异常、import 路径错误、CSS 属性值偏差等表层问题）→ 定位到具体代码直接修正，修复完成后跳到输出格式，无需重新执行布局流程
    - **需重新布局**（布局模式选错、组件层级关系错误、路由配置错误等深层问题）→ 查看之前的组件布局方案，带着 `requirements` 继续执行步骤 6
- 若不包含
  直接执行步骤 6

### 步骤 6：读取组件布局规划

- 获取 `components` 数组中每个待处理组件的 `children`/`rect`/`excludeRects`

### 步骤 7：路由配置更新

`layout_mode = component` → 跳过此步骤（组件内布局不涉及路由）

`layout_mode = page` → 检查是否已配置当前画板对应入口页面组件的路由：

- 已配置 → 直接跳过
- 未配置 → 按 `.sketch-cache/proj-init.md` 中的路由规范插入新路由，与现有路由写法保持一致

### 步骤 8：推断预览 URL

读取 `.sketch-cache/proj-init.md` 获取监听端口和路由模式：

`layout_mode = page` → 从步骤 7 确定的路由路径拼接预览 URL

`layout_mode = component` → 读取目标页面的 state 文件，获取其 `previewUrl`：

- 目标页面 state 存在且有 previewUrl → 直接使用
- 目标页面 state 不存在或无 previewUrl → 输出 `UNKNOWN`

- 端口和路由路径均已知（page 模式）或目标页面 previewUrl 已知（component 模式）：
  - hash 模式：`http://localhost:{端口}/#/{路由路径}`
  - history 模式：`http://localhost:{端口}/{路由路径}`
- 无法确定 → `previewUrl` 输出 `UNKNOWN`，由 Leader 询问用户确认

### 步骤 9：组件布局

- 根据 `.sketch-cache/proj-init.md` 确定技术栈、导入方式、样式写法
- 读取预览图，判断布局模式（参照下方「布局模式速查」）
  - `layout_mode = page` → 判断整个页面的布局模式
  - `layout_mode = component` → 判断被插入组件内部的布局模式（如卡片内 flex 横排、表单内纵向堆叠等）
- 遍历待处理组件：
  - `children` 为空 → 直接跳过，不做任何修改
  - `children` 不为空：
    - 1. 根据 `rect` / `excludeRects` 计算每个子组件的布局信息
    - 2. 检查组件内容，如果组件已实现布局样式且符合布局信息，**直接跳过**
    - 3. 为每个直接子组件编写容器 `div`
      - 容器 `div` 的css类名基于子组件名称`{sub-component-name}-wrap`
      - 正确 `import` 子组件到当前组件，填入相应的 `div` 容器中
      - 判断组件是否相对父级组件上下或左右居中，若居中则优先使其居中
      - 编写CSS样式控制**子组件的位置和大小**，参照下方布局模式速查

## 布局模式速查

根据预览图判断布局模式，按对应方案布局。

| 模式      | 适用场景                 | 容器写法                                                                      | 子组件写法                                                                                             |
| --------- | ------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Flex 居中 | 登录页、弹窗、单卡片居中 | `display:flex; justify-content:center; align-items:center; width/height:100%` | 固定宽度或 `max-width`，高度 auto                                                                      |
| 左右分栏  | 后台、设置页、邮箱       | `display:flex; width/height:100%`                                             | 左栏 `width:固定px; flex-shrink:0`，右栏 `flex:1; overflow:auto`                                       |
| 上下分栏  | 标准页面、文章页、详情页 | `display:flex; flex-direction:column; width/height:100%`                      | 顶栏 `height:固定px; flex-shrink:0`，内容区 `flex:1; overflow:auto`                                    |
| Grid 网格 | 仪表盘、数据面板、图片墙 | `display:grid; grid-template-columns:repeat(N,1fr); gap:16~24px`              | 各占一个 grid 单元，或跨列 `grid-column:span N`                                                        |
| 固定定位  | 后台管理系统、CMS        | 外层 `width/height:100%`                                                      | 顶栏 `position:sticky/fixed;top:0`，侧栏 `position:fixed;left:0`，内容区 `margin-left/margin-top` 偏移 |
| 流式卡片  | 商品列表、文章列表       | `display:flex; flex-wrap:wrap; gap:12~20px`                                   | `width:固定px或百分比;height:auto;flex-shrink:0`                                                       |

**变体判断要点：**

- 居中偏左/偏右 → `justify-content: flex-start/end` + `padding`
- 全屏背景+卡片 → 容器加 `position:relative;background-size:cover`，卡片用 flex 居中或 `position:absolute` + `transform`
- Tab 切换 → 上下 Tab 用 `flex-direction:column`，左右 Tab 用 `row`
- 三栏嵌套 → 在左右分栏基础上嵌套一层 flex

## 宽高设置速查表

| 子组件位置 | 宽度设置                     | 高度设置                 |
| ---------- | ---------------------------- | ------------------------ |
| 左侧固定栏 | `width: 固定px`              | `height: 100%`           |
| 右侧自适应 | `flex: 1`                    | `height: 100%`           |
| 顶部固定栏 | `width: 100%`                | `height: 固定px`         |
| 底部固定栏 | `width: 100%`                | `height: 固定px`         |
| 中间内容区 | `width: 100%`                | `flex: 1`                |
| 居中卡片   | `width: 固定px 或 max-width` | `height: auto 或 固定px` |
| 网格子项   | `100%`（grid 单元自动撑满）  | `100%` 或固定            |
| 流式卡片   | `calc(百分比 - gap)`         | `固定px 或 auto`         |

## 输出格式

成功：

```
路由和父组件布局已完成 | 无子组件，跳过布局步骤
previewUrl：{previewUrl} | UNKNOWN
已修改组件：
- {componentPath1}
- {componentPath2}
...
LAYOUT_SUCCESS
RECORD_STATE: previewUrl, each modified component → components[{componentPath}].status = layout-done
```

失败：

```
<错误描述>
LAYOUT_FAILED
```
