# Sketch Analyze Artboard Skill

确保所有指定画板的图层数据已解析落盘，并返回各画板的基础信息。**不做任何组件解读或规划**，组件规划由 sketch-split 统筹。

## 核心约束

- **禁止自行解压**任何压缩文件，**禁止直接读取设计稿文件**
- 只允许调用 `mcp-sketch analyze`（带 `--persist`）与读取 `.sketch-cache/` 下的缓存文件
- **禁止手动修改** `.sketch-cache/` 下的任何文件

## 执行步骤

参数由调用方传入：

- `artboards` — 画板对象数组（JSON 字符串），每个元素包含 `file_path`、`page_name`、`artboard_name` 三个字段，如：
  ```json
  [
    { "file_path": "/path/design.zip", "page_name": "xxx", "artboard_name": "yyy" },
    ...
  ]
  ```
- `rect`（可选）— 约束区域，格式 `[x, y, width, height]`，应用于所有画板
- `exclude_rects`（可选）— 排除区域，格式 `[[x, y, width, height], ...]`，应用于所有画板

### 步骤 1：逐个解析并落盘图层数据

对数组中每个画板元素依次执行：

```bash
npx -y mcp-sketch analyze -f "{file_path}" --pn "{page_name}" --an "{artboard_name}" --persist [--rect "{rect}"] [--exclude_rects "{exclude_rects}"]
```

- 工具会自动把全量排序后的图层数据写入 `.sketch-cache/artboards/{design_file_name}/{page_name}/{artboard_name}/layer.json`
- 有 `rect` 或 `exclude_rects` 时，写入 `{artboard_name}/{hash}/layer.json`（hash 为约束条件的 MD5 前 8 位）
- 已存在且设计稿未更新时直接复用，不会重复解析
- 每个画板返回结果中包含**layer.json 的完整路径**

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
