# Sketch Gen Base Check Skill

批量审核 `sketch-gen-base` 生成的基础组件代码是否符合规范

## 核心约束

- **绝不自行编写代码**：只审核和报告，不修改文件
- **禁止执行任何写入操作**
- **状态文件只读**：禁止直接新建、修改或删除 `.sketch-cache/` 下的状态文件。状态仅通过 `RECORD_STATE` 输出标记，由 Leader 负责写入

## 执行步骤

参数由调用方传入：

- `page_name` — 页面名
- `artboard_name` — 画板名
- `file_path` — 设计稿文件路径

`design_file_name = basename(file_path, '.zip')`

### 步骤 1：读取状态文件

读取 `.sketch-cache/artboards/{design_file_name}/{page_name}/{artboard_name}/progress.json`

- 若不存在，返回失败信息：`画板{page_name}-{artboard_name}中间状态不存在`

### 步骤 2：提取待检查组件

从状态文件的 `components` 数组中，筛选 `status = 'gen-base-done'` 的组件

- 若没有 `gen-base-done` 状态的组件，返回：`没有需要检查的组件`

### 步骤 3：遍历检查每个组件

对每个 `gen-base-done` 组件执行以下检查：

#### 3a. 检查组件文件是否存在

读取 `component_path` 指向的组件文件，若不存在，记录失败：`{component_path} 组件文件不存在`

#### 3b. 检查组件是否在状态文件中

检查 `components` 数组是否存在 `component_path`，若不存在，记录失败：`{component_path} 组件没有按照规划路径创建`

#### 3c. 检查组件描述文件

- 检查组件所在目录下是否有同名的 `.md` 文件：如 `LoginForm.vue` 所在文件夹 `loginForm` 下是否有 `LoginForm.md`
- 检查其 frontmatter 格式是否正确：是否包含 type、component_path、file_path、page_name、artboard_name 字段

#### 3d. 检查 DOM 结构

1. 组件只包含**单个根节点**
2. 根节点类名与组件名一致（小写连字符格式，如 `LoginUser` → `login-user`）
3. 根节点内只包含组件名称文本，无额外包裹层或嵌套

#### 3e. 检查样式规范

1. 宽度 100%，高度 100%
2. `position: relative`
3. 使用 Flex 布局实现水平与垂直居中
4. 设置了护眼背景色，透明度为 50%

#### 3f. 检查无导入语句

确认组件内没有 `import` 语句，不包含任何业务逻辑

#### 3g. 运行 lint/typecheck

- lint：`eslint <component_path>`（精确到组件文件，无需全量扫描）
- typecheck：`tsc --noEmit`（不支持指定文件，需全量检查，过滤 `component_path` 相关错误）
- 若项目没有对应检查工具，跳过即可

### 步骤 4：汇总结果

将所有组件的检查结果汇总，输出每个组件的通过/失败状态

## 输出格式

全部通过：

```
全部组件审核通过，共 {n} 个组件
GEN_BASE_CHECK_SUCCESS
RECORD_STATE: components[{componentPath}].status = gen-base-check-done（所有通过的组件）
TARGET_PAGE: {targetPage}（状态文件中有 targetPage 时输出，无则省略）
```

存在失败：

```
基础组件审核结果（共 {total} 个，{passCount} 个通过，{failCount} 个失败）：

通过：
- {component_path_1}
- {component_path_2}

失败：
- 组件路径：{component_path}
  问题类型：{文件缺失 | 文件夹结构错误 | 描述文件异常 | DOM结构不规范 | 样式不规范 | 存在导入语句 | lint错误 | typecheck错误}
  问题描述：{具体问题}
  修复建议：{建议如何修复}
（逐个列出所有失败组件）
GEN_BASE_CHECK_FAILED
RECORD_STATE: 仅记录通过的组件为 gen-base-check-done，失败组件保持 gen-base-done
```
