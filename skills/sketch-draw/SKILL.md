---
name: sketch-draw
description: 本技能会提取 sketch 设计稿 (zip 或目录) 里的单个画板指定区域设计结构并生成前端组件代码
metadata:
  author: zhouyinkui
  version: '2026.06.02'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能基于 `mcp-sketch` 工具，利用 `analyze` 命令提取画板指定区域基本信息和预览图，编写符合项目技术栈的前端组件代码

## 核心铁律

### 铁律 1：工作流模式下静默执行

- 检测到工作流模式时，生成完毕后直接输出 `DRAW_SUCCESS`

### 铁律 2：必须基于 rect 参数限定绘制范围

- 你**必须**接收 `rect` 参数 `[x, y, width, height]` 限定本次绘制的区域范围
- 你**只能**绘制该矩形区域内的内容
- 没有 rect 参数 = 拒绝执行

### 铁律 3：必须调用 analyze 工具

- **禁止**仅凭预览图直接写代码
- **必须**先调用 `mcp-sketch analyze` 获取图层结构信息
- 工具返回的 `artboard` 数据是代码生成的核心依据

### 铁律 4：analyze 返回的结构化数据是代码生成的唯一依据，禁止凭感觉编写

`mcp-sketch analyze` 返回的 `artboard.layers` 是设计稿的**结构化数据**，每个图层包含精确的坐标、样式、文本内容和切图资源。这是代码生成的**唯一可靠依据**，预览图仅作为辅助校验。

#### 必须逐图层提取的字段

| 图层类型        | 必须提取的字段                                                                                              | 用途                       |
| --------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------- |
| `type: "text"`  | `name`（文案内容）、`rect`、`css`（font-size、color、line-height、font-weight、letter-spacing、text-align） | 文本元素的精确样式和内容   |
| `type: "shape"` | `name`、`rect`、`css`（background、border、border-radius、opacity）、`styleName`                            | 盒模型、背景色、边框、圆角 |
| `type: "slice"` | `name`、`rect`、`assets`（path、format）                                                                    | 切图引用和尺寸             |

#### 切图专项规则

`type: "slice"` 的图层额外包含 `assets` 数组，记录设计稿导出的切图文件。切图是还原度的**最高优先级资源**：

- **必须使用**：切图文件必须在组件代码中通过 `background-image` 或 `<img>` 引用，禁止忽略
- **禁止替换**：不得用组件库的内置图标替换设计稿导出的图标切图
- **禁止替代**：不得用纯 CSS 模拟来替代设计稿已提供的切图
- **唯一例外**：仅当切图文件在磁盘上不存在时，才可退而使用 CSS 近似模拟，但必须在输出中警告切图缺失

#### 禁止行为

- **禁止忽略 `css` 数组**：图层的 `css` 字段包含设计稿导出的精确 CSS 属性，必须原样提取，不得自行估算
- **禁止忽略 `rect` 坐标**：图层的 `rect` 是理解布局关系的**核心参考**（左右顺序、上下层级、相对宽度比），禁止不看 rect 凭感觉排版
- **禁止忽略 `name` 字段**：`text` 图层的 `name` 是设计稿中的文案内容，必须作为组件中的文本内容使用
- **禁止忽略 `styleName`**：设计系统的样式令牌，应记录并在可能时映射为 CSS 变量

## 前置条件

- 在**工作流模式**下此技能通常作为 `skill: sketch-split` 的后续动作，用于生成特定矩形区域（rect）的代码
- 调用前应具备：
  - 画板的 `.md` 描述文档（含 rect 坐标）
  - 对应的空白组件文件

## 硬性要求：适配项目技术栈

**永远不要假设项目使用 Vue / React 或其他框架**，在生成代码前必须：

1. 读取 `package.json` 的 `dependencies`/`devDependencies`，确定项目技术栈（React、Vue、Solid 等）
2. 查看项目中已有的组件文件（`.tsx`、`.vue`、`.jsx` 等），确定文件后缀、写法风格、CSS 方案
3. 查看已有路由文件，确定路由写法
4. 生成代码时必须与项目现有代码风格保持一致，以项目中已存在的组件文件格式为准
5. 不要引入项目未使用的依赖

## 工具介绍

