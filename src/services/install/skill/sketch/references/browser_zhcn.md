## 调用方式

以下所有命令两种写法等价，按安装情况选择：

```bash
playwright-cli <命令>          # 全局安装：npm install -g @playwright/cli@latest
npx -y @playwright/cli <命令>  # 免安装直接用（npx）
```

纯命令行驱动浏览器，无需配置 MCP、无需重启会话。

本页只收录本项目常用命令；需要更多能力时，任何命令加 `--help` 查看完整参数，不带命令的 `playwright-cli --help` 列出全部命令。

私有 npm 仓库（镜像）同步滞后时，`@latest` 可能拉取失败而旧版本可用；且镜像里存在的版本也可能装不上——依赖包同样滞后，包同步齐不代表依赖树同步齐。先执行 `npm view @playwright/cli versions --json` 查看仓库里实际有哪些版本，从最新的一个开始用 `npx -y @playwright/cli@<version> --version` 探测，失败（依赖解析 404）就依次降版重试——版本越旧依赖树越老，被同步齐的概率越高。

## 打开浏览器访问本地服务

```bash
playwright-cli open "{url}"
```

- 默认用自带 chromium（需先执行一次 `playwright-cli install` 安装浏览器二进制）
- 指定系统浏览器通道可免装：`playwright-cli open "{url}" --browser=msedge`（或 `chrome`）

## 按设计稿尺寸调整视口

```bash
playwright-cli resize 1920 1080
```

## 定位当前绘制的部分

- 路由直达：`playwright-cli goto "{url}"`
- 按可见文案查找：`playwright-cli find "登录"`（支持正则：`find --regex "/login|signin/i"`）
- 先 `playwright-cli snapshot` 拿元素 ref 再交互：`playwright-cli click "e15"`；也支持 css 选择器与 role 定位：`playwright-cli click ".submit-btn"`
- 需要时在页面里执行 JS：`playwright-cli eval "document.title"`

## 截图

```bash
# 整页截图（覆盖滚动线以下内容；有懒加载先滚动一遍触发加载）
playwright-cli screenshot --full-page --filename=".sketch-cache/{design}/{page}/{artboard}/screenshot/{timestamp}.png"

# 元素截图（组件级比对用，选择器必须在页面内唯一）
playwright-cli screenshot ".user-table" --filename=".sketch-cache/{design}/{page}/{artboard}/screenshot/{timestamp}.png"
```

## 复用登录状态

- 接管装了 Playwright 插件的浏览器（登录态与 Cookie 原样可用）：`playwright-cli attach --extension=chrome`
- 持久化配置目录（登录一次后保持）：`playwright-cli open "{url}" --persistent`
- 存储态文件：`playwright-cli state-save "auth.json"` 保存，之后 `playwright-cli state-load "auth.json"` 恢复

## 会话说明

- 各命令共享同一个常驻浏览器会话，不必每条命令重开
- headless 会话空闲 1 小时自动关闭，重新 `open` 即可；有头与 attach 的浏览器常驻
- 收尾或异常时：`playwright-cli close`（关闭）、`playwright-cli list`（查看）、`playwright-cli kill-all`（强制清理）

## Windows 注意

cmd / PowerShell 中 URL 含 `&` 会被当作命令分隔符截断：cmd 用 `^&` 转义，PowerShell 在命令前加 `--%`；本地服务 URL 通常无查询串，一般不受影响
