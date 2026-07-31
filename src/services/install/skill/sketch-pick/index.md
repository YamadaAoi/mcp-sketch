# Sketch Pick Skill

提取 Sketch Meaxure 设计稿中的所有画板，以清晰的方式呈现给用户，由用户选定需要处理的画板

## 核心约束

- **禁止自行解压**任何压缩文件！
- 只能通过`mcp-sketch list`工具获取画板信息，**禁止直接读取设计稿文件**
- 本阶段只允许使用 `mcp-sketch list`，严禁调用其他 `mcp-sketch` 子命令
- **状态文件只读**：禁止直接新建、修改或删除 `.sketch-cache/` 下的状态文件。状态仅通过 `RECORD_STATE` 输出标记，由 Leader 负责写入

## 执行步骤

参数由调用方传入：

- `FILE_PATHS` — Sketch 文件路径数组（JSON 字符串），如 `["/path/design.zip"]`；用户给了多个设计稿时传入多个路径，如 `["/path/a.zip", "/path/b.zip"]`
- `mode`（可选，默认 `single`） — `single` 单选，`multi` 多选（由 Leader 推断用户意图后传入）

### 步骤 1：调用 list 获取所有画板

对 `FILE_PATHS` 中的每个路径依次执行：

```bash
npx -y mcp-sketch list -f "{file_path}" --persist
```

- 工具会把画板列表写入 `.sketch-cache/artboards/{design_file_name}/list.json`（`design_file_name = basename(file_path, '.zip')`）
- 返回 `artboard list saved to <path>` 时，读取该 list.json 获取画板内容
- 汇总所有设计稿的画板，统一展示给用户

### 步骤 2：用户选择

- **`mode = single`（默认）**：展示画板列表，供用户**单选**
- **`mode = multi`**：展示画板列表，引导用户**多选**
- 等待用户选择

## 输出格式

### 单选成功：

```
选中画板：
- file_path: /path/design.zip, page_name: 页面名, artboard_name: 画板名
PICK_SUCCESS
RECORD_STATE: filePath, pageName, artboardName
```

### 多选成功（同一功能组）：

```
选中画板（共 n 个）：
- file_path: /path/design.zip, page_name: page1, artboard_name: initial
- ......
PICK_GROUP_SUCCESS
RECORD_STATE: filePath, pageName, artboardName（逐个写入每个画板）
```

### 失败：

```
<错误描述>
PICK_FAILED
```