```shell
$ npx -y mcp-sketch analyze -h

Usage: mcp-sketch analyze [options]

parsing Sketch Meaxure exported HTML archives (zip or folder) and extracting design structure information

Options:
  -p, --file_path <PATH>                Sketch HTML export path (zip or folder)
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

- [ ] `file_path`：Sketch 文件路径（zip 或目录，必填）
- [ ] `page_name`：页面名称（必填）
- [ ] `artboard_name`：画板名称（必填）
- [ ] `rect`：矩形区域坐标 `[x, y, width, height]`（必填）
- [ ] `exclude_rects`：排除矩形区域坐标列表 `[[x, y, width, height]]`（可选，默认 `[]` ）
- [ ] `assets_path`：切图存放路径

#### **assets_path 确定规则**：从 `.md` 描述文档的 `component_path` 字段中提取组件相对路径，镜像映射到 `src/assets/` 下

- 页面特有组件：`component_path: src/views/pageName/componentName/ComponentName` → `--ap src/assets/views/pageName/componentName/`
- 公共组件：`component_path: src/components/Header/Header` → `--ap src/assets/components/Header/`

**如果 rect 参数缺失，输出错误并拒绝执行。**

### 步骤 2：调用 analyze 工具

```shell
# 从 .md 的 component_path 推导 assets_path
# component_path: src/views/userManagement/userTable/UserTable
# → --ap src/assets/views/userManagement/userTable/

npx -y mcp-sketch analyze -p /path/to/zip --pn 页面名 --an 画板名 -r "[x,y,w,h]" --ap src/assets/views/userManagement/userTable/

# 有子组件时（exclude_rects 从 .md 描述文档中读取）
npx -y mcp-sketch analyze -p /path/to/zip --pn 页面名 --an 画板名 -r "[x,y,w,h]" -e "[[x1,y1,w1,h1],[x2,y2,w2,h2]]" --ap src/assets/views/userManagement/userTable/
```

### 步骤 3：读取工具返回结果

工具返回格式：`{artboard: {...}, previewPath: "..."}`

#### 3.1 解析 artboard 数据（逐图层完整提取）

画板有固定长宽，绘制时需考虑响应式适配。各图层坐标相对于画板，`(0,0)` 为左上角，x 轴向右，y 轴向下。

**必须逐图层提取以下全部字段**：

**text 图层**（文本元素）：

- `name`：设计稿中的文案内容，**必须**作为组件中的文本内容使用
- `rect`：精确坐标 `[x, y, w, h]`，用于计算文本位置和尺寸
- `css` 数组中的每个属性，重点提取：
  - `font-family`：字体族
  - `font-size`：字号（px）
  - `color`：文字颜色
  - `line-height`：行高
  - `font-weight`：字重
  - `letter-spacing`：字间距
  - `text-align`：对齐方式

**shape 图层**（矩形/形状）：

- `name`：图层名称，用于理解元素用途
- `rect`：精确坐标 `[x, y, w, h]`
- `css` 数组中的每个属性，重点提取：
  - `background` / `background-color`：背景色
  - `border`：边框样式
  - `border-radius`：圆角
  - `opacity`：透明度
- `styleName`：设计系统样式令牌（如 `fill 填充/5error 错误/2-Normal`）

**slice 图层**（切图）：

- `name`：切图名称
- `rect`：精确坐标 `[x, y, w, h]`，用于设置容器尺寸
- `assets` 数组：切图文件路径和格式

#### 3.2 读取预览图

- 使用 `previewPath` 读取预览图
- 核对 `artboard` 数据，确认没有遗漏重要图层
- 辅助理解组件的视觉层级关系

#### 3.3 验证切图文件存在性（强制）

`analyze` 工具会将切图提取到 `--ap` 指定的目录。**代码生成前必须验证**：

1. 从返回结果的 `artboard.layers` 中提取所有 `type: "slice"` 的图层
2. 遍历每个 slice 的 `assets` 数组，获取切图的 `path`（相对路径）
3. 检查每个切图文件是否存在于磁盘上
4. **若切图缺失**：输出警告 `"切图缺失：[path]"`，并在后续步骤中降级为 CSS 模拟
5. **若切图存在**：记录完整路径列表，后续代码生成时必须引用

**验证结果示例输出**：

```
切图验证：
  ✓ 登录框.png — 存在于 src/assets/views/login/登录框.png
  ✓ icon_账号.png — 存在于 src/assets/views/login/icon_账号.png
  ✗ icon_密码.png — 缺失，将降级为 CSS 模拟
