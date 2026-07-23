# Sketch Draw Skill

基于 `mcp-sketch analyze` 提供的图层数据，结合预览图视觉参考，生成符合项目技术栈的组件功能代码

## 核心约束

- **禁止自行解压**任何压缩文件！**禁止直接读取设计稿文件**
- **禁止**仅凭预览图直接写代码，**必须**先调用 `mcp-sketch analyze` 获取图层结构信息，返回的图层数据是代码生成的核心依据
- 组件的位置和大小完全**由父组件控制**，组件宽高撑满父级容器，位置为 `position: relative;`
- **复用 UI 组件库**：输入框、按钮、选择器、开关、日期选择器等基础组件，必须使用项目 UI 组件库中的成熟组件，禁止自己手写
- **防溢出意识**：编写任何子元素前，先确认父容器尺寸；子元素总宽度不能超过父容器；内容超出父容器高度时设置 `overflow: auto`
- **时刻自问两个问题**：①这个子元素会不会超出父容器？②如果父容器变小，子元素会不会挤在一起？
- **状态文件只读**：禁止直接新建、修改或删除 `.sketch-cache/` 下的状态文件。状态仅通过 `RECORD_STATE` 输出标记，由 Leader 负责写入

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名
- `component_path` — 组件文件路径
- `file_path` — 设计稿文件路径
- `requirements`（可选） — 修复调用时传 check 失败原因

`design_file_name = basename(file_path, '.zip')`

### 步骤 1：读取 `.sketch-cache/proj-init.md` 确认技术栈、导入方式、样式写法

- 若文件不存在，跳过之后所有步骤，返回失败信息：`proj-init.md 文件不存在`

### 步骤 2：读取状态文件

读取 `.sketch-cache/artboards/{design_file_name}/{page_name}/{artboard_name}/progress.json`

- 若不存在，跳过之后所有步骤，返回失败信息：`画板{page_name}-{artboard_name}中间状态不存在`
- 从状态文件中提取 `filePath`（Sketch 文件路径），后续 analyze 调用使用

### 步骤 3：检查组件状态

检查 `components` 数组中 `component_path` 对应的组件 `status` 是否为 `layout-check-done`

- 若状态不是 `layout-check-done`，跳过之后所有步骤，失败信息：`{component_path} 当前状态为 {status}，需要 layout-check-done 才能绘制`

### 步骤 4：分析 `requirements`，确定修复方式

- 若 `requirements` 描述了需要修复的问题（如 check 失败原因）
  - 1. 分析 `requirements`，判断问题类型：
    - **可简单修复**（格式问题如 prettier 格式异常、命名不规范、导入路径错误等表层问题）→ 定位到具体问题直接修正（如运行格式化命令、修正命名、调整导入路径），修复完成后跳到步骤 7 输出，无需重新执行 analyze 和绘制
    - **需重新绘制**（DOM 结构错误、关键元素缺失、交互逻辑不对等深层问题）→ 查看之前的组件绘制方案，带着 `requirements` 继续执行步骤 5
- 若不包含
  直接执行步骤 5

### 步骤 5：调用 analyze 获取图层数据

```bash
npx -y mcp-sketch analyze -f "{file_path}" --pn "{page_name}" --an "{artboard_name}" -r "[x,y,w,h]" -e "[[x1,y1,w1,h1]]" --limit {n} --offset {m}
```

**参数说明**：

| 参数       | 说明                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| `-f`       | **必传**。Sketch 导出文件路径（zip 或目录）                                                                    |
| `--pn`     | 页面名称                                                                                                       |
| `--an`     | 画板名称                                                                                                       |
| `-r`       | 组件的矩形区域，格式 `[x, y, width, height]`，从状态文件的 `rect` 字段获取。传入后只返回该区域内的图层         |
| `-e`       | 需要排除的矩形区域列表，格式 `[[x1,y1,w1,h1]]`，从状态文件的 `excludeRects` 字段获取。子组件占用的区域会被排除 |
| `--limit`  | 返回的图层数量。根据画板复杂度自行估算，简单画板 10~15 个，复杂画板 20~30 个                                   |
| `--offset` | 从第 m 个图层开始返回（默认 0）。排名靠前的图层通常是大面积布局容器，排名靠后的图层是细节元素                  |

