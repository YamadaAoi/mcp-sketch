---
name: sketch-init
description: 本技能会提取 sketch Meaxure 设计稿 (zip/folder) 里所有画板供选择
metadata:
  author: zhouyinkui
  version: '2026.06.03'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能基于`mcp-sketch list`命令提取 Sketch Meaxure 设计稿（zip/folder）中的所有画板，由用户选择一个需要处理的画板

## 核心铁律

- **必须**经用户选择，禁止直接处理所有画板

## 执行步骤

### 步骤 1：调用 list 获取所有画板

- **重要：不要解压 zip 文件！**
- 根据用户输入或上下文推断参数
  - `-p`: Sketch 文件路径（zip或目录）
- 调用工具：`npx -y mcp-sketch list -p /path/to/sketch/export.zip`

### 步骤 2：画板枚举与用户选择

- 展示所有画板列表（pageName + artboardName）
- 根据当前工具环境选择最友好的交互方式供用户**单选**
- 等待用户选择，解析输入

## 输出格式

输出必须包含已选画板列表

```
选中画板：
- page_name: 页面名, artboard_name: 画板名
```

## 后续动作

- **工作流模式**下，**必须**等待 `skill: sketch-workflow` 调度 `skill: sketch-split` 进行画板组件拆解
- 工作流会根据返回的 `selected_artboard` 列表处理画板