```

#### 3.4 输出结构化数据提取表（强制）

完成步骤 3.1-3.3 后，**必须**输出完整的结构化数据提取表。此表是步骤 4 代码生成的**直接输入**，代码中的每个值都必须能在此表中找到来源。

**text 图层提取表**：

```
┌───────────┬──────────────────┬──────┬──────┬──────┬──────┬─────────┬────────┬──────────┐
│ 图层名     │ 文案内容          │ x    │ y    │ w    │ h    │ font    │ color  │ weight   │
├───────────┼──────────────────┼──────┼──────┼──────┼──────┼─────────┼────────┼──────────┤
│ 电磁信号.. │ 电磁信号保密监测.. │ 771  │ 317  │ 374  │ 45   │ 34px    │ #FFF   │ 700      │
│ 登 录      │ 登 录             │ 923  │ 664  │ 75   │ 22   │ 24px    │ #FFF   │ 700      │
│ Text      │ 请输入账号        │ 830  │ 493  │ 100  │ 24   │ 20px    │ #C3C4C7│ 400      │
│ Text      │ 请输入密码        │ 830  │ 563  │ 100  │ 24   │ 20px    │ #C3C4C7│ 400      │
└───────────┴──────────────────┴──────┴──────┴──────┴──────┴─────────┴────────┴──────────┘
```

**shape 图层提取表**：

```
┌───────────┬──────┬──────┬──────┬──────┬───────────────────────────────┬──────────────┐
│ 图层名     │ x    │ y    │ w    │ h    │ CSS 属性                       │ styleName    │
├───────────┼──────┼──────┼──────┼──────┼───────────────────────────────┼──────────────┤
│ Rectangle │ 760  │ 478  │ 400  │ 54   │ bg:rgba(0,0,0,0.5) border:1px │ outline/...  │
│ Rectangle │ 760  │ 548  │ 400  │ 54   │ bg:rgba(0,0,0,0.5) border:1px │ outline/...  │
│ 矩形      │ 760  │ 648  │ 400  │ 54   │ bg:#2979FF border-radius:27px │ fill/...     │
└───────────┴──────┴──────┴──────┴──────┴───────────────────────────────┴──────────────┘
```

**slice 图层提取表**：

```
┌───────────┬──────┬──────┬──────┬──────┬─────────────────────┬──────┐
│ 图层名     │ x    │ y    │ w    │ h    │ 切图路径              │ 格式  │
├───────────┼──────┼──────┼──────┼──────┼─────────────────────┼──────┤
│ 登录框    │ 695  │ 200  │ 530  │ 660  │ 登录框.png           │ png  │
│ icon_账号 │ 792  │ 493  │ 24   │ 24   │ icon_账号.png        │ png  │
│ icon_密码 │ 792  │ 563  │ 24   │ 24   │ icon_密码.png        │ png  │
│ 矩形      │ 941  │ 386  │ 35   │ 5    │ 矩形.png             │ png  │
└───────────┴──────┴──────┴──────┴──────┴─────────────────────┴──────┘
```

**此表的作用**：

- 代码中的 `font-size: 34px` 必须来自此表的 `font` 列，不得自行编写
- 代码中的 `color: #FFF` 必须来自此表的 `color` 列，不得自行估算
- 代码中的文案 `电磁信号保密监测器系统` 必须来自此表的 `文案内容` 列，不得自行编写
- 代码中的 `background-image: url('@/assets/views/login/登录框.png')` 必须来自此表的 `切图路径` 列

### 步骤 4：代码生成

根据工具返回的图层信息生成组件代码，**技术栈由项目决定，参见"适配项目技术栈"规则**。

#### 4.0 判断组件类型并确定生成策略

在生成代码前，**必须**从 `.md` 描述文档中读取 `type` 和 `children` 字段，判断是否为父组件：

| type            | `children` 字段 | 生成策略                                      |
| --------------- | --------------- | --------------------------------------------- |
| `page`          | 非空            | 页面入口，绘制背景 + 布局容器 + import 子组件 |
| `common`        | 非空            | 公共父组件，绘制自身 + import 子组件          |
| `page-specific` | 非空            | 页面特有父组件，绘制自身 + import 子组件      |
| 任意            | 空 / `[]`       | 叶节点组件，按常规方式绘制                    |

**关键规则**：判断依据是 `children` 是否为**非空数组**，而非 `type`。只要 `children` 有值，该组件就承担"父组件"角色。

**父组件（children 非空）的特殊处理规则**：

