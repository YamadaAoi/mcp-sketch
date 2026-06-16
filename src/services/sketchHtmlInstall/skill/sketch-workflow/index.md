此技能是 Sketch 代码生成自动化体系的"总指挥"，定义了一个完整的循环流水线

## 核心规则

1. **状态驱动**：每阶段执行前读取 JSON 状态文件，已完成阶段直接跳过
2. **你是编排者**：绝对禁止自行编写组件代码，只负责调度子agent
3. **顺序严格**：各阶段不可逆、不可跳跃
4. **Loop 模式**：审核失败可重试（最多 3 次），直到全部完成
5. **并行调度**：gen-base、gen-base-check、draw、draw-check 可并行处理多个组件
6. **信任 Check**：有 check 的阶段不再自行验证，完全信任 check 返回结果
7. **参数显式传递**：调用子agent时，必须在 prompt 中显式写出所有必要参数值，禁止让子agent自行推断或读取

## 状态定义

### 画板 stage（按顺序）

```
sketch-init → sketch-pick → sketch-split → sketch-bound → sketch-gen-base → sketch-gen-base-check → sketch-layout → sketch-layout-check → sketch-draw → sketch-draw-check → completed
```

### 组件 status（流转方向）

```
叶子组件（无子组件）：gen-base → gen-base-check-pass → ready-to-draw → draw → draw-check-pass → completed
父组件（有子组件）：gen-base → gen-base-check-pass → layout → layout-check-pass → ready-to-draw → draw → draw-check-pass → completed
```

### ArtboardState 类型

```typescript
interface ArtboardState {
  filePath: string // Sketch 导出文件路径（用于标识来源）
  previewPath?: string // 预览图路径（由 sketch-split 返回）
  pageName: string
  artboardName: string
  stage:
    | 'sketch-init'
    | 'sketch-pick'
    | 'sketch-split'
    | 'sketch-bound'
    | 'sketch-gen-base'
    | 'sketch-gen-base-check'
    | 'sketch-layout'
    | 'sketch-layout-check'
    | 'sketch-draw'
    | 'sketch-draw-check'
    | 'completed'
  components: Array<{
    componentPath: string
    type: 'page' | 'common' | 'page-specific'
    status:
      | 'gen-base'
      | 'gen-base-check-pass'
      | 'layout'
      | 'layout-check-pass'
      | 'ready-to-draw'
      | 'draw'
      | 'draw-check-pass'
      | 'completed'
    children: string[]
    rect: [number, number, number, number]
    excludeRects: Array<[number, number, number, number]>
    retryCount: number
    errors?: string[]
  }>
  lastUpdateTime: string
}
```

### 状态文件命名

```
sketch-cache/artboards/{pageName}-{artboardName}.json
```

## 流程步骤

### 步骤 1：获取文件路径

要求用户提供 Sketch Meaxure 导出文件路径（zip 或目录），记为 `FILE_PATH`

### 步骤 2：初始化项目配置

检查 `sketch-cache/proj-init.md` 是否存在：

- 不存在 → **必须按顺序执行以下两步**：
  1. 委托 `sketch-init`，传入参数 `WORK_DIR: <当前工作目录>`
  2. 等待 `sketch-init` 返回后，**立即**委托 `sketch-init-check`，不参数（无参数）
  3. 检查 `sketch-init-check` 返回结果：
     - 包含 `INIT_CHECK_SUCCESS` → 继续下一步
     - 包含 `INIT_CHECK_FAILED` → 重试（最多 3 次），超过则终止
- 存在 → 直接读取 proj-init.md 里的监听端口和启动命令
- 读取监听端口和启动命令，未占用端口则后台启动项目

### 步骤 3：选择画板

委托 `sketch-pick`，在 prompt 中显式写出参数：`FILE_PATH: <步骤1获取的文件路径>`

等待用户选择画板后：

- 已有状态文件 → 恢复进度，向用户汇报当前阶段
- 无 → 创建初始 JSON：

```json
{
  "filePath": "<FILE_PATH>",
  "previewPath": "",
  "pageName": "...",
  "artboardName": "...",
  "stage": "sketch-pick",
  "components": [],
  "lastUpdateTime": "<当前时间>"
}
```

### 步骤 4：sketch-split — 组件拆分

**触发**：`stage < sketch-split`

委托 `sketch-split`，在 prompt 中显式写出参数：

- `FILE_PATH: <文件路径>`
- `pageName: <页面名>`
- `artboardName: <画板名>`

从返回结果中：

- 解析组件规划表（componentPath、type、children、rect、excludeRects）
- 提取 `previewPath`（由 `mcp-sketch plan` 返回）

更新状态：

- `stage → sketch-split`
- `previewPath` 写入
- `components` 填入（`status: "gen-base"`、`retryCount: 0`）

### 步骤 5：sketch-bound — 边界修正

**触发**：`stage === sketch-split`

