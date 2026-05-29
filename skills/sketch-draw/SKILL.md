---
name: sketch-draw
description: 当需要根据 sketch 设计稿 zip 里的画板绘制页面时，该技能会解析并提取出有效图层，切图和预览图供 AI 参考
metadata:
  author: zhouyinkui
  version: '2026.05.27'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能旨在使用工具分析 `sketch meaxure` 导出的 `zip` 文件，提取出有效图层、切图和预览图，作为 AI 绘制前端页面的参考。

## 核心铁律

### 铁律 1：必须基于 rect 坐标绘制

- 你**必须**接收 `rect` 参数 `[x, y, width, height]`
- 你**只能**绘制该矩形区域内的内容
- 没有 rect 参数 = 拒绝执行

### 铁律 2：必须调用 analyze 工具

- **禁止**仅凭预览图直接写代码
- **必须**先调用 `mcp-sketch analyze` 获取图层结构信息
- 工具返回的 `artboard` 数据是代码生成的唯一依据

### 铁律 3：工作流模式下静默执行

- 检测到工作流模式时，生成完毕后直接输出 `DRAW_SUCCESS`
- **禁止**询问"是否满意"或"是否需要调整"
- **禁止**输出总结性文字

## 前置条件

- 此技能通常由 `sketch-split` 触发，用于处理特定矩形区域（rect）的代码生成。
- 调用前应具备：
  - 画板的 `.md` 描述文档（含 rect 坐标）
  - 对应的空白组件文件

## 硬性要求：适配项目技术栈

**永远不要假设项目使用 Vue / React 或其他框架。** 在生成代码前必须：

1. 读取 `package.json` 的 `dependencies`/`devDependencies`，确定项目技术栈（React、Vue、Solid 等）。
2. 查看项目中已有的组件文件（`.tsx`、`.vue`、`.jsx` 等），确定文件后缀、写法风格、CSS 方案。
3. 查看已有路由文件，确定路由写法。
4. 生成代码时必须与项目现有代码风格保持一致。例如：
   - Vue 项目 → `.vue` SFC + `script setup`
   - React 项目 → `.tsx` + hooks
   - 其他框架 → 按项目规范输出
5. 不要引入项目未使用的依赖。

## 工具介绍

```shell
$ npx -y mcp-sketch analyze -h

Usage: mcp-sketch analyze [options]

parsing Sketch Meaxure exported HTML zip archives and extracting design structure information

Options:
  -p, --file_path <PATH>                Sketch HTML zip archive path
  --pn, --page_name [PAGENAME]          Page name
  --an, --artboard_name [ARTBOARDNAME]  Artboard name
  -r, --rect [RECT]                     Specify rectangular region to parse, format: [x, y, width, height] (x, y is top-left corner)
  -e, --exclude_rects [EXCLUDE_RECTS]   Specify rectangular regions to exclude, format: "[[x, y, width, height]]" (x, y is top-left corner)
  --ap, --assets_path [ASSETSPATH]      Assets output path, default: src/assets/sketch
  --sr, --save_result [SAVERESULT]      Whether to save analysis result to local file, default: false
```

## 执行步骤

### 步骤 1：参数校验

在调用工具前，验证以下参数：

- [ ] `file_path`：Sketch zip 文件路径（必填）
- [ ] `page_name`：页面名称（必填）
- [ ] `artboard_name`：画板名称（必填）
- [ ] `rect`：矩形区域坐标 `[x, y, width, height]`（必填）
- [ ] `exclude_rects`：排除矩形区域坐标列表 `[[x, y, width, height]]`（可选，默认 `[]` ）
- [ ] `assets_path`：切图存放路径（可选，默认 `src/assets/sketch`）

**如果 rect 参数缺失，输出错误并拒绝执行。**

### 步骤 2：调用 analyze 工具

**为什么需要 exclude_rects？**
当绘制父组件时，若其子组件区域也在父组件的 `rect` 内，`analyze` 会返回子组件区域内的所有图层。由于子组件后续由 `sketch-draw` 独立绘制，父组件不应包含这些内容 — 它只需要"背景层"。将子组件的 rects 作为 `exclude_rects` 传入，即可从分析结果中排除它们，避免重复渲染。

```shell
# 无子组件时
npx -y mcp-sketch analyze -p /path/to/zip --pn 页面名 --an 画板名 -r "[x,y,w,h]" --ap /path/to/assets

# 有子组件时（exclude_rects 从 .md 描述文档中读取）
npx -y mcp-sketch analyze -p /path/to/zip --pn 页面名 --an 画板名 -r "[x,y,w,h]" -e "[[x1,y1,w1,h1],[x2,y2,w2,h2]]" --ap /path/to/assets
```

