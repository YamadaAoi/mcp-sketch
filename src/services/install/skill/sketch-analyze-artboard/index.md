# Sketch Analyze Artboard Skill

确保所有指定画板的图层数据已解析落盘，并返回各画板的基础信息。**不做任何组件解读或规划**，组件规划由 sketch-split 统筹。

## 核心约束

- **禁止自行解压**任何压缩文件，**禁止直接读取设计稿文件**
- 只允许调用 `mcp-sketch analyze`（带 `--persist`）与读取 `.sketch-cache/` 下的缓存文件
- **禁止手动修改** `.sketch-cache/` 下的任何文件

## 执行步骤

参数由调用方传入：

- `artboards` — 画板对象数组（JSON 字符串），每个元素包含：
  - `file_path`（必需）— 设计稿路径
  - `page_name`（必需）— 页面名称
  - `artboard_name`（必需）— 画板名称
  - `rect`（可选）— 该画板的约束区域，格式 `[x, y, width, height]`
  - `exclude_rects`（可选）— 该画板的排除区域，格式 `[[x, y, width, height], ...]`

### 步骤 1：逐个解析并落盘图层数据

对数组中每个画板元素依次执行：

```bash
npx -y mcp-sketch analyze -f "{file_path}" --pn "{page_name}" --an "{artboard_name}" --persist -r "[x,y,w,h]" -e "[[x1,y1,w1,h1]]"
```

**参数说明**：

| 参数   | 说明                                                                               |
| ------ | ---------------------------------------------------------------------------------- |
| `-f`   | **必传**。Sketch 导出文件路径（zip 或目录）                                        |
| `--pn` | **必传**。页面名称                                                                 |
| `--an` | **必传**。画板名称                                                                 |
| `-r`   | **可选**。组件的矩形区域，格式 `[x, y, width, height]`，传入后只返回该区域内的图层 |
| `-e`   | **可选**。需要排除的矩形区域列表，格式 `[[x1,y1,w1,h1]]`，子组件占用的区域会被排除 |

## 输出格式

```
画板数据已就绪
- 预览图路径：{previewPath}
- 画板尺寸：{width} x {height}
- 图层总数：{layerCount}
- layer.json 路径：{resultPath}

ANALYZE_ARTBOARD_SUCCESS
RECORD_STATE: previewPath, width, height
```

> Leader 必须从每个画板的返回结果中提取 `layer.json 路径`，组装成 `artboards` 数组传给 sketch-split（每个元素含 `layer_path` 字段）

失败：

```
<错误描述>
ANALYZE_ARTBOARD_FAILED
```