**返回结构**：

```json
{
  "pageName": "页面名称",
  "name": "画板名称",
  "width": 100,
  "height": 200,
  "layers": [{ "type": "text|shape|slice", "name": "...", "rect": [x,y,w,h], "assets": [...] }],
  "previewPath": "预览图路径"
}
```

- `layers` 已按布局权重从高到低排序（基础分为面积，长宽比≥30的图层额外加权），且已过滤掉不含视觉属性的图层
- 每个图层的 `rect` 为数组格式 `[x, y, width, height]`
- `type: "slice"` 的图层包含 `assets` 数组，每个 asset 的 `path` 为切图文件的磁盘路径（已压缩为 webp）

### 步骤 6：解析返回结果

提取所有 `type: "slice"` 的图层，验证切图文件存在性

- 遍历每个 slice 的 `assets` 数组，根据切图的 `path` 检查文件是否存在于磁盘
  - 存在 → 记录完整路径，代码生成时引用
  - 缺失 → 降级为 CSS 模拟

#### 6.1 读取预览图

使用 `previewPath` 读取预览图，辅助理解组件的视觉层级关系，核对有无遗漏

#### 6.2 过滤无效图层

遍历 `layers`，按以下规则逐层判断：

- **`type: "slice"` 的图层始终保留，不参与过滤**
- **视觉叠加辅助层**：图层为纯色或渐变填充 → 对比预览图：
  - 该位置在预览图中呈现复杂内容（非纯色/渐变） → 辅助层，跳过
  - 该位置本身就是纯色或渐变 → 检查是否有切图能覆盖：
    - 有切图覆盖 → 冗余，跳过
    - 无切图覆盖 → 真实背景，保留

#### 6.3 替换骨架中的随机背景色

gen-base 阶段会为容器生成随机背景色，分析 analyze 返回的图层数据：

- 组件在设计稿中有背景色 → 替换 `css` 中的颜色值
- 组件在设计稿中无背景色（透明）→ 删除骨架中的css背景色

#### 6.4 代码生成

根据过滤后的 `layers` 生成组件代码

- **与项目现有代码风格一致**：生成的代码必须符合 `proj-init.md` 中的代码规范，包括命名规范、导入方式、CSS 方案等
- **增量生成**：**必须**读取现有内容，如果组件文件内容不为空（如已存在子组件容器 div 和 import），在保留子容器 div 和 import 的基础上填充本组件自身的内容
- **必须**使用响应式布局，灵活运用 `%`、`flex`、`calc` 等 CSS 布局技术
- **每个 div 容器必须有明确的宽高**：根节点 `width: 100%; height: 100%; position: relative;`，内部容器按布局需要设置具体宽高（% 或 flex），严禁出现无宽高定义的 div 容器
- **切图优先**通过 `background-image`引入
- **图表类组件用专业库实现**：遇到饼图、环形图、柱状图、折线图、雷达图等图表，禁止用 CSS/SVG 手写。检查 `package.json` 中是否已有图表库（echarts、highcharts 等），有则沿用；无则运行 `npm install echarts` 安装，生成 option 配置 + 组件封装代码
- 当需要 import 项目已有或私有 UI 库的组件时，尝试调用 `mcp: codegraph_explore` 获取精确类型：

```
codegraph_explore: "show me the full source and props interface of {component_name}"
```

不可用时回退 Read：读取 `node_modules/{lib}/**/*.d.ts` 或组件源码头部提取 Props 定义，拿到签名后再写 import 和传参

## 输出格式

成功：

```
组件 [{ComponentName}] 绘制完成

DRAW_SUCCESS
RECORD_STATE: components[{componentPath}].status = draw-done
```

成功（修复模式）：

```
已修复组件 [{componentPath}]

修复内容：<描述修复了什么>

DRAW_SUCCESS
RECORD_STATE: components[{componentPath}].status = draw-done
```

失败：

```
<错误描述>
DRAW_FAILED
```
