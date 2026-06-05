---
name: sketch-workflow
description: 选择画板后全自动 Sketch 代码生成工作流
metadata:
  author: zhouyinkui
  version: '2026.06.04'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能是 `Sketch` 代码生成自动化体系的"总指挥"，定义了一个完整的 5 阶段流水线

## 持久化存储：sketch-cache 目录

`sketch-cache`位于项目根目录，是工作流的核心工作目录，用于存储项目配置、中间状态和组件文档

### 目录结构

```
sketch-cache/
├── artboards/
│   └── {page_name}-{artboard_name}.json (画板中间状态文件)
│   └── ...
└── proj-init.md (项目基本信息)
```

### 文件说明

- **proj-init.md**：由 sketch-init 阶段生成，之后作为全局只读参考。包含项目技术栈、代码风格约定、目录结构约定
- **artboards/{page_name}-{artboard_name}.json**：画板中间状态文件：

```typescript
interface ArtboardState {
  pageName: string
  artboardName: string
  filePath: string
  stage?:
    | 'sketch-init'
    | 'sketch-pick'
    | 'sketch-split'
    | 'sketch-layout'
    | 'sketch-draw'
  components?: Array<{
    componentPath: string
    status?: 'created' | 'layout' | 'draw'
    children: string[]
    rect: [number, number, number, number]
    excludeRects: Array<[number, number, number, number]>
  }>
  lastUpdateTime: string
}
```

## 核心铁律

### 铁律 1：状态驱动，跳过已完成

- 每阶段执行前，先读取 `sketch-cache/artboards/{pageName}-{artboardName}.json`，根据 `stage` 判断是否已完成
- 已完成阶段**直接跳过**，绝不重复执行
- 阶段完成后立即更新 JSON 状态文件（`stage`、组件 `status`、`lastUpdateTime`）
- 不得修改其他画板的状态文件，也不得擅自修改 `sketch-cache/proj-init.md`

### 铁律 2：你是编排者，不是编码者

- **绝对禁止**自行编写组件代码
- 你只负责调度各阶段工作，把具体编码任务委托给子agent 处理
- 如发现某个阶段输出有误，应重新执行该阶段，而非自己动手修复

### 铁律 3：调度顺序严格

各阶段不可逆、不可跳跃：

`sketch-init → sketch-pick → sketch-split → sketch-layout → sketch-draw`

#### 调度表

| 阶段          | 何时执行                             | 负责什么                                                   |
| ------------- | ------------------------------------ | ---------------------------------------------------------- |
| sketch-init   | `sketch-cache/proj-init.md` 不存在时 | 读取项目代码，生成 proj-init.md                            |
| sketch-pick   | 用户尚未选定画板时                   | 枚举所有画板，等待用户单选                                 |
| sketch-split  | 画板 stage 未达到 `sketch-split`     | 分析画板设计稿，输出组件规划表，创建空白组件和 md 描述文档 |
| sketch-layout | 画板 stage 为 `sketch-split`         | 更新路由配置，为父组件编写子容器 div 和 import             |
| sketch-draw   | 组件 status 为 `layout` 或 `created` | 获取图层数据，生成组件功能代码                             |

## 子agent 通信协议

所有子agent 遵循统一的通信约定：

1. **启动**：委托子agent 并传入所需参数
2. **等待返回**：暂停流水线，等待子agent 执行完毕返回结果
3. **解析结果**：从返回内容中提取 `SUCCESS` 或 `FAILED` 标记
4. **分支处理**：
   - `SUCCESS` → 继续下一步（解析输出、磁盘验证、更新状态）
   - `FAILED` → 输出子agent 返回的错误描述并终止流水线，等待用户处理

## 委托模板

每次调度子 agent 时，**必须使用以下模板**，不得自行修改或省略约束条件。

### sketch-init 模板

```
请为当前项目初始化 sketch 工作流配置

项目信息：
- 工作目录：<WORK_DIR>
- 项目类型：<根据 package.json 描述>
- Sketch 文件路径：<FILE_PATH>

```

### sketch-pick 模板

```
请从 Sketch Meaxure 导出文件中枚举所有画板供用户选择

文件路径：<FILE_PATH>
```

### sketch-split 模板

```
请分析 Sketch 画板设计稿，拆分组件规划

文件信息：
- 文件路径：<FILE_PATH>
- 页面名称：<pageName>
- 画板名称：<artboardName>

```

### sketch-layout 模板

```
请为 Sketch 画板的组件执行布局配置

画板信息：
- 页面名称：<pageName>
- 画板名称：<artboardName>

```

### sketch-draw 模板

```
请为 Sketch 画板的指定组件生成功能代码。

组件信息：
- 组件路径：<componentPath>
- 描述文档路径：<md_path>
- 子组件：<children 列表（如有）>

```

