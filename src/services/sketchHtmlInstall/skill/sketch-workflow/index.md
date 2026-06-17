此技能是 Sketch 代码生成自动化体系的"总指挥"，定义了一个完整的循环流水线

## 核心规则

1. **状态驱动**：每阶段执行前读取 JSON 状态文件，已完成阶段直接跳过
2. **你是编排者**：绝对禁止自行编写组件代码，只负责调度子agent
3. **顺序严格**：各阶段不可逆、不可跳跃
4. **Loop 模式**：审核失败可重试（最多 3 次），直到全部完成
5. **并行调度**：gen-base、draw、draw-check 可并行处理多个组件
6. **参数显式传递**：调用子agent时，必须在 prompt 中显式写出所有必要参数值，禁止让子agent自行推断或读取

## 状态定义

### 画板 stage（按顺序）

```
sketch-init → sketch-pick → sketch-split → sketch-bound → sketch-gen-base → sketch-layout → sketch-draw → sketch-draw-check → completed
```

### 组件 status（流转方向）

```
叶子组件（无子组件）：gen-base → ready-to-draw → draw → draw-check-pass → completed
父组件（有子组件）：gen-base → layout → ready-to-draw → draw → draw-check-pass → completed
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
    | 'sketch-layout'
    | 'sketch-draw'
    | 'sketch-draw-check'
    | 'completed'
  components: Array<{
    componentPath: string
    type: 'page' | 'common' | 'page-specific'
    status:
      | 'gen-base'
      | 'layout'
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

- 不存在 → 委托 `sketch-init`，传入参数 `WORK_DIR: <当前工作目录>`
  - SUCCESS → 继续
  - FAILED → 重试（最多 3 次），超过则终止
- 存在 → 跳过

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

**触发**：有 `status === "gen-base"` 的组件

并行委托 `sketch-gen-base`，对每个组件在 prompt 中显式写出参数：

- `pageName: <页面名>`
- `artboardName: <画板名>`
- `componentPath: <组件路径>`

等待所有返回后：

- SUCCESS → 根据 `children.length` 设置 `layout` 或 `ready-to-draw`
- FAILED → 增加 retryCount，重新尝试（最多 3 次），超过则终止

全部通过后 `stage → sketch-gen-base`

### 步骤 7：sketch-layout — 组件布局

**触发**：有 `status === "layout"` 的组件

委托 `sketch-layout`，在 prompt 中显式写出参数：

- `pageName: <页面名>`
- `artboardName: <画板名>`

等待返回：

- SUCCESS → 这些组件 `status → ready-to-draw`
  - 打开浏览器预览布局效果：
    1. 读取 `sketch-cache/proj-init.md` 获取本地开发服务器配置，若未配置则跳过
    2. 拼接预览 URL：hash 模式 `http://localhost:{端口}/#/{路由路径}`，history 模式 `http://localhost:{端口}/{路由路径}`
    3. 使用 bash 命令打开页面（`start {url}` 或 `open {url}`）
  - **等待用户确认布局效果**
- FAILED → 增加 retryCount，重新尝试（最多 3 次），超过则终止

`stage → sketch-layout`

### 步骤 8：sketch-draw — 组件绘制（可并行）

**触发**：有 `status === "ready-to-draw"` 的组件

并行委托 `sketch-draw`，对每个组件在 prompt 中显式写出参数：

- `FILE_PATH: <文件路径>`
- `pageName: <页面名>`
- `artboardName: <画板名>`
- `componentPath: <组件路径>`

等待所有返回后：

- SUCCESS → 该组件 `status → draw`
- FAILED → 增加 retryCount，重新尝试（最多 3 次），超过则终止

全部通过后 `stage → sketch-draw`

### 步骤 9：sketch-draw-check — 绘制审核（可并行）

**触发**：有 `status === "draw"` 的组件

并行委托 `sketch-draw-check`，对每个组件在 prompt 中显式写出参数：

- `componentPath: <组件路径>`

审核结果处理：

- SUCCESS → `status → draw-check-pass`
- FAILED → 解析返回内容，提取 `componentPath` 和 `errorDescription`：
  - 委托 `sketch-draw`（传入 `FILE_PATH`、`pageName`、`artboardName`、`componentPath`、`errorDescription`）进入修复模式
  - 修复后重新委托 `sketch-draw-check` 审核
  - 若修复失败 → 增加 retryCount，回到步骤 8 重新绘制

全部通过后：所有组件 `status → completed`，`stage → completed`

## 子agent 通信协议

### 单个子agent 调用

1. 启动：委托子agent 并传入参数
2. 等待：暂停流水线等待返回
3. 解析：提取 SUCCESS 或 FAILED 标记
4. 处理：SUCCESS 继续，FAILED 记录错误并重试（< 3次）或终止

### 并行调度聚合处理

当并行调用多个子agent 时（gen-base、draw、draw-check）：

1. **启动**：同时委托所有需要处理的组件
2. **等待**：等待所有子agent 返回结果
3. **聚合**：逐个解析每个组件的返回结果
   - 成功 → 更新该组件状态
   - 失败 → 解析错误描述，记录需要修复的组件
4. **统一处理**：
   - 若所有组件都成功 → 继续下一步
   - 若有组件失败 → 并行委托对应 agent 进入修复模式，修复后重新审核
   - 若修复后仍有失败但 retryCount < 3 → 仅重试失败的组件
   - 若有组件 retryCount >= 3 → 终止流水线，提示用户检查该组件

## 错误恢复

### 单个组件失败

- retryCount < 3 → 增加 retryCount，重新尝试
- retryCount >= 3 → 终止流水线，提示用户检查该组件

### 流水线中断重启

1. 扫描 `sketch-cache/artboards/*.json`
2. 跳过 `stage: completed` 的已完成画板
3. 对未完成的画板：
   - 清零所有 `retryCount >= 3` 的组件的 retryCount
   - 按 stage 升序、lastUpdateTime 降序选择画板继续
4. 磁盘检查：.md 缺失或代码缺失 → 组件重置为 `gen-base`

## 用户确认点

在 **sketch-layout 完成后**（步骤 7），暂停流水线，等待用户确认布局效果是否满意。用户确认后继续步骤 8。
