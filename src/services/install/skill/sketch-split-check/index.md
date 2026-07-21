# Sketch Split Check Skill

审核 `sketch-split` 的组件拆分结果：路径命名规范 + 拆分合理性

## 核心约束

- **绝不自行编写代码**：只审核和报告，不修改文件
- **禁止执行任何写入操作**
- **状态文件只读**：禁止直接新建、修改或删除 `.sketch-cache/` 下的状态文件。状态仅通过 `RECORD_STATE` 输出标记，由 Leader 负责写入

## 执行步骤

参数由调用方（Leader）传入：

- `page_name` — 页面名
- `artboard_name` — 画板名
- `file_path` — 设计稿文件路径

`design_file_name = basename(file_path, '.zip')`

### 步骤 1：读取状态文件

读取 `.sketch-cache/artboards/{design_file_name}/{page_name}/{artboard_name}/progress.json`

- 若不存在，返回失败信息：`画板{page_name}-{artboard_name}中间状态不存在`

### 步骤 2：提取待检查组件

从状态文件的 `components` 数组中，筛选 `status = 'split-done'` 的组件

- 若没有 `split-done` 状态的组件，返回：`没有需要检查的组件`

### 步骤 3：targetPage 校验（全局检查）

检查 `components` 数组中是否存在 `type = 'section'` 的组件：

- **存在** → 检查状态文件中 `targetPage` 字段是否存在且不为空
  - **不存在或为空** → 直接返回失败：`存在 section 组件但未配置目标页面（targetPage），split 阶段未推断或未写入 targetPage`
  - **存在** → 继续
- **不存在** → 继续

### 步骤 4：读取项目配置

读取 `.sketch-cache/proj-init.md`，获取 `views_path`、`components_path` 和 UI 组件库信息

### 步骤 5：遍历检查每个组件

对每个 `split-done` 组件执行以下检查：

#### 5a. 检查路径结构

按类型检查路径：

| 组件类型                      | 路径格式                                                                      | 示例                                                      |
| ----------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| 页面入口                      | `{views_path}/{pageFolder}/{PageName}.{vue/tsx/other}`                        | `src/views/loginPage/LoginPage.{vue/tsx/other}`           |
| 页面私有组件 / section 子组件 | `{views_path}/{pageFolder}/{componentFolder}/{ComponentName}.{vue/tsx/other}` | `src/views/loginPage/loginForm/LoginForm.{vue/tsx/other}` |
| section 父组件                | `{views_path}/{targetPage}/{componentFolder}/{ComponentName}.{vue/tsx/other}` | `src/views/userProfile/infoCard/InfoCard.{vue/tsx/other}` |
| 公共组件                      | `{components_path}/{componentFolder}/{ComponentName}.{vue/tsx/other}`         | `src/components/modalDialog/ModalDialog.{vue/tsx/other}`  |

#### 5b. 检查命名规范

1. **文件夹名**：camelCase（两个单词以上，首字母小写）
   - 错误：`Loginpage`、`login_page`、`Login`
2. **组件文件名**：PascalCase（两个单词以上，首字母大写）
   - 错误：`loginPage.vue`、`login_page.vue`、`Login.vue`

#### 5c. 检查父子层级关系

- 页面入口（`type: page`）必须位于 `{views_path}/{pageFolder}/` 下
- 页面私有组件（`type: page-specific`）必须位于其父组件的文件夹内
- section 父组件（`type: section`）必须位于 `{views_path}/{targetPage}/` 下
  - 若状态文件中 `targetPage` 缺失，跳过此校验（步骤 3 已做全局拦截）
- section 子组件（`type: page-specific`，父组件为 section）必须位于其父 section 组件的文件夹内
- 公共组件（`type: common`）必须位于 `{components_path}/` 下

#### 5d. 拆分合理性校验

**基础元素误拆检查**：基础 UI 元素（按钮、输入框、图标、选择器等）不应被拆为独立组件，应直接使用项目 UI 组件库。若存在此类拆分，标记为违规。

**公共组件合理性检查**：对所有 `type: common` 的组件，依据经验判断其跨页面复用的可能性。以下情况**不应**标记为公共组件：

- 组件名称包含当前页面特有业务语义（如 `LoginForm`、`OrderHeader`）

以下情况可以放行：

- 通用弹窗、卡片、列表项、导航栏、页面布局容器等结构性组件
- 命名无页面特有语义，结构通用
- 无法确认但疑似可复用的，先放行

### 步骤 6：汇总结果

将所有组件的检查结果汇总，输出每个组件的通过/失败状态

## 输出格式

全部通过：

```
全部组件拆分审核通过，共 {n} 个组件
SPLIT_CHECK_SUCCESS
RECORD_STATE: components[{componentPath}].status = split-check-done（仅通过的组件）
```

存在失败：

```
组件拆分审核结果（共 {total} 个，{passCount} 个通过，{failCount} 个失败）：

通过：
- {component_path_1}
- {component_path_2}

失败：
- 组件路径：{component_path}
  问题类型：{路径错误 | 命名错误 | 层级错误 | 基础元素误拆 | 公共组件误判}
  问题描述：{具体问题}
  修复建议：{建议如何修复}
（逐个列出所有失败组件）
SPLIT_CHECK_FAILED
RECORD_STATE: 仅记录通过的组件为 split-check-done，失败组件保持 split-done
```
