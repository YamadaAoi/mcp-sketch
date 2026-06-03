---
name: sketch-draw
description: 本技能会提取 sketch 设计稿 (zip 或目录) 里的指定画板指定区域设计结构并生成前端组件代码
metadata:
  author: zhouyinkui
  version: '2026.06.03'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能基于`mcp-sketch analyze`命令提取画板指定区域基本信息和预览图，编写符合项目技术栈的前端组件代码

## 核心铁律

### 铁律 1：必须基于 rect 参数限定绘制范围

- **必须**使用 `rect` 参数 `[x, y, width, height]` 限定本次绘制的区域范围
- **只能**绘制该矩形区域内的内容

### 铁律 2：必须调用 analyze 工具

- **禁止**仅凭预览图直接写代码
- **必须**先调用 `mcp-sketch analyze` 获取图层结构信息
- 工具返回的 `artboard` 数据是代码生成的核心依据

### 铁律 3：适配项目技术栈

- **禁止臆测项目技术栈**
- 生成文件前，读取 `package.json` 的 `dependencies` 确定技术栈，查看已有组件文件确定写法
- 路由配置、导入方式、样式写法都必须与项目现有代码一致
- 不要引入项目未使用的依赖

### 铁律 4：组件的位置和大小完全由父组件控制

- 每个组件的大小都是`width: 100%; height: 100%;`，位置都是`position: relative;`
- **必须**由父组件根据`组件规划表`中的布局信息，为子组件编写合适的容器，控制子组件的位置和大小

## 执行步骤

### 步骤 1：读取待绘制的组件描述文档

- 从用户输入或上下文推断当前需要绘制的组件，找到对应的`md`描述文档
- 读取描述文档，获取元数据

### 步骤 2：调用工具获取画板信息和预览图

- 根据元数据推断参数
  - `-p`：Sketch 文件路径（zip 或目录，必填）
  - `--pn`：页面名（必填）
  - `--an`：画板名（必填）
  - `-r`：矩形区域坐标 `[x, y, width, height]`（必填）
  - `-e`：排除矩形区域坐标列表 `[[x, y, width, height]]`（可选）
  - `--ap`：切图存放路径
    - 从元数据的 `component_path` 字段中提取组件相对路径，镜像映射到 `src/assets/` 下
      - 页面特有组件：`component_path: src/views/pageName/componentName/ComponentName` → `--ap src/assets/views/pageName/componentName/`
      - 公共组件：`component_path: src/components/Header/Header` → `--ap src/assets/components/Header/`
- 调用工具：`npx -y mcp-sketch analyze -p /path/to/zip --pn 页面名 --an 画板名 -r "[x,y,w,h]" -e "[[x1,y1,w1,h1]]" --ap src/assets/views/pageName/componentName/`

### 步骤 3：读取工具返回结果

工具返回格式：`{artboard: {...}, previewPath: "..."}`

#### 3.1 解析 artboard 数据（逐图层完整提取）

| 图层类型        | 必须提取的字段                     | 用途                       |
| --------------- | ---------------------------------- | -------------------------- |
| `type: "text"`  | `name`、`rect`、`css`              | 文本元素的精确样式和内容   |
| `type: "shape"` | `name`、`rect`、`css`、`styleName` | 盒模型、背景色、边框、圆角 |
| `type: "slice"` | `name`、`rect`、`assets`           | 切图引用和尺寸             |

#### 3.2 读取预览图

- 使用 `previewPath` 读取预览图，辅助理解组件的视觉层级关系
- 核对 `artboard` 数据，确认没有遗漏重要图层

### 步骤 4 验证切图文件存在性（强制）

`analyze` 工具会将切图提取到 `--ap` 指定的目录。**代码生成前必须验证**：

- 从返回结果的 `artboard.layers` 中提取所有 `type: "slice"` 的图层
- 遍历每个 slice 的 `assets` 数组，根据切图的`path`检查每个切图文件是否存在于磁盘上
  - **若切图缺失**：输出警告 `"切图缺失：[path]"`，并在后续步骤中降级为 CSS 模拟
  - **若切图存在**：记录完整路径列表，后续代码生成时必须引用

**验证结果示例输出**：

```
切图验证：
  ✓ icon_账号.png — 存在于 src/assets/views/login/icon_账号.png
  ✗ icon_密码.png — 缺失，将降级为 CSS 模拟
```

### 步骤 5：代码生成

根据前置步骤获得的信息生成组件代码

- **增量生成**：如果组件文件内容不为空（例如 layout 阶段已写入子容器 div 和 import），**必须**读取现有内容，在保留子容器 div 和 import 的基础上填充本组件自身的内容
- **叶组件**（无子组件）：生成完整内容
- **父组件**（有子组件）：保留 layout 阶段写入的子容器 div 和 import，在本组件内容区域填充自身 UI
- **必须**使用`响应式`布局，灵活运用`%`，`flex`，`calc`等css布局技术
- **与项目现有代码风格一致**：写法、导入方式、CSS 方案、命名规范均参考已有组件
- **切图必须引用**：设计稿导出的切图`优先`通过`background-image`使用

### 步骤 5.1：更新 phase 状态

- 将本组件对应的描述文档中的 `phase` 字段更新为 `draw`

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

### 步骤 7：输出结果

```
组件 [ComponentName] 生成完毕
DRAW_SUCCESS
```
