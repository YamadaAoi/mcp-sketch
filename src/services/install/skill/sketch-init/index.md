# Sketch Init Skill

分析项目代码，生成 `.sketch-cache/proj-init.md` 供后续阶段使用

## 核心约束

- **绝不臆测项目技术栈**：必须基于 `package.json` 的依赖进行判断
- **绝不臆测项目代码风格**：必须基于配置文件（.prettierrc, .eslintrc 等）和现有代码进行判断
- **绝不臆测项目结构**：必须基于现有文件目录进行判断
- **绝不读取无关文件**：例如zip、rard等与项目代码无关的文件，不尝试解压或读取

## 执行步骤

以下步骤中的 `requirements`（可选）由调用方传入上下文

### 步骤 1：检查 `.sketch-cache/proj-init.md` 是否存在

- 若存在且未传入 `requirements`，直接跳过，不重复执行
- 若存在且传入 `requirements`，则根据 `requirements` 中的问题描述修复 proj-init.md 中的对应字段

### 步骤 2：确定技术栈与依赖

读取根目录及各包的 `package.json`，分析 `dependencies` 和 `devDependencies`：

- **基础框架**：React / Vue / Angular 等
- **核心库**：
  - UI库（Ant Design / Element Plus / TailwindCSS 等），确定组件导入方式（按需导入 / 全部导入）
  - 状态管理（Redux / Pinia 等）
  - 网络请求（Axios / Fetch 等）
- **构建工具**：Vite / Rollup 等
- **TypeScript 版本**

### 步骤 3：确定代码风格与规范

- 读取 `.prettierrc`, `.editorconfig` 等配置，总结缩进、引号、分号规则
- 读取 `eslint.config.*`, `tsconfig.json`, `stylelint.config` 等，总结命名限制、严格模式等
- 确定组件命名规范，如果项目内组件命名不统一，则优先使用 **PascalCase**，至少**两个单词**
- 确定组件编写规范
  - vue：确定`template`、`script`、`style` 等标签顺序，是否使用`setup`语法糖
  - react：是否使用函数组件、类组件、hooks 等
  - angular：是否使用类组件、装饰器等
  - 其他框架：根据实际情况判断组件编写规范

### 步骤 4：确定项目结构

- 分析 `src` 目录结构
  - 确定 API 目录，若不存在，则使用 `src/api/`
  - 确定 Assets 目录，若不存在，则使用 `src/assets/`
  - 确定公共组件目录
    - 若存在，记录为 `components_path`
    - 若不存在，使用 `src/components` 作为 `components_path`
  - 确定入口页面组件目录
    - 若存在，记录为 `views_path`
    - 若不存在，使用 `src/views` 作为 `views_path`
  - 确定业务组件目录（在 `views_path` 下，按页面分文件夹）

### 步骤 5：确定路由配置方式

- 查找路由配置文件（如 `router/index.ts` 或 `app/routes.ts`），总结路由定义方式（动态导入 / 静态配置）
- 确定路由模式（如 `hash`、`history` 等）

### 步骤 6：确定 CSS 方案

- 读取现有组件文件，判断 CSS 方案类型（CSS Modules / TailwindCSS / styled-components / Scoped CSS 等）

### 步骤 7：确定质量工具配置

- 查看`package.json` 中 `scripts` 字段，判断包管理工具（如 npm、yarn、pnpm 等），包管理工具一般是全局安装的
- 检查 `.prettierrc*` 及 `package.json` 中 prettier 脚本，记录格式化命令
- 检查 `eslint.config.*` 及 `package.json` 中 lint 脚本，记录检查命令
- 检查 `tsconfig.json` 及 `package.json` 中 typecheck 脚本，记录类型检查命令

### 步骤 8：输出文档

保存至 `.sketch-cache/proj-init.md`，文件夹不存在则自动创建，文件已存在则覆盖，文档格式如下：

```markdown
# 项目初始化配置 (Project Initialization)

> ️ **注意**：本文档由架构师 Agent 自动扫描生成，所有结论均基于项目现有配置文件与源码，严禁臆测。

## 1. 技术栈与依赖 (Tech Stack)

- **基础框架**:
- **核心语言**:
- **UI 组件库**:
  - **导入方式**:
- **状态管理**:
- **网络请求**:
- **构建工具**:

## 2. 代码风格与规范 (Code Style & Conventions)

### 格式化规则

- **缩进**:
- **引号**:
- **分号**:
- **尾随逗号**:

### 编码规范

- **ESLint 规则集**:
- **严格模式**:
- **组件命名**:
- **组件编写范式**:
  - [Vue/React/Angular 等]:

## 3. 项目目录结构 (Project Structure)

| 模块类型 | 约定路径 | 命名规范 | 备注 |
| -------- | -------- | -------- | ---- |
| 公共组件 |          |          |      |
| 入口页面 |          |          |      |
| 业务组件 |          |          |      |
| API 接口 |          |          |      |
| 静态资源 |          |          |      |

### 路径规范

拆分阶段严格按以下规则生成组件路径：

- **页面入口**：`{views_path}/{pageName}/{PageName}.{extension}`
  - 例：`src/views/loginPage/LoginPage.vue`
  - 例：`src/views/loginPage/LoginPage.tsx`
- **页面私有组件**：`{views_path}/{pageName}/{componentName}/{ComponentName}.{extension}`
  - 例：`src/views/loginPage/loginForm/LoginForm.vue`
  - 例：`src/views/loginPage/loginForm/LoginForm.tsx`
- **公共组件**：`{components_path}/{componentName}/{ComponentName}.{extension}`
  - 例：`src/components/modalDialog/ModalDialog.vue`
  - 例：`src/components/modalDialog/ModalDialog.tsx`
- **描述文件**：与组件同名，扩展名为 `.md`
  - 例：`LoginPage.md`、`LoginForm.md`

命名规则：

| 元素     | 格式       | 示例                              |
| -------- | ---------- | --------------------------------- |
| 文件夹名 | camelCase  | `loginPage`                       |
| 组件文件 | PascalCase | `LoginPage.vue`、 `LoginPage.tsx` |
| 描述文件 | PascalCase | `LoginPage.md`                    |
| CSS 类名 | kebab-case | `login-page`                      |

## 4. 路由 (Routing)

- **路由配置方式**:
- **路由模式**:
- **路由文件位置**:

## 5. 样式方案(CSS)

- **CSS 解决方案**:

## 6. 质量工具与脚本 (Quality Tools & Scripts)

- **包管理器**:
- **代码格式化命令**: 没有则去除此项
- **代码检查命令**: 没有则去除此项
- **类型检查命令**: 没有则去除此项
```

## 输出格式

成功：

```
项目初始化文档已生成
INIT_SUCCESS
```

失败：

```
<错误描述>
INIT_FAILED
```
