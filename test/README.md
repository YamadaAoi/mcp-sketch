# mcp-sketch 测试套件

针对 `dist/index.js`（CLI 与 MCP 双形态）的黑盒集成测试，使用仓库内真实设计稿
`src/sketch/电磁信号保密监测器html.zip` 作为唯一 fixture。每个用例都在
`test/.tmp/<套件名>/` 下的独立干净工作区里执行 CLI 子进程，互不污染。

## 运行

```bash
pnpm test            # 构建后跑全部套件（等价于 node test/run-all.mjs）
node test/run-all.mjs --no-build   # dist 已是最新时跳过构建
node test/run-all.mjs --clean      # 先清空 test/.tmp 再跑（干净起点）
node test/run-all.mjs 01-list 08-mcp  # 只跑指定套件
node test/01-list.mjs              # 单独运行一个套件
pnpm test:clean      # 清理测试工作区 test/.tmp/
node test/clean.mjs --all          # 追加清理仓库根的 CLI 运行产物（.sketch-cache/、src/assets/sketch/）
```

前置条件：

- 先完成依赖安装（`pnpm install`）；套件直接 `import 'unzipper'`、
  `import '@modelcontextprotocol/sdk/...'`（均为仓库直接依赖）
- `sharp` 为可选依赖：缺失时 04-compare 自动 SKIP，02 中 webp 扩展名断言降级

## 套件清单

| 套件         | 覆盖                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `01-list`    | 全新解析（10 画板、keyed schema、tokens、预览图落盘）、重复画板名保留、缓存命中（输出一致且不重写 list.json）、设计稿更新触发重建、损坏/遗留格式 list.json 自愈                                                                                                                      |
| `02-analyze` | 定位数组不变量（columns 声明、行宽恒 10、槽位类型、typed 空值）、类型计数（登录 5 slice/7 text/3 shape）与 `-t`、`-n` 自洽、`--limit/--offset` 分页、`-r` 区域过滤（谓词与源码一致）、`-e` 排除（整版清空/单层剔除）、全部 10 画板行宽与 extras（仅 opacity/rotation、键为行 index） |
| `03-assets`  | 切图落盘为 webp 且相对路径可寻址、重复执行幂等、跨画板内容去重（引用的唯一路径 === 磁盘文件集合）、assets-index.json 持久化（相对路径）、整体清除后自愈、索引命中但文件缺失时自愈                                                                                                    |
| `04-compare` | 同图得分 1.0 / `100.00%`、diff 图相对路径落盘、异图得分 < 1 且宽度对齐预览、缺失截图与不存在画板报错（依赖 sharp，缺失时 SKIP）                                                                                                                                                      |
| `05-folder`  | 目录输入：wrapped 布局（含 `__MACOSX` 垃圾）与 flat 布局、zip/wrapped/flat 三方画板指纹一致（size、previewPath 归一后）、内部 html 文件 mtime 触发 list.json 重建                                                                                                                    |
| `06-errors`  | 退出码 1 场景：设计稿缺失、画板不存在、rect 非法（非 JSON / 长度错）、type 枚举非法、无 index.html 的目录、伪 zip、dev 未配置 PREVIEW_URL、compare 截图缺失                                                                                                                          |
| `07-install` | esbuild 打包 `test/fixtures/install-stub.mts` 绕过交互 prompts，直调 `install(cwd, agent, SkillPool)`：claude 与 opencode 各 4 个文件、frontmatter（name/description 英文、含指令名）、正文与 references 和源码 canonical 版逐字一致、zhcn 底稿不安装、两次安装输出稳定              |
| `08-mcp`     | StdioClientTransport 真实握手（MCP_MODE=1）：4 个工具注册、sketch_list/sketch_analyze 正常返回且落盘到工作区、isError 路径（画板不存在 / PREVIEW_URL 未配置）                                                                                                                        |

## fixture 事实（断言的期望值来源）

- 页面 `新`，10 个画板；`用户管理` 同名出现 2 次（9 个唯一名）
- `登录` 画板：total = 15（5 slice / 7 text / 3 shape），宽 1920
- 切图经 sharp 压缩为 webp，写入 `src/assets/sketch/`（相对工作区）

## 维护说明

- 断言中的"期望值"若与设计相关（画板数、类型计数等）都来自上述事实；
  换 fixture 时需同步更新 `01`/`02` 中的常量
- `helpers.mjs` 提供 `cli()` / `parseJsonOutput()` / `runSuite()` 等共享设施，
  新套件按 `NN-名称.mjs` 编号接入 `run-all.mjs` 的 `ALL` 列表即可
- `test/.tmp/` 为运行时工作区，已加入 .gitignore；用 `pnpm test:clean`
  （或 `node test/clean.mjs`）清理，`--all` 追加清理仓库根的运行产物