1. **必须 import 子组件**：从 `.md` 的 `children` 字段获取子组件名称列表，在 `<script setup>` 中 import
2. **必须在模板中调用子组件**：在对应位置使用子组件标签
3. **必须使用 exclude_rects**：调用 analyze 时传入 `-e` 参数，排除子组件区域，避免重复渲染
4. **父组件只负责**：自身区域的背景样式、布局容器、子组件的放置位置
5. **父组件不负责**：子组件区域内的具体内容（由子组件自行绘制）

#### 4.1 绘制原则

- **禁止绝对定位**：优先使用 flex/grid 布局
- **相对单位优先**：对于布局容器、区块间距、列表项等，使用 `%`、`flex-grow`、`calc()` 实现自适应。仅按钮、输入框、图标、头像等具固定尺寸的原子元素使用 `px`
- **用 rect 算比例，不硬编码像素**：
  - 参考 rect 中的 `x` 和 `width` 计算元素在容器中的**相对占比**（如两个元素水平排列，宽度比约为 3:1，则 flex: 3 和 flex: 1）
  - 参考 rect 中的 `y` 确定元素的上**下排列顺序**，用 flex 天然顺序实现
  - `calc(100% - npx)` 适合处理"除固定侧边栏外的剩余空间"
  - 同一行多个元素时优先用 `flex-wrap` + `gap`，而非人工计算每个元素宽度
- **切图必须引用**：设计稿导出的切图必须通过 `background-image` 或 `<img>` 使用，路径使用 `@/assets/...` 别名
- **语义化标签**：合理使用 `header`、`main`、`section`、`nav` 等
- **与项目现有代码风格一致**：文件后缀、导入方式、CSS 方案、命名规范均参考已有组件

#### 4.1.1 结构化数据驱动（强制）

代码中的**每一个值**都必须来自步骤 3.4 的结构化数据提取表，不得凭感觉编写：

| 代码中的值 | 必须来源于                            | 示例                                                       |
| ---------- | ------------------------------------- | ---------------------------------------------------------- |
| 字体大小   | text 图层的 `css` 中 `font-size`      | `font-size: 34px`                                          |
| 文字颜色   | text 图层的 `css` 中 `color`          | `color: #ffffff`                                           |
| 字重       | text 图层的 `css` 中 `font-weight`    | `font-weight: 700`                                         |
| 行高       | text 图层的 `css` 中 `line-height`    | `line-height: 45px`                                        |
| 字间距     | text 图层的 `css` 中 `letter-spacing` | `letter-spacing: 2px`                                      |
| 文案内容   | text 图层的 `name` 字段               | `电磁信号保密监测器系统`                                   |
| 背景色     | shape 图层的 `css` 中 `background`    | `background: #2979ff`                                      |
| 边框       | shape 图层的 `css` 中 `border`        | `border: 1px solid #5a5c5e`                                |
| 圆角       | shape 图层的 `css` 中 `border-radius` | `border-radius: 27px`                                      |
| 元素位置   | 图层的 `rect` 中 `x, y`               | 参考 x,y 确定排列顺序和左右关系，用 flex/grid 实现         |
| 元素尺寸   | 图层的 `rect` 中 `w, h`               | 按元素类型决定：固定原子用 px，布局容器用 %/flex-grow/calc |
| 切图引用   | slice 图层的 `assets[].path`          | `url('@/assets/.../登录框.png')`                           |

#### 4.2 图片资源优先级链条（强制）

当图层包含切图时，**必须按以下顺序选择实现方式**，禁止跳级：

```
优先级 1：使用设计稿切图（type: "slice" 的 assets）
  ↓ 切图文件缺失时才降级
优先级 2：CSS 模拟（background-image 渐变、border-radius 等）
  ↓ 无法用 CSS 实现时才降级
优先级 3：组件库图标（仅当设计稿未提供图标切图时）
```

**切图引用规范**：

- 背景类切图（登录框、卡片背景等）：使用 CSS `background-image: url('@/assets/...')`
- 图标类切图（icon\_\*.png）：使用 `<img :src="iconXxx" />` 或 CSS `background-image`
- 装饰类切图（矩形、线条等）：使用 CSS `background-image` 并保持原始尺寸
- 所有切图必须保持设计稿中的原始宽高，不得拉伸或压缩

#### 4.3 组件结构（示意）

生成的结构取决于项目技术栈，以下为概念示意，**非固定模板**：

```
--- 结构 / 模板部分 ---
根据图层结构生成对应的页面结构

--- 逻辑 / 脚本部分 ---
状态、事件、生命周期处理

--- 样式部分 ---
根据设计稿生成对应样式
```