委托 `sketch-bound`，在 prompt 中显式写出参数：

- `FILE_PATH: <文件路径>`
- `pageName: <页面名>`
- `artboardName: <画板名>`
- `previewPath: <预览图路径>`

等待 `sketch-bound` 返回修正后的组件规划数据（注意：子agent只返回数据，不写入文件）

主流程根据返回数据更新状态文件中的 components，`stage → sketch-bound`

### 步骤 6：sketch-gen-base — 生成基础组件（可并行）

**触发**：`stage < sketch-gen-base-check` 且有 `status === "gen-base"` 的组件

并行委托 `sketch-gen-base`，对每个组件在 prompt 中显式写出参数：

- `pageName: <页面名>`
- `artboardName: <画板名>`
- `componentPath: <组件路径>`

生成基础代码，`stage → sketch-gen-base`

### 步骤 7：sketch-gen-base-check — 审核基础组件（可并行）

**触发**：有 `status === "gen-base"` 的组件

并行委托 `sketch-gen-base-check`，对每个组件在 prompt 中显式写出参数：

- `pageName: <页面名>`
- `artboardName: <画板名>`
- `componentPath: <组件路径>`

审核结果处理：

- SUCCESS → 根据 `children.length` 设置 `layout` 或 `ready-to-draw`
- FAILED → 重置为 `gen-base`，增加 retryCount，回到步骤 6

全部通过后 `stage → sketch-gen-base-check`

### 步骤 8：sketch-layout — 组件布局

**触发**：有 `status === "layout"` 的组件

委托 `sketch-layout`，在 prompt 中显式写出参数：

- `pageName: <页面名>`
- `artboardName: <画板名>`

处理父组件布局，`stage → sketch-layout`

### 步骤 9：sketch-layout-check — 布局审核

**触发**：有 `status === "layout"` 的组件

委托 `sketch-layout-check`，在 prompt 中显式写出参数：

- `pageName: <页面名>`
- `artboardName: <画板名>`

审核结果处理：

- SUCCESS → 这些组件 `status → ready-to-draw`，**等待用户确认布局效果**
- FAILED → 增加 retryCount，回到步骤 8

`stage → sketch-layout-check`

### 步骤 10：sketch-draw — 组件绘制（可并行）

**触发**：有 `status === "ready-to-draw"` 的组件

并行委托 `sketch-draw`，对每个组件在 prompt 中显式写出参数：

- `FILE_PATH: <文件路径>`
- `pageName: <页面名>`
- `artboardName: <画板名>`
- `componentPath: <组件路径>`

生成功能代码：

- 前置校验：有子组件的父组件需检查 import 和 div 是否存在，缺失则置回 layout
- `stage → sketch-draw`

### 步骤 11：sketch-draw-check — 绘制审核（可并行）

**触发**：有 `status === "draw"` 的组件

并行委托 `sketch-draw-check`，对每个组件在 prompt 中显式写出参数：

- `componentPath: <组件路径>`

审核结果处理：

- SUCCESS → `status → draw-check-pass`
- FAILED → 重置为 `ready-to-draw`，增加 retryCount，回到步骤 10（局部循环）

全部通过后：所有组件 `status → completed`，`stage → completed`

## 子agent 通信协议

### 单个子agent 调用

1. 启动：委托子agent 并传入参数
2. 等待：暂停流水线等待返回
3. 解析：提取 SUCCESS 或 FAILED 标记
4. 处理：SUCCESS 继续，FAILED 记录错误并重试（< 3次）或终止

### 并行调度聚合处理

当并行调用多个子agent 时（gen-base、gen-base-check、draw、draw-check）：

1. **启动**：同时委托所有需要处理的组件
2. **等待**：等待所有子agent 返回结果
3. **聚合**：逐个解析每个组件的返回结果
   - 成功 → 更新该组件状态
   - 失败 → 记录该组件错误，增加 retryCount
4. **统一处理**：
   - 若所有组件都成功 → 继续下一步
   - 若有组件失败但 retryCount < 3 → 仅重试失败的组件
   - 若有组件 retryCount >= 3 → 终止流水线，提示用户检查该组件

## 错误恢复

### 单个组件失败

- retryCount < 3 → 清零该组件的 retryCount，重新尝试
- retryCount >= 3 → 终止流水线，提示用户检查该组件

### 流水线中断重启

1. 扫描 `sketch-cache/artboards/*.json`
2. 跳过 `stage: completed` 的已完成画板
3. 对未完成的画板：
   - 清零所有 `retryCount >= 3` 的组件的 retryCount
   - 按 stage 升序、lastUpdateTime 降序选择画板继续
4. 磁盘检查：.md 缺失或代码缺失 → 组件重置为 `gen-base`；父组件缺 import/div → 重置为 `layout`

## 用户确认点

在 **sketch-layout-check 完成后**（步骤 9），暂停流水线，等待用户确认布局效果是否满意。用户确认后继续步骤 10。