### 步骤 3：读取工具返回结果

工具返回格式：`{artboard: {...}, previewPath: "..."}`

#### 3.1 解析 artboard 数据

- 画板有固定长宽，绘制时需考虑响应式适配
- 各图层坐标相对于画板，`(0,0)` 为左上角，x 轴向右，y 轴向下
- 提取所有有效图层信息：
  - 文本图层：内容、字体、颜色、位置
  - 图片图层：文件名、位置、尺寸
  - 形状图层：类型、颜色、边框、圆角
  - 容器图层：子元素、布局方式

#### 3.2 读取预览图

- 使用 `previewPath` 读取预览图
- 核对 `artboard` 数据，确认没有遗漏重要图层
- 辅助理解组件的视觉层级关系

### 步骤 4：代码生成

根据工具返回的图层信息生成组件代码，**技术栈由项目决定，参见"适配项目技术栈"规则**。

#### 4.1 绘制原则

- **禁止绝对定位**：优先使用 flex/grid 布局
- **相对单位优先**：使用 `%`、`rem`、`vw/vh`，仅图标/固定尺寸元素使用 `px`
- **CSS 背景优先**：图片优先用 `background-image` 而非 `<img>`
- **语义化标签**：合理使用 `header`、`main`、`section`、`nav` 等
- **与项目现有代码风格一致**：文件后缀、导入方式、CSS 方案、命名规范均参考已有组件

#### 4.2 组件结构（示意）

生成的结构取决于项目技术栈，以下为概念示意，**非固定模板**：

```
[模板部分]
<div class="component-name">
  <!-- 根据图层结构生成 -->
</div>

[逻辑/脚本部分]
// 状态、事件、生命周期

[样式部分]
.component-name {
  // 根据设计稿生成样式
}
```

### 步骤 5：还原度自检

生成代码后，对照预览图自检：

- [ ] 布局结构与设计稿一致
- [ ] 元素位置关系正确
- [ ] 颜色、字体与设计稿一致
- [ ] 图片/图标正确引用
- [ ] 响应式适配合理
- [ ] 最低保证 90% 还原度

### 步骤 6：代码质量自检 (强制)

根据项目实际配置运行检查，确保代码无语法错误且风格一致。**不要假设**项目一定有 prettier / eslint / tsc，先通过 `package.json` 的 `scripts` 和配置文件判断可用工具。

```shell
# 如果项目配置了 prettier（有 .prettierrc* 或 prettier 脚本）
npx prettier --write <组件文件路径>

# 如果项目配置了 eslint（有 eslint.config.* 或 lint 脚本）
npx eslint <组件文件路径> --fix --no-ignore
```

- 若 eslint 报错（未修复的），**必须逐条修正**代码后重新运行，直到无报错。
- 若项目没有对应的检查工具，跳过即可。
- 此步骤的目标：保证生成的组件通过项目现有的基础门槛，避免将问题留到后续环节。

### 步骤 7：输出结果

#### 工作流模式下

```
组件 [ComponentName] 生成完毕
DRAW_SUCCESS
```

#### 独立运行模式下

输出完整代码，并询问用户是否满意。

## 约束

### 静默执行约束

当被 `sketch-workflow` 批量调用时：

- **禁止**在生成单个组件后询问用户"是否满意"或"是否需要调整"
- **禁止**输出任何总结性文字
- 只需输出"组件 [ComponentName] 生成完毕"
- 最后输出状态码 `DRAW_SUCCESS`，以便 Workflow 识别并启动下一个组件

### 代码质量约束

- 遵循项目已有的 lint、format、命名规范（从现有代码推断）
- 使用项目已有的组件库和工具链，**不要引入项目未安装的依赖**

## 违规检测

如果你发现自己有以下行为，说明违反了技能规范：

- [ ] 没有调用 `mcp-sketch analyze` 就直接写代码
- [ ] 没有使用 rect 参数，绘制了整个画板而非指定区域
- [ ] 父组件有子组件但未使用 `exclude_rects`，导致子组件区域内容重复渲染
- [ ] 使用了绝对定位（`position: absolute`）作为主要布局方式
- [ ] 工作流模式下询问用户是否满意
- [ ] 工作流模式下输出总结性文字
- [ ] 没有输出 `DRAW_SUCCESS` 状态码
- [ ] 代码还原度明显低于 90%
- [ ] 生成的代码使用了项目未安装的框架或依赖
- [ ] 未运行 `prettier` 格式化生成的组件代码
- [ ] 未运行 `eslint` 检查，或明知 ESLint 报错仍跳过修复