### 步骤 5：还原度自检

生成代码后，**逐项对照**结构化数据提取表和预览图自检：

- [ ] 代码中的每个 `font-size` 值与提取表一致
- [ ] 代码中的每个 `color` 值与提取表一致
- [ ] 代码中的每个 `font-weight` 值与提取表一致
- [ ] 代码中的每个 `border-radius` 值与提取表一致
- [ ] 代码中的文案内容与提取表的 `name` 字段一致
- [ ] 代码中引用的切图路径与提取表的 `assets[].path` 一致
- [ ] 布局结构与设计稿一致（左右顺序、上下层级、相对宽高比，而非像素级匹配）
- [ ] 元素位置关系正确（用 `rect` 参考验证排列顺序，而非精确坐标）
- [ ] 响应式适配合理（容器用了相对单位，而非全部 px 写死）
- [ ] 颜色、字体与设计稿一致（使用 `css` 属性验证）
- [ ] 图片/图标正确引用
- [ ] 最低保证 90% 还原度

### 步骤 6：代码质量自检 (强制)

根据项目实际配置运行检查，确保代码无语法错误且风格一致。**不要假设**项目一定有 prettier / eslint / tsc，先通过 `package.json` 的 `scripts` 和配置文件判断可用工具。

```shell
# 如果项目配置了 prettier（有 .prettierrc* 或 prettier 脚本）
npx prettier --write <组件文件路径>

# 如果项目配置了 eslint（有 eslint.config.* 或 lint 脚本）
npx eslint <组件文件路径> --fix --no-ignore
```

- 若 eslint 报错（未修复的），**必须逐条修正**代码后重新运行，直到无报错
- 若项目有 `typecheck` 脚本（`tsc --noEmit` 等），运行 `npx tsc --noEmit` 检查组件文件类型错误。报错则修正后重试，直到通过
- 若项目没有对应的检查工具，跳过即可
- 此步骤的目标：保证生成的组件通过项目现有的基础门槛，避免将问题留到后续环节

### 步骤 7：输出结果

#### 工作流模式下

```
组件 [ComponentName] 生成完毕
DRAW_SUCCESS
```

#### 独立运行模式下

输出完整代码，并询问用户是否满意

## 约束

### 代码质量约束

- 遵循项目已有的 lint、format、命名规范（从现有代码推断）
- 使用项目已有的组件库和工具链，**不要引入项目未安装的依赖**

## 违规检测

如果你发现自己有以下行为，说明违反了技能规范：

- [ ] 没有调用 `mcp-sketch analyze` 就直接写代码
- [ ] 没有使用 rect 参数，绘制了整个画板而非指定区域
- [ ] 父组件有子组件但未使用 `exclude_rects`，导致子组件区域内容重复渲染
- [ ] **父组件（children 非空）未 import 子组件**
- [ ] **父组件（children 非空）未在模板中调用子组件**
- [ ] **父组件（children 非空）绘制了子组件区域内的具体内容**
- [ ] 使用了绝对定位（`position: absolute`）作为主要布局方式
- [ ] 没有输出 `DRAW_SUCCESS` 状态码
- [ ] 生成的代码使用了项目未安装的框架或依赖
- [ ] 未运行 `prettier` 格式化生成的组件代码
- [ ] 未运行 `eslint` 检查，或明知 ESLint 报错仍跳过修复
- [ ] 未按要求设置 `--ap` 切图路径（应与组件目录结构镜像）
- [ ] **未验证切图文件存在性就直接生成代码**
- [ ] **设计稿切图存在却未使用，擅自用 CSS 或组件库图标替代**
- [ ] **用组件库图标替换设计稿导出的 icon 切图**
- [ ] **用纯 CSS 模拟替代设计稿已提供的背景/装饰切图**
- [ ] **未输出结构化数据提取表就直接生成代码**
- [ ] **忽略图层 `css` 数组中的属性，自行估算 font-size / color / border 等样式值**
- [ ] **忽略图层 `rect` 坐标，完全凭感觉排版（不看左右关系、不参考相对宽度比）**
- [ ] **布局容器全部用 px 写死宽高，未使用相对单位实现自适应**
- [ ] **忽略图层 `name` 字段，未将设计稿文案内容作为组件文本使用**
- [ ] **忽略图层 `styleName` 令牌，未记录设计系统样式映射**
