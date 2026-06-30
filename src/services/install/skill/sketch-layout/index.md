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
- 2. 读取预览图，判断当前页面属于哪种布局模式（参照下方「布局模式参考」）
- 3. 从入口页面组件（`type: page`）开始，按组件依赖树**深度优先遍历** `components` 中的每个组件：
  - `children` 为空 → 直接跳过
  - `children` 不为空：
    - 1. 根据 `rect` / `excludeRects` 计算每个子组件的布局信息
    - 2. 检查组件内容，如果组件已实现布局样式且符合布局信息，**直接跳过**
    - 3. 为每个直接子组件编写容器 `div`
      - 容器 `div` 的css类名基于子组件名称`{sub-component-name}-wrap`
      - 正确 `import` 子组件到当前组件，填入相应的 `div` 容器中
      - 判断组件是否相对父级组件上下或左右居中，若居中则优先使其居中
      - 编写CSS样式控制**子组件的位置和大小**，参照下方布局模式的宽高设置

## 布局模式参考

根据预览图判断页面属于哪种模式，按对应方案布局。

### 模式 1：Flex 居中

**适用场景**：登录页、注册页、弹窗、确认框、单个卡片居中

**判断依据**：页面中央有一个独立区块（登录框、表单卡片），四周留白

**布局方案**：

```
父容器（page 组件）
├─ display: flex
├─ justify-content: center
├─ align-items: center
├─ width: 100%
├─ height: 100%
└─ 子组件（居中卡片）
   ├─ 固定宽度（如 400px）或 max-width
   ├─ 固定高度或 auto 高度
   └─ 无固定定位，由 flex 自动居中
```

**变体 - 偏左/偏右**：

- 卡片靠左：`justify-content: flex-start` + `padding-left: 8%~15%`
- 卡片靠右：`justify-content: flex-end` + `padding-right: 8%~15%`

### 模式 2：左右布局（Sidebar + Main）

**适用场景**：管理后台、设置页、邮箱、文件管理器

**判断依据**：左侧有导航/菜单列表，右侧是主内容区，宽度不等分

**布局方案**：

```
父容器（page 组件）
├─ display: flex
├─ width: 100%
├─ height: 100%
├─ 左侧菜单（sidebar）
│  ├─ width: 固定像素（如 200px~280px）
│  ├─ height: 100%
│  └─ flex-shrink: 0
└─ 右侧内容（main）
   ├─ flex: 1（自动填满剩余宽度）
   ├─ height: 100%
   └─ overflow: auto（内容超出时滚动）
```

**变体 - 左窄右宽**：

- 左侧：`width: 60px~80px`（仅图标导航）
- 右侧：`flex: 1`

### 模式 3：上下布局（Header + Content）

**适用场景**：标准页面、文章页、详情页

**判断依据**：顶部有标题栏/导航栏，下方是内容区域，垂直排列

**布局方案**：

```
父容器（page 组件）
├─ display: flex
├─ flex-direction: column
├─ width: 100%
├─ height: 100%
├─ 顶部栏（header）
│  ├─ width: 100%
│  ├─ height: 固定像素（如 50px~64px）
│  └─ flex-shrink: 0
└─ 内容区（content）
   ├─ width: 100%
   ├─ flex: 1
   └─ overflow: auto
```

### 模式 4：上中下布局（Header + Content + Footer）

**适用场景**：官网首页、产品页、带版权页的标准页面

**判断依据**：顶部导航 + 中间内容 + 底部版权/链接栏

**布局方案**：

```
父容器（page 组件）
├─ display: flex
├─ flex-direction: column
├─ width: 100%
├─ height: 100%
├─ 顶部栏（header）
│  ├─ width: 100%
│  ├─ height: 固定像素（如 56px~64px）
│  └─ flex-shrink: 0
├─ 中间内容（content）
│  ├─ width: 100%
│  ├─ flex: 1
│  └─ overflow: auto
└─ 底部栏（footer）
   ├─ width: 100%
   ├─ height: 固定像素（如 40px~60px）
   └─ flex-shrink: 0
```

### 模式 5：全屏背景 + 居中卡片

**适用场景**：登录页（带背景图）、欢迎页、引导页

