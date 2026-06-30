# Sketch Split Check Skill

审核 `sketch-split` 的组件拆分结果：路径命名规范 + 拆分合理性

## 核心约束

- **绝不自行编写代码**：只审核和报告，不修改文件
- **禁止执行任何写入操作**

## 执行步骤

参数由调用方（Leader）传入：

- `page_name` — 页面名
- `artboard_name` — 画板名
- `split_result` — sketch-split 的完整输出结果（组件规划表）
- `preview_path` — 画板预览图路径（用于合理性判断）

### 步骤 1：读取项目配置

读取 `.sketch-cache/proj-init.md`，获取 `views_path`、`components_path` 和 UI 组件库信息

### 步骤 2：解析 split_result

从 `split_result` 中提取组件规划表，解析每个组件的：组件名称、组件路径、类型（page/common/page-specific）、rect、直接子组件

### 步骤 3：检查路径结构

按类型检查路径：

| 组件类型     | 路径格式                                                                      | 示例                                                      |
| ------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| 页面入口     | `{views_path}/{pageFolder}/{PageName}.{vue/tsx/other}`                        | `src/views/loginPage/LoginPage.{vue/tsx/other}`           |
| 页面私有组件 | `{views_path}/{pageFolder}/{componentFolder}/{ComponentName}.{vue/tsx/other}` | `src/views/loginPage/loginForm/LoginForm.{vue/tsx/other}` |
| 公共组件     | `{components_path}/{componentFolder}/{ComponentName}.{vue/tsx/other}`         | `src/components/modalDialog/ModalDialog.{vue/tsx/other}`  |

### 步骤 4：检查命名规范

1. **文件夹名**：camelCase（两个单词以上，首字母小写）
   - 错误：`Loginpage`、`login_page`、`Login`
2. **组件文件名**：PascalCase（两个单词以上，首字母大写）
   - 错误：`loginPage.vue`、`login_page.vue`、`Login.vue`

### 步骤 5：检查父子层级关系

- 页面入口（`type: page`）必须位于 `{views_path}/{pageFolder}/` 下
- 页面私有组件（`type: page-specific`）必须位于其父组件的文件夹内
- 公共组件（`type: common`）必须位于 `{components_path}/` 下

### 步骤 6：拆分合理性校验

**6a. 基础元素误拆检查**

基础 UI 元素（按钮、输入框、图标、选择器等）不应被拆为独立组件，应直接使用项目 UI 组件库。若存在此类拆分，标记为违规。

**6b. 公共组件合理性检查**

对所有 `type: common` 的组件，依据经验判断其跨页面复用的可能性。以下情况**不应**标记为公共组件：

- 组件名称包含当前页面特有业务语义（如 `LoginForm`、`OrderHeader`）

以下情况可以放行：

- 通用弹窗、卡片、列表项、导航栏、页面布局容器等结构性组件
- 命名无页面特有语义，结构通用
- 无法确认但疑似可复用的，先放行

### 步骤 7：汇总结果

将路径/命名问题和合理性问题合并输出

## 输出格式

成功：

```
组件拆分审核通过
{page_name}-{artboard_name} 共 {n} 个组件，路径规范和拆分合理性均符合要求
SPLIT_CHECK_SUCCESS
```

失败：

```
组件拆分审核失败：
- 画板：{page_name}-{artboard_name}
- 问题类型：{路径错误 | 命名错误 | 层级错误 | 描述文件缺失 | 基础元素误拆 | 公共组件误判}
- 问题描述：{具体问题，列出错误组件及原因}
- 修复建议：{建议如何修复}
SPLIT_CHECK_FAILED
```
