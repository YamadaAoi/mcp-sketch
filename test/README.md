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

| 套件               | 覆盖                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- |
| `01-list`          | 全新解析（10 画板、keyed schema、tokens、预览图落盘）、重复画板名保留、缓存命中（输出一致且不重写 list.json）、设计稿更新触发重建、损坏/遗留格式 list.json 自愈、无版本号旧缓存（border 混入 colors 等旧逻辑产物）按 v 失效重建、切图画板疑似标记（断档判定自适应：本 fixture 图标密集无离群 → 默认一个不标；list.json 记 v=3、无阈值字段；复跑命中缓存）                                                                                                                                                                                              |     |
| `02-analyze`       | 定位数组不变量（columns 声明、行宽恒 10、槽位类型、typed 空值）、类型计数（登录 5 slice/7 text/3 shape）与 `-t`、`-n` 自洽、`--limit/--offset` 分页、`-r` 区域过滤（谓词与源码一致）、`-e` 排除（整版清空/单层剔除）、全部 10 画板行宽与 extras（仅 opacity/rotation、键为行 index）与 size 口径带（size/actual ∈ [0.8, 1.05]，重名画板只校验首个）、重复折叠（用户管理 342 层 → 宿主行 + clones 守恒无损、键指向宿主 index、带文案克隆存在、分页作用于折叠后、`LAYER_DEDUP` off/0/false 三写法等价关闭、rect 与 `-t` 子集折叠同样守恒、简单页不触发） |
| `03-assets`        | 切图落盘为 webp 且相对路径可寻址、重复执行幂等、跨画板内容去重（引用的唯一路径 === 磁盘文件集合）、索引 v2 含 names 名称溯源（路径 → 原始文件名（bian-zu-7.webp ← 编组 7.png）+ 页面/画板/图层名，与全量引用精确一致，去重文件多来源）、assets-index.json 持久化（相对路径）、整体清除后自愈、索引命中但文件缺失时自愈、旧版索引（无 v/names）迁移（scopes 保留、names 重算重建）                                                                                                                                                                      |
| `04-compare`       | 纯两图比对（`-b` 基准图 + `-s` 截图）：同图得分 1.0 / `100.00%` 且回显 base 路径、diff 图落盘于基准图同目录 `compare/`（自定义目录同样跟随、同名时间戳顺延防覆盖）、异图得分 < 1 且宽度对齐基准图（窄截图放大与宽截图缩小双向）、`-r`/`-f` 已移除（传入报未知选项）、缺失（not found）与不可读（not readable，路径为目录）与非法（not an image）基准图分别报错、跨盘符基准图回显绝对路径且 diff 归档跟随（单盘环境自动跳过）（依赖 sharp，缺失时 SKIP）                                                                                                |
| `05-folder`        | 目录输入：wrapped 布局（含 `__MACOSX` 垃圾）与 flat 布局、zip/wrapped/flat 三方画板指纹一致（size、previewPath 归一后）、内部 html 文件 mtime 触发 list.json 重建                                                                                                                                                                                                                                                                                                                                                                                      |
| `06-errors`        | 退出码 1 场景：设计稿缺失、画板不存在、rect 非法（非 JSON / 长度错）、type 枚举非法、无 index.html 的目录、伪 zip、dev 未配置 PREVIEW_URL、compare 截图缺失；CLI 参数面：旧拼写 --pn/--an 别名仍可用、缺 -p/-a 报错点名新参数、--help 展示新参数与示例且不出现旧参数                                                                                                                                                                                                                                                                                   |
| `07-install`       | esbuild 打包 `test/fixtures/install-stub.mts` 绕过交互 prompts，直调 `install(cwd, agent, SkillPool)`：claude 与 opencode 各 5 个文件（含 browser.md 速查）、frontmatter（name/description 英文、含指令名）、正文与 references 和源码 canonical 版逐字一致、zhcn 底稿不安装、两次安装输出稳定                                                                                                                                                                                                                                                          |
| `08-mcp`           | StdioClientTransport 真实握手（MCP_MODE=1）：4 个工具注册、sketch_list/sketch_analyze 正常返回且落盘到工作区、sketch_compare 两图比对（同图 1.0、diff 落盘工作区、base 相对 MCP cwd 回显）、isError 路径（画板不存在 / PREVIEW_URL 未配置）                                                                                                                                                                                                                                                                                                            |
| `09-analyze-cache` | analyze 结果落盘缓存：按参数组合成文件（文件名含页面/画板/参数摘要 + hash）、命中返回与首跑逐字一致（哨兵改写缓存验证确实读盘）、缓存损坏自愈、设计稿 mtime 戳变化失效重算、不同参数与 ASSETS_PATH 各自成文件、exclude_rects 不进文件名（各变体可读段相同、hash 区分，完整键存于缓存文件的 key 字段）、引用文件（切图/预览图）缺失时绕过缓存自愈重导、LAYER_DEDUP 开/关各自成缓存（key.layer_dedup 记录开关）                                                                                                                                          |
| `10-slice-flag`    | sliceBoard 断档判定纯函数（`flagSliceOutliers`）用例矩阵（esbuild 打包 stub 直调 src，同 07 模式）：真实标注场景（0.225 断档领先被标）、图标密集自适应不标、无切图板/全切图板/单画板/两画板退化不标、多块切图板同时标中、下限防误标与中位数生效两分支、占比恰等于下限的 `>=` 边界语义                                                                                                                                                                                                                                                                  |
| `11-pinyin`        | 拼音转写纯函数（`toPinyin`）用例矩阵（esbuild 打包 stub 直调 src，同 07 模式）：ü→v（绿色 → lv-se、女 → nv、旅 → lv，默认 `toneType:'none'` 会把非 ASCII 的 ü 留进文件名造成 import 隐患）、无声调连字符拼接、ASCII 透传小写化、中英混排、纯符号回退内容哈希；不变量：输出恒为可打印 ASCII                                                                                                                                                                                                                                                             |

