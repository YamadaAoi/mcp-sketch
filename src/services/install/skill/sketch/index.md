## 铁律

1. **禁止以任何方式解压任何压缩包**

## 固定指令

一般由用户手动调用，如果没有调用，**在需要的时候自己调用**

| 指令               | 读取并执行                 | 描述                 | 参数           |
| ------------------ | -------------------------- | -------------------- | -------------- |
| `/sketch init`     | `./references/init.md`     | 了解当前项目         | 无             |
| `/sketch overview` | `./references/overview.md` | 概览设计稿内画板信息 | 设计稿（路径） |

## 设计稿结构

```
file_path(xx设计稿1)
└── page_name(页面名称1)
    ├── artboard_name(画板名称1)
    └── artboard_name(画板名称2)
```

## 工具调用方式

优先使用 MCP 工具（配置了 mcp-sketch MCP 服务时可用）；不可用时使用 CLI：

| 功能     | MCP 工具         | CLI                         |
| -------- | ---------------- | --------------------------- |
| 画板列表 | `sketch_list`    | `npx -y mcp-sketch list`    |
| 图层数据 | `sketch_analyze` | `npx -y mcp-sketch analyze` |
| 开发服务 | `sketch_dev`     | `npx -y mcp-sketch dev`     |
| 截图对比 | `sketch_compare` | `npx -y mcp-sketch compare` |

## 一般流程

1. 用户要求绘制 xx设计稿 里的 xx画板，判断`.sketch-cache`文件夹内是否存在 xx设计稿 的`list.json`

- 无：调用`/sketch overview`指令，概览 xx设计稿
- 有：继续
- 若设计稿文件的修改时间晚于 list.json，或 list.json 内容与用户描述明显不符，重新调用 `/sketch overview` 刷新

2. 读取 xx画板 信息：读取 `.sketch-cache/{design_file_name}/list.json`（由 `/sketch overview` 生成，`design_file_name = basename(file_path, '.zip')`），`artboards` 数组内获取 xx画板 的预览图路径与图层数据量

- 如果是第一次绘制 xx设计稿 里的画板，可以读取 xx设计稿 里的所有预览图了解项目情况
- `tokens` 字段为设计系统聚合（颜色/字号/字体/圆角/阴影/样式名按使用频次排序），建立主题变量或判断设计规范时使用，不强制
- 结合预览图和数据量，理解页面布局，合理划分组件
- 根据分析结果，调用 `sketch_analyze`（MCP 工具）或 `npx -y mcp-sketch analyze`（CLI）精确获取图层数据
  - 如果 xx画板 数据量很大，一次性读取得不偿失，可以按照组件划分区域，逐区域调用方法获取图层数据

```bash
npx -y mcp-sketch analyze -f "{file_path}" --pn "{page_name}" --an "{artboard_name}" -r "[x,y,w,h]" -e "[[x1,y1,w1,h1]]" -n "{name}" -t "{type}" --limit {n} --offset {m}
```

**参数说明**：

| 参数       | 说明                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `-f`       | **必传**。xx设计稿路径（zip 或目录）                                                                                 |
| `--pn`     | **必传**。页面名称                                                                                                   |
| `--an`     | **必传**。画板名称                                                                                                   |
| `-r`       | **可选**。组件的矩形区域，格式 `[x, y, width, height]`，传入后只返回**完全落于该区域内**的图层，边界跨界图层会被排除 |
| `-e`       | **可选**。需要排除的矩形区域列表，格式 `[[x1,y1,w1,h1]]`，子组件占用的区域会被排除                                   |
| `-n`       | **可选**。按图层名关键词过滤（大小写不敏感的子串匹配），用于快速定位特定图层（如 logo、关闭按钮）                    |
| `-t`       | **可选**。按图层类型过滤：`text` / `shape` / `slice`，如取整个画板的文案清单用 `text`                                |
| `--limit`  | 返回的图层数量。根据画板复杂度自行估算，简单画板 10~15 个，复杂画板 20~30 个                                         |
| `--offset` | 从第 m 个图层开始返回（默认 0）。排名靠前的图层通常是大面积布局容器，排名靠后的图层是细节元素                        |

