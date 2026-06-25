# Sketch Bound Skill

根据设计稿图层数据，修正组件规划的 `rect`，确保与设计稿一致。

## 核心约束

- **禁止自行解压**任何压缩文件！
- 只能通过`mcp-sketch analyze`工具获取画板信息，**禁止直接读取设计稿文件**
- 本阶段只允许使用 `mcp-sketch analyze`，严禁调用其他 `mcp-sketch` 子命令

## 执行步骤

以下步骤中的 `FILE_PATH`、`page_name`、`artboard_name`、`preview_path`、`errorDescription` 均由调用方传入上下文

### 步骤 1：读取 `sketch-cache/artboards/{page_name}-{artboard_name}.json` 文件

- 若不存在，跳过之后所有步骤，返回失败信息：`画板{page_name}-{artboard_name}中间状态不存在`
- 若存在，读取 components 字段用于后续修正

### 步骤 2：检查`components`字段是否存在非空数组

- 若不存在，跳过之后所有步骤，返回失败信息：`画板{page_name}-{artboard_name}中间状态不存在 components 字段`
- 若存在，查看规划了多少个组件

### 步骤 3：查看输入参数是否包含`errorDescription`

- 若包含
  - 1. 读取 `sketch-cache/artboards/{page_name}-{artboard_name}.json`，查看之前的组件修正结果
  - 2. 带着 `errorDescription` 继续执行步骤 4，根据实际情况重新修正组件
- 若不包含
  直接执行步骤 4

### 步骤 4：读取预览图（可选）

- 读取 `preview_path` 预览图，以资深前端架构师的视角分析设计稿布局
- 此步骤用于辅助理解组件层级关系和布局意图，提高修正准确性

### 步骤 5：使用 `mcp-sketch analyze` 工具获取图层列表

- 返回的 `layers` 已按布局权重从高到低排序（基础分为面积，长宽比≥30的图层额外加权），且已过滤掉不含视觉属性的图层
- 每个图层的 `rect` 为数组格式 `[x, y, width, height]`
- 估算需要获取前多少个图层用于修正，一般规划的组件都是影响布局的组件，例如components里有10个组件，则至少需要获取前10个图层，可以适当增加获取数量，以确保所有组件的`rect`都能被修正

```bash
npx -y mcp-sketch analyze -p {FILE_PATH} --pn {page_name} --an {artboard_name} --offset {m} --limit {n}
```

### 步骤 6：遍历`components`数组，逐个修正每个组件的 rect、exclude_rects、children等字段

- sketch-split 输出的组件规划是根据预览图粗略估计的`rect`（对象格式 `{x, y, width, height}`），需要根据 analyze 返回的实际图层数据进行修正（图层`rect`为数组格式 `[x, y, width, height]`）
- 结合预览图分析结果和图层数据，找出与规划组件在**上下左右4个方向上误差最小**的图层
  - 计算方式：上下方向误差基于图层高度，左右方向误差基于图层宽度，取4个方向误差的平均值
  - 若平均误差在 **10% 以内**，即可认为该组件与该图层对应，用该图层的`rect`修正该组件的`rect`
  - 若平均误差在 **10% 以外**，不修正该组件的尺寸
  - 若此次修正的组件是其他组件的`直接子组件`，需要同步修正其他组件的`exclude_rects`字段

## 输出格式

**重要**：返回修正后的组件规划数据，由主流程更新状态文件，禁止自行写入 sketch-cache 目录

成功：

```
已完成【pageName】-【artboardName】画板组件修正，修正后组件规划如下：

| 组件名称 | 组件路径 | 组件描述 | 类型 | rect | exclude_rects | 直接子组件 | 归属Artboard | 归属Page |
| -------- | -------- | -------- | ---- | ---- | ------------- | ---------- | ------------ | -------- |

BOUND_SUCCESS
```

失败：

```
<错误描述>
BOUND_FAILED
```
