## 铁律

- **绝不臆测项目技术栈**：必须基于 `package.json` 的依赖进行判断
- **绝不臆测项目代码风格**：必须基于配置文件（.prettierrc, .eslintrc 等）和现有代码进行判断
- **绝不臆测项目结构**：必须基于现有文件目录进行判断
- **绝不读取无关文件**：例如zip、rar等与项目代码无关的文件，不尝试解压或读取

## 1、确定技术栈

读取根目录及各包的 `package.json`，分析 `dependencies` 和 `devDependencies`：

- **基础框架**：React / Vue / Angular 等
- **核心库**：
  - 状态管理（Redux / Pinia 等）
  - 网络请求（Axios / Fetch 等）
- **构建工具**：Vite / Rollup 等
- **TypeScript 版本**

读取根目录及各包的 `package.json`，检查 UI 相关依赖：

- **公开组件库**（Element Plus、Ant Design、Naive UI 等）：LLM 已大量学习过这些库，在输出中注明组件库名称和版本即可，无需逐个列举组件
- **私有/未知组件库**：扫描 `node_modules/{lib}/` 的入口，了解可用组件
- **确定导入方式**：检查现有组件文件的 import 语句，按需导入通常有 `import { Button } from 'xxx'` 或 `unplugin-auto-import` 配置；全部导入通常是 `import XXX from 'xxx'` 后在入口处统一注册/挂载

## 2、确定代码风格与规范

- 读取 `.prettierrc`, `.editorconfig` 等配置，总结缩进、引号、分号规则
- 读取 `eslint.config.*`, `tsconfig.json`, `stylelint.config` 等，总结命名限制、严格模式等
- 确定组件命名规范，如果项目内组件命名不统一，则优先使用 **PascalCase**，至少**两个单词**
- 确定组件编写规范
  - vue：确定`template`、`script`、`style` 等标签顺序，是否使用`setup`语法糖
  - react：是否使用函数组件、类组件、hooks 等
  - angular：是否使用类组件、装饰器等
  - 其他框架：根据实际情况判断组件编写规范

## 3、将重要信息汇总到`AGENTS.md`文件中

## 4、检查 `.env.sketch` 配置

检查项目根目录是否存在 `.env.sketch`（mcp-sketch 的配置文件，可选）：

- **已存在**：读取内容，确认 `SERVER_COMMAND` 等关键变量与项目实际情况相符（如能在 `package.json` 的 `scripts` 中找到对应命令），不符时向用户指出
- **不存在**：结合项目情况（包管理器、`scripts` 中的启动命令、开发服务地址、切图输出目录约定）给出建议配置，**先询问用户是否允许创建，同意后再写入**，不要擅自创建文件

可配置变量：

| 变量              | 必填 | 默认值              | 说明                                                |
| ----------------- | ---- | ------------------- | --------------------------------------------------- |
| `SERVER_COMMAND`  | 否   | `npm run dev`       | dev 服务启动命令                                    |
| `PREVIEW_URL`     | 否   | -                   | dev 服务地址，使用 `dev` 工具（启动开发服务）时必填 |
| `CWD`             | 否   | 当前目录            | 项目根目录                                          |
| `ASSETS_PATH`     | 否   | `src/assets/sketch` | 切图输出路径                                        |
| `DESIGN_MEMO_MAX` | 否   | `8`                 | 设计稿解析进程内缓存上限                            |
| `LOG_LEVEL`       | 否   | `info`              | 日志级别                                            |

## 5、检查浏览器自动化 MCP 配置

检查当前 AI 客户端的项目级 MCP 配置中是否已有浏览器自动化 MCP（如 Playwright，截图对比流程依赖它探索渲染结果并截图）：

- **已配置**：跳过
- **未配置**：向用户说明用途，**询问是否允许代为添加配置，同意后按当前 AI 客户端的方式自行配置**
- 配置完成后通常需要重启会话生效，提醒用户
