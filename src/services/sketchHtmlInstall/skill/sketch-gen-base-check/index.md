# Sketch Gen Base Check Skill

审核 `sketch-gen-base` 生成的基础组件代码是否符合规范

## 核心约束

- **绝不自行编写代码**：只审核和报告，不修改文件
- **禁止执行任何写入操作**

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名
- `component_path` — 组件文件路径

### 步骤 1：检查组件文件是否存在

读取 `component_path` 指向的组件文件，若不存在，返回失败信息：`{component_path} 组件文件不存在`

### 步骤 2：检查组件文件夹结构

检查组件是否有自己的专属同名文件夹，若没有，返回失败信息：`{component_path} 缺少专属同名文件夹`

### 步骤 3：检查组件描述文件

检查 `component_path` 去掉扩展名加 `.md` 的描述文件是否存在（如 `Login.vue` → `Login.md`），且 frontmatter 格式正确（包含 type、component_path、file_path、page_name、artboard_name 字段）

### 步骤 4：检查 DOM 结构

1. 组件只包含**单个根节点**
2. 根节点类名为 `component-name`
3. 根节点内只包含组件名称文本，无额外包裹层或嵌套

### 步骤 5：检查样式规范

1. 宽度 100%，高度 100%
2. `position: relative`
3. 使用 Flex 布局实现水平与垂直居中
4. 设置了护眼背景色，透明度为 50%

### 步骤 6：检查无导入语句

确认组件内没有 `import` 语句，不包含任何业务逻辑

### 步骤 7：运行 lint/typecheck

- lint：`eslint <component_path>`（精确到组件文件，无需全量扫描）
- typecheck：`tsc --noEmit`（不支持指定文件，需全量检查，过滤 `component_path` 相关错误）
- 若项目没有对应检查工具，跳过即可

## 输出格式

成功：

```
`{component_path}` 基础组件审核通过
GEN_BASE_CHECK_SUCCESS
```

失败：

```
基础组件审核失败：
- 组件路径：{component_path}
- 问题类型：{文件缺失 | 文件夹结构错误 | 描述文件异常 | DOM结构不规范 | 样式不规范 | 存在导入语句 | lint错误 | typecheck错误}
- 问题描述：{具体问题}
- 修复建议：{建议如何修复}
GEN_BASE_CHECK_FAILED
```