## fixture 事实（断言的期望值来源）

- 页面 `新`，10 个画板；`用户管理` 同名出现 2 次（9 个唯一名）
- `登录` 画板：total = 15（5 slice / 7 text / 3 shape），宽 1920，无 ≥3 重复组（不触发克隆折叠）
- `用户管理` 画板：342 层（物理），折叠后 106 宿主行 + 236 克隆（含带文案克隆）；同名出现两次且内容不同（analyze 按名取第一个）
- size 口径带实测：list.size / analyze 实际字节 ∈ 0.84–0.96（断言带 [0.8, 1.05]）
- 切图占比（视觉图层中 slice 占比）：登录 5/15≈0.33、设备管理-证书升级 23/76≈0.30、
  设备管理-设备升级 23/82≈0.28、设备管理-重启/重置 22/79≈0.28、其余 0.16+——
  全员 0.16–0.36 的图标密集分布，无离群画板，断档线（中位数×3）高于全部占比 →
  sliceBoard 一个不标（正向标中路径由 `10-slice-flag` 纯函数矩阵覆盖）
- 切图经 sharp 压缩为 webp，写入 `src/assets/sketch/`（相对工作区）

## 维护说明

- 断言中的"期望值"若与设计相关（画板数、类型计数等）都来自上述事实；
  换 fixture 时需同步更新 `01`/`02` 中的常量
- dev 的"PREVIEW_URL 可达 → already running"快速路径不做自动化：部分开发机的
  系统代理/TUN 会拦截子进程发起的回环 HTTP（TCP 可连但请求永不达），测试会
  挂起 60s 并误派生 PowerShell 窗口；该路径逻辑极简，依赖人工验证
- `helpers.mjs` 提供 `cli()` / `parseJsonOutput()` / `runSuite()` 等共享设施，
  新套件按 `NN-名称.mjs` 编号接入 `run-all.mjs` 的 `ALL` 列表即可
- `test/.tmp/` 为运行时工作区，已加入 .gitignore；用 `pnpm test:clean`
  （或 `node test/clean.mjs`）清理，`--all` 追加清理仓库根的运行产物
