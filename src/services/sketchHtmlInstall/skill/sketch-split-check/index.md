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

读取 `sketch-cache/proj-init.md`，获取 `views_path`、`components_path` 和 UI 组件库信息

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

**6a. 粒度过细检查**

对每个组件，读取其 `rect` 的宽高面积。若面积小于画板总面积的 3%，标记为疑似过细拆分。若该组件是基础 UI 元素（按钮、输入框、图标等），必须标记为违规——基础 UI 元素应直接使用 UI 组件库，禁止拆为独立文件

**6b. 公共组件合理性检查**

对所有 `type: common` 的组件，依据经验判断其跨页面复用的可能性。以下情况**不应**标记为公共组件：

- 组件名称包含当前页面特有业务语义（如 `LoginForm`、`OrderHeader`）

以下情况可以放行：

- 通用弹窗、卡片、列表项、导航栏、页面布局容器等结构性组件
- 命名无页面特有语义，结构通用
- 无法确认但疑似可复用的，先放行

**6c. 装饰元素误拆检查**

读取预览图，对比组件列表。若存在以下情况则标记为违规：

- 纯背景色/背景图被拆为独立组件
- 分割线、装饰性图标被拆为独立组件
- 不承载任何交互或业务逻辑的视觉元素被拆为独立组件

**6d. 逻辑聚合检查**

若多个基础 UI 元素（Input、Button、Select 等）被分别拆为独立组件，但它们在视觉上被同一个容器包裹且共同服务于一个业务功能（如登录表单），则应聚合为一个页面特有组件，而非多个独立组件

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
- 问题类型：{路径错误 | 命名错误 | 层级错误 | 描述文件缺失 | 粒度过细 | 公共组件误判 | 装饰元素误拆 | 逻辑聚合缺失}
- 问题描述：{具体问题，列出错误组件及原因}
- 修复建议：{建议如何修复}
SPLIT_CHECK_FAILED
```
