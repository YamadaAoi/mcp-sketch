# Sketch Init Components Skill

分析项目组件生态，生成 `.sketch-cache/components-init.md`，包含 UI 组件库和项目公共组件的清单

## 核心约束

- **绝不臆测**：所有结论必须基于 `package.json` 依赖、`node_modules` 或源码分析工具查询结果
- **源码分析工具优先**：查询存量代码时优先调用源码分析工具（例如 `mcp: codegraph_explore`），不可用时回退 Grep/Read

## 执行步骤

### 步骤 1：确定 UI 组件库

读取根目录及各包的 `package.json`，检查 UI 相关依赖：

- **公开组件库**（Element Plus、Ant Design、Naive UI 等）：LLM 已大量学习过这些库，在输出中注明组件库名称和版本即可，无需逐个列举组件
- **私有/未知组件库**：调用源码分析工具（如 CodeGraph）或 Grep 扫描 `node_modules/{lib}/` 的导出入口，列出所有可用的导出组件名，每个组件附带简短的功能描述（从源码注释或命名推断）
- **确定导入方式**：检查现有组件文件的 import 语句，按需导入通常有 `import { Button } from 'xxx'` 或 `unplugin-auto-import` 配置；全部导入通常是 `import XXX from 'xxx'` 后在入口处统一注册/挂载

> 若同时检测到多个 UI 库，全部列出并标注主次关系

### 步骤 2：扫描项目公共组件

以专业前端开发的视角，判断哪些属于项目自身的可复用组件：

调用源码分析工具（如 CodeGraph）或 Grep 扫描项目目录结构，重点关注：

1. **`components_path` 目录下的所有组件**（通常约定为公共组件）
2. **`views_path` 下跨页面引用的组件**（被多个页面 import 的组件应视为公共组件）
3. **多包项目的共享包导出**（monorepo 中基础包 `packages/ui/`、`packages/shared/` 等导出的组件）
4. **HOC、布局容器、通用业务组件**（如 `PageContainer`、`AuthGuard`、`TableActions` 等）

对于每个公共组件，记录：

- 组件名称
- 文件路径
- 功能描述（从源码注释或代码逻辑推断，不超过一句话）

排除以下类型的文件：

- 页面入口组件（`views_path` 下的页面级组件，非公共复用）
- 类型定义文件（`.d.ts`）
- 工具函数文件（不包含组件渲染逻辑）

### 步骤 3：输出文档

保存至 `.sketch-cache/components-init.md`，文件夹不存在则自动创建，文件已存在则覆盖：

```markdown
# 可用组件清单 (Available Components)

## UI 组件库

- **名称**：{library name}
- **版本**：{version}
- **类型**：公开 / 私有
- **导入方式**：按需导入 / 全部导入
- **描述**：{功能简介}

> 公开组件库在绘制阶段按需调用即可。私有组件库的清单如下：

| 组件名 | 功能描述   |
| ------ | ---------- |
| {Name} | {简短描述} |

## 项目公共组件

| 组件名称 | 路径            | 功能描述     |
| -------- | --------------- | ------------ |
| {Name}   | {relative path} | {一句话描述} |
```

## 输出格式

成功：

```
项目公共组件清单已生成
INIT_COMPONENTS_SUCCESS
```

失败：

```
<错误描述>
INIT_COMPONENTS_FAILED
```