**返回结构**：

```json
{
  "pageName": "页面名称",
  "name": "画板名称",
  "width": 100,
  "height": 200,
  "total": 42,
  "layers": [{ "type": "text|shape|slice", "name": "...", "rect": [x,y,w,h], "content": "...", "css": ["..."], "assets": [...] }],
  "previewPath": "预览图路径（相对项目根目录）"
}
```

- `layers` 已按布局权重从高到低排序（基础分为面积，长宽比≥30的图层额外加权），且已过滤掉不含视觉属性的图层
- `total` 为过滤后（分页前）的图层总数，配合 `--limit/--offset` 判断是否翻完
- 每个图层的 `rect` 为数组格式 `[x, y, width, height]`
- `index` 为原始图层顺序（z-order，值越大层级越高），用于判断图层的遮挡关系
- `type: "text"` 的图层带 `content` 字段（文本内容），样式（字体/字号/颜色/行高等）见 `css` 数组
- `opacity`/`rotation` 仅在非默认值（非 1 / 非 0）时附带
- `css` 数组承载了图层的主要视觉样式：文本的字体/字号/颜色/行高，形状的背景/渐变/圆角/边框/阴影；无信息量的默认值声明（`letter-spacing: 0` 等）已过滤
- `type: "slice"` 的图层是包含切图的图层，含 `assets` 数组，每个 asset 的 `path` 为切图文件路径（相对项目根目录，已压缩为 webp，可直接用于 import）

3. 汇总信息，选择合适的位置编写组件，插入路由（如果需要）

- 注意项目中**已有的UI库**和**已有的通用组件**，不要重复造轮子

4. 如果项目根目录存在配置文件`.env.sketch`，且配置了`SERVER_COMMAND`和`PREVIEW_URL`，调用 `sketch_dev`（MCP 工具）或执行以下命令启动开发服务

```bash
npx -y mcp-sketch dev
```

5. 如果本地服务启动成功，且Playwright MCP 工具（如 `browser_navigate`）可用，则探索展示本次绘制的内容，截图后调用 `sketch_compare`（MCP 工具）或以下命令与画板预览图对比，根据相似度分数与差异图修正页面

```bash
npx -y mcp-sketch compare -f "{file_path}" --pn "{page_name}" --an "{artboard_name}" -s "{screenshot_path}"
```

返回 `{ score, similarity, diffPath }`：`score` 越接近 1 越一致；`diffPath` 为差异放大图（差异处高亮），用于定位还原不一致的区域

- 如果截图功能可用，把图片保存到`.sketch-cache/{design_file_name}/{page_name}/{artboard_name}/screen_shot/{timestamp}.png`

## 意外情况处理

### 1、用户提供的画板名称在设计稿内不存在，或者有相似的画板名称

结合`.sketch-cache/{design_file_name}/list.json`（不存在时先调用 `/sketch overview`），提供最可能的一批画板选项供用户选择确认

### 2、某画板某块区域读取不到图层数据

有三种可能性：

- 设计师在设计时，对于不同画板的相同功能区，例如页面的头部、导航栏、内容区域等，通常只在其中一个画板详细绘制，其他画板参照该画板图层复用。这种情况可以结合预览图查找其他画板是否有此功能区域，如果有，在其他画板的该区域也许能查到图层数据。
- 有些设计师有自己的习惯，喜欢把切图类的图层放在单独的切图画板里。这种情况可以结合预览图查找切图画板是否有此切图区域，如果有，在切图画板的对应区域也许能查到图层数据。
- 还有可能设计师真的没有绘制这个区域，导致读取不到图层数据，结合预览图尝试还原该区域的布局。