**判断依据**：整个页面有背景图/背景色，中央浮动一个卡片

**布局方案**：

```
父容器（page 组件）
├─ width: 100%
├─ height: 100%
├─ position: relative
├─ background-size: cover
├─ background-position: center
└─ 子组件（卡片）
   ├─ position: absolute（或 flex 居中）
   ├─ top: 50%, left: 50%, transform: translate(-50%, -50%)
   ├─ 固定宽高（如 420px × auto）
   └─ 或用 flex 居中（同模式 1）
```

### 模式 6：Grid 网格

**适用场景**：仪表盘、数据面板、图片墙、九宫格菜单

**判断依据**：多个卡片/模块按网格排列，大小均匀或有规律

**布局方案**：

```
父容器（page 组件）
├─ display: grid
├─ grid-template-columns: repeat(3, 1fr)  ← 3列等分
├─ gap: 16px~24px
├─ width: 100%
├─ height: 100%
└─ 子组件（卡片）
   ├─ 各占一个 grid 单元
   └─ 或跨列：grid-column: span 2
```

**常见列数**：

- 2 列：左右对比、双栏面板
- 3 列：仪表盘、功能入口
- 4 列：数据卡片、统计面板

### 模式 7：固定定位布局（Admin Layout）

**适用场景**：后台管理系统、CMS、ERP

**判断依据**：顶部固定导航 + 左侧固定菜单 + 右侧内容区，滚动时导航和菜单不随内容滚动

**布局方案**：

```
父容器（page 组件）
├─ width: 100%
├─ height: 100%
├─ 顶部导航（position: fixed / sticky）
│  ├─ top: 0
│  ├─ width: 100%
│  ├─ height: 48px~56px
│  └─ z-index 高
├─ 左侧菜单（position: fixed）
│  ├─ top: 顶部高度
│  ├─ left: 0
│  ├─ width: 180px~240px
│  ├─ height: calc(100% - 顶部高度)
│  └─ overflow: auto
└─ 右侧内容区
   ├─ margin-left: 左侧宽度
   ├─ margin-top: 顶部高度
   ├─ width: calc(100% - 左侧宽度)
   ├─ height: calc(100% - 顶部高度)
   └─ overflow: auto
```

### 模式 8：流式卡片列表

**适用场景**：商品列表、文章列表、标签页内容

**判断依据**：多个大小相近的卡片按行排列，可能自动换行

**布局方案**：

```
父容器（page 组件）
├─ display: flex
├─ flex-wrap: wrap
├─ gap: 12px~20px
├─ width: 100%
├─ height: 100%
├─ align-content: flex-start（顶部对齐）
└─ 子组件（卡片）
   ├─ width: 固定（如 250px）或百分比（如 calc(33.33% - gap)）
   ├─ height: 固定或 auto
   └─ flex-shrink: 0
```

### 模式 9：Tab 切换布局

**适用场景**：多标签页内容切换、设置面板、详情页多区块

**判断依据**：顶部或左侧有 Tab 标签栏，下方/右侧是对应内容

**布局方案**：

```
父容器（page 组件）
├─ display: flex
├─ flex-direction: column（上下 Tab）或 row（左右 Tab）
├─ width: 100%
├─ height: 100%
├─ Tab 栏
│  ├─ width: 100%（上下）或 固定宽度（左右）
│  ├─ height: 40px~48px（上下）或 100%（左右）
│  └─ flex-shrink: 0
└─ 内容区
   ├─ flex: 1
   ├─ width: 100%
   └─ overflow: auto
```

### 模式 10：嵌套左右布局

**适用场景**：三栏布局（菜单+子菜单+内容）、复杂后台

**判断依据**：多层嵌套的左右分栏

**布局方案**：

```
父容器（page 组件）
├─ display: flex
├─ width: 100%, height: 100%
├─ 左侧一级菜单（固定宽度）
│  └─ width: 60px~80px
├─ 中间二级菜单（固定宽度）
│  └─ width: 160px~200px
└─ 右侧内容（flex: 1）
   ├─ flex: 1
   └─ overflow: auto
```

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
路由和父组件布局已完成
LAYOUT_SUCCESS
```

失败：

```
<错误描述>
LAYOUT_FAILED
```
