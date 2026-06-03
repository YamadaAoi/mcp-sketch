---
name: sketch-split
description: 本技能会提取 sketch Meaxure 设计稿 (zip/folder) 里的指定画板信息并合理规划待开发组件
metadata:
  author: zhouyinkui
  version: '2026.06.03'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能基于`mcp-sketch`工具的 `plan` 和 `locate` 命令，提取 Sketch Meaxure 设计稿（zip/folder）里的指定画板信息，合理拆分为待开发组件，并创建相应的空白组件和描述文档

# 阶段隔离声明

- 本技能只负责分析画板结构、输出`组件规划表`、创建**空白组件**
- **绝对禁止**在本阶段编写任何逻辑、样式、事件处理代码

## 核心铁律

### 铁律 1：目录结构规范

- 每个组件必须拥有**独立文件夹**，严禁平铺
  - 公共组件目录：`src/components/ComponentName/`（PascalCase 目录名）
  - 入口页面组件目录：`src/views/pageName/`（camelCase 目录名）
  - 业务组件目录：`src/views/pageName/componentName/`（camelCase 目录名）
- 组件名使用 PascalCase，至少由**两个单词**组成（如 `SidebarMenu`），避免单个单词命名

### 铁律 2：适配项目技术栈

- **绝不臆测项目技术栈**
- 创建空白组件文件前，先读取 `package.json` 和已有组件文件，确定后缀、写法、CSS 方案

### 铁律 3：公共组件必须强制提取

- 以下元素**必须**无条件提取为公共组件（`type: common`），禁止作为页面特有组件：
  - 侧边栏菜单
  - 顶部导航栏
  - 面包屑导航
  - 用户头像/名称/退出按钮组合
  - 页脚
  - 任何其他在多个画板中重复出现的布局元素
- 在创建前**必须**先检查 `src/components/`是否已有现成实现，有则直接复用、不创建空白文件

## 执行步骤

### 步骤 1：调用工具获取画板基本信息和预览图

- 根据用户输入或上下文推断参数
  - `-p`: Sketch 文件路径（zip或目录）
  - `--pn`: 页面名
  - `--an`: 画板名
- 调用工具：`npx -y mcp-sketch plan -p /path/to/zip --pn 页面名 --an 画板名`

### 步骤 2：读取预览图并分析画板结构

- **必须**读取工具返回的 `previewPath` 预览图
- 以资深前端开发的视角分析设计稿：
  - 判断层级：
    - 主页面：具有独立导航入口的页面
    - 子页面：弹窗、浮层、Tab 内容等依附于主页面的子页面
  - 识别页面中的独立功能区块
  - 判断哪些部分适合拆分为独立组件
  - **结合项目已有组件，避免重复创建**

### 步骤 3：拆分组件

- 严格按**铁律 3**的列表强制提取公共组件，其余按以下规则判断：
  - **业务组件**：当前页面内容区域内独有的功能区块（表格、表单、卡片列表等），放在页面 `pageName/` 下
- 如果画板属于子页面，**必须**判断其所属主页面是否存在，若不存在则将主页面也纳入此次规划
- 确定父子层级关系，**避免父组件重复渲染子组件区域**：
  - 若组件 A 的 `rect` 完全包含组件 B 的 `rect`，则 B 是 A 的直接子组件
  - 若 B 同时被 A 和 C 包含，取层级最近的（最内层容器）作为直接父组件
  - 例如：`Header [0,0,1920,64]` 包含 `Logo [20,10,100,44]`，则 Logo 是 Header 的直接子组件，Header 的 `exclude_rects` 为 `[[20,10,100,44]]`
  - 每个页面最多有一个 `type: page` 的父组件，若是子页面则为 `type: page-specific`
  - 所有父组件的 `exclude_rects` 必须包含所有直接子组件的 rect 坐标
  - 所有父组件的 `直接子组件` 必须列出所有直接子组件的名称

### 步骤 4：输出`组件规划表`

**规划表格式（必须包含以下字段）**：