## 入口流程

### 步骤 1：获取文件路径

要求用户提供 Sketch Meaxure 导出文件的路径（zip 或目录），记为 `FILE_PATH`。若用户未提供，主动询问

### 步骤 2：初始化项目配置

检查 `sketch-cache/proj-init.md` 是否存在。若不存在，委托子agent `sketch-init`，等待返回 `INIT_SUCCESS`。然后**磁盘验证** `sketch-cache/proj-init.md` 确实存在于磁盘，若不存在则让子agent 重新生成

### 步骤 3：选择画板

委托子agent `sketch-pick`，传入 `FILE_PATH`，等待用户选定画板

用户选定画板后，提取 `pageName` 和 `artboardName`：

- 若状态文件 `sketch-cache/artboards/{pageName}-{artboardName}.json` 已存在 → 读取恢复进度，向用户汇报当前阶段
- 若不存在 → 创建该文件写入初始状态：

```json
{
  "filePath": "<relative path to FILE_PATH>",
  "pageName": "...",
  "artboardName": "...",
  "stage": "sketch-pick",
  "components": [],
  "lastUpdateTime": "<当前时间>"
}
```

选定画板后进入自动流水线，每阶段执行前先读取 JSON 状态文件，**已完成的阶段直接跳过，绝不重复执行**

### 步骤 4：sketch-split — 组件拆分

若 `stage` 为 `sketch-split` 或更高 → **跳过**。否则：

1. 委托子agent `sketch-split`，传入 `FILE_PATH`、`pageName`、`artboardName`，等待返回 `SPLIT_SUCCESS`
2. 从子agent 输出的组件规划表中解析每个组件的信息（componentPath、children、rect、excludeRects）
3. **磁盘验证**：检查每个组件的代码文件和 `.md` 文档是否确实存在于磁盘，而非仅相信子agent 的返回。若文件缺失，让子agent 重新创建后再继续
4. 更新 JSON 状态：
   - `stage` → `sketch-split`
   - 将规划表中的组件填入 `components` 数组（`status: "created"`）
   - `lastUpdateTime` 更新

### 步骤 5：sketch-layout — 组件布局

若 `stage` 为 `sketch-layout` 或更高 → **跳过**

**前置校验**（仅 `stage === sketch-split` 时）：检查每个组件的代码文件和 `.md` 文件是否存在。有缺失则重置对应组件 `status` 为 `created`，回到步骤 4

1. 委托子agent `sketch-layout`，传入 `pageName`、`artboardName`，等待返回 `LAYOUT_SUCCESS`
2. **磁盘验证**：对有子组件的父组件，读取代码文件确认是否已包含子组件的 `import` 和子容器 `div`，而非仅相信子agent 的返回。若缺失，让子agent 重新处理
3. 更新 JSON 状态：
   - `stage` → `sketch-layout`
   - 有直接子组件的父组件 `status` → `layout`
   - `lastUpdateTime` 更新

### 步骤 6：sketch-draw — 组件绘制

遍历 `components`，对每个 `status` 不为 `draw` 的组件：

1. 读取该组件对应的 md 描述文档，获取元数据
2. **前置校验**：若该组件 `children` 不为空，检查 `import` 和子容器 `div` 是否存在。缺失则将该父组件 `status` 置回 `created`，回到步骤 5
3. 委托子agent `sketch-draw`，传入 md 中的元数据，等待返回 `DRAW_SUCCESS`
4. **磁盘验证**：读取文件内容确认是否已填充真实代码，而非仅相信子agent 的返回。若仍为空白占位符（只有 `<div>{{...}}</div>` 或空模板），让子agent 重新生成
5. 更新 JSON 状态：该组件 `status` → `draw`，`lastUpdateTime` 更新

全部组件 `status` 为 `draw` 后：

- `stage` → `sketch-draw`
- 输出 `画板 [pageName]-[artboardName] 全部组件生成完毕`

## 状态恢复

若工作流中断后重新启动：

1. 扫描所有 `sketch-cache/artboards/*.json`
2. 跳过 `stage: sketch-draw` 的已完成画板
3. 对未完成的画板，按 `stage` 升序排列，`stage` 相同时按 `lastUpdateTime` 降序排列（取最近更新的画板）
4. 选择排名第一的画板，从对应阶段继续

**还原验证**：恢复时对选定画板的每个组件执行三项磁盘检查：

- `.md` 描述文档缺失 → 该组件 `status` 重置为 `created`
- 代码文件缺失 → 该组件 `status` 重置为 `created`
- 父组件代码文件中缺少子组件 `import` 或子容器 `div` → 该父组件 `status` 重置为 `created`
- 重置后重新触发对应阶段
