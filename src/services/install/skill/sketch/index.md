## 铁律

1. **禁止以任何方式解压任何压缩包**

## 固定指令

用户输入指令、以自然语言提出对应需求、或工作过程中需要时，读取并执行对应文件：

| 指令               | 读取并执行                 | 描述                       | 参数                       |
| ------------------ | -------------------------- | -------------------------- | -------------------------- |
| `/sketch init`     | `./references/init.md`     | 了解项目并检查 sketch 配置 | 无                         |
| `/sketch overview` | `./references/overview.md` | 概览设计稿内画板信息       | 设计稿（路径）             |
| `/sketch draw`     | `./references/draw.md`     | 根据设计稿绘制页面         | 设计稿与画板（路径、名称） |

## 设计稿结构

```
file_path(xx设计稿1)
└── page_name(页面名称1)
    ├── artboard_name(画板名称1)
    └── artboard_name(画板名称2)
```

## 工具调用方式

优先使用 MCP 工具（配置了 mcp-sketch MCP 服务时可用）；不可用时使用 CLI：

| 功能     | MCP 工具         | CLI                         |
| -------- | ---------------- | --------------------------- |
| 画板列表 | `sketch_list`    | `npx -y mcp-sketch list`    |
| 图层数据 | `sketch_analyze` | `npx -y mcp-sketch analyze` |
| 开发服务 | `sketch_dev`     | `npx -y mcp-sketch dev`     |
| 截图对比 | `sketch_compare` | `npx -y mcp-sketch compare` |