| 组件名称 | 组件路径 | 组件描述 | 类型 | rect | exclude_rects (直接子组件) | 直接子组件 | 归属Artboard | 归属Page(主/子页面) |
| -------- | -------- | -------- | ---- | ---- | -------------------------- | ---------- | ------------ | ------------------- |

#### 字段说明：

- 组件路径：必须包含独立文件夹。公共组件在 `src/components/` 下，业务组件在 `src/views/pageName/` 下
- 类型：
  - `page`：页面入口组件，负责页面整体布局和子组件调用
  - `common`：跨页面复用的布局/公共组件（侧边栏、导航栏、面包屑、用户头像等）
  - `page-specific`：仅当前页面独有的功能区块
- rect 坐标：`[x, y, width, height]` 格式，单位 px
- exclude_rects：该组件之下直接子组件的 rect 坐标列表。无子组件则为 `[]`
- 直接子组件：该组件包含的直接子组件名称列表（PascalCase），用于在父组件中 import 和调用。无子组件则为 `[]`

### 步骤 5：调用工具获取画板图层基本信息

- 根据用户输入或上下文推断参数
  - `-p`: Sketch 文件路径（zip或目录）
  - `--pn`: 页面名
  - `--an`: 画板名
  - `-r`: n（排名前n个最影响页面布局的图层）
- 根据`组件规划表`中的`rect`推测需要获取前`n`个图层，用来推断组件实际布局
- 调用工具：`npx -y mcp-sketch locate -p /path/to/zip --pn 页面名 --an 画板名 -r n`

### 步骤 6：更新`组件规划表`

- 根据工具返回的图层信息，更新步骤 4输出的`组件规划表`
  - 结合通过预览图估计的`rect`和工具返回的图层`rect`，推断组件的实际布局，更新组件规划表中的`rect`字段
  - 根据组件的实际布局，若有变化则更新`组件规划表`中的`exclude_rects`、`直接子组件名称`、`组件路径`等字段
- 输出更新后的`组件规划表`

### 步骤 7：创建空白组件和描述文档

- 根据更新后的`组件规划表`创建空白组件和描述文档：
  - **强制**检查目标文件路径是否已存在，**如果存在**则跳过
  - 文件处理：
    - 创建**空白组件**文件，格式如下：
      - html部分

      ```html
      <div class="component-name">{{ ComponentName }}</div>
      ```

      - css部分

      ```css
      .component-name {
        width: 100%;
        height: 100%;
        position: relative;
        text-align: center;
        vertical-align: middle;
        background-color: 填入 随机-护眼-透明度30%-颜色;
      }
      ```

    - 创建对应的描述文档文件`ComponentName.md`，格式如下：

      ```markdown
      ---
      type: page|common|page-specific
      component_path: relative/path/to/ComponentName
      file_path: relative/path/to/sketch/export.zip
      page_name: somePage
      artboard_name: someArtboard
      rect: [x, y, width, height]
      exclude_rects: [[x1, y1, w1, h1], [x2, y2, w2, h2]] # 直接子组件的rect列表，无子组件则为 []
      children: [ChildComponentName1, ChildComponentName2] # 直接子组件名称列表，无子组件则为 []
      preview_path: relative/path/to/previewImage
      phase: split # 初始值 split，由 layout 更新为 layout，由 draw 更新为 draw
      ---

      ## 组件描述
      ```

### 步骤 8：将最新`组件规划表`写入主页面对应的描述`md`文件中（重要）

将 `组件规划表` 以表格形式追加写入入口页面组件的描述文档中，确保 `phase` 字段设为 `split`

## 输出格式

已完成【somePage】-【someArtboard】画板组件拆解，组件规划如下：

- 组件规划参考格式：

```markdown
relative/path/to/PageComponent (入口组件-新建)
├── relative/path/to/BusinessComponent1 (业务组件-新建)
│ └── relative/path/to/BusinessComponent2 (业务组件-新建)
├── relative/path/to/CommonComponent1 (公共组件-复用)
└── relative/path/to/CommonComponent2 (公共组件-新建)
```

## 后续动作

- **工作流模式**下组件拆解完成后，由 `skill: sketch-workflow` 调用 `skill: sketch-layout` 进行组件布局
