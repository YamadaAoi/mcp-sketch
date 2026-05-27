---
name: sketch-workflow
description: 全自动 Sketch 代码生成工作流。它会智能编排 init、split、draw 三个技能，实现“一键生成项目”的终极体验。
metadata:
  author: zhouyinkui
  version: '2026.05.27'
  source: scripts located at https://github.com/YamadaAoi/mcp-sketch
---

此技能是 Sketch 自动化体系的“总指挥”。它利用状态追踪技术，将 init（规划）、split（拆解）、draw（绘制）串联成一条无缝流水线。

## 核心逻辑架构

1. **全局规划阶段**：调用 sketch-init，构建项目骨架。
2. **分页拆解阶段**：逐个处理页面，调用 sketch-split 进行组件原子化。
3. **批量绘制阶段**：针对每个原子组件，调用 sketch-draw 进行代码落地。
4. **质量门禁**：每完成一个页面，进行一次完整性校验。

## 交互协议

### 输入

- `file_path`: Sketch 导出 zip 的路径。
- `assets_path`: (可选) 切图存放的根目录，默认为 `src/assets/sketch`。

### 输出

- 最终交付报告（含统计信息）。

## 智能编排步骤

### 阶段 0：环境预检与模式声明

- **关键操作**：向所有子技能注入上下文 `{"execution_mode": "automated", "parent_workflow": true}`。这一步是确保子技能不询问用户的“魔法钥匙”。

### 阶段 1：项目初始化 (Call sketch-init)

- **动作**：调用 `sketch-init`，传入 `file_path`。
- **智能判断**：
  - 若画板数量 == 0：报错“未在 zip 中找到有效画板”。
  - 若画板数量 > 0：获取路由规划结果。**注意：在此模式下，sketch-init 必须跳过用户确认，直接创建文件。**

### 阶段 2：页面级循环 (For each Page)

- **动作**：遍历 `sketch-init` 产出的每一个主页面。
- **进度同步**：输出日志“🚀 开始处理页面：[页面名]”。
- **异常熔断**：如果页面处理超时或报错，记录错误日志，询问用户“是否跳过当前页面继续，还是终止流程？”。若用户无响应，默认跳过。

#### 阶段 2.1：组件拆解 (Call sketch-split)

- **动作**：针对当前主页面，调用 `sketch-split`。
- **参数透传**：`file_path`, `page_name`, `artboard_name`。
- **静默执行**：由于注入了“自动化模式”，`sketch-split` 应直接输出组件规划表并创建描述文档，**严禁**询问“您看这样拆分行吗？”。
- **数据提取**：从 `sketch-split` 的结果中提取所有组件的 `rect` 坐标数组。

#### 阶段 2.2：组件绘制循环 (For each Component in Page)

- **动作**：遍历当前页面的所有组件。
- **调用**：执行 `sketch-draw`。
- **参数构建**：使用提取出的 `rect` 坐标，指定 `assets_path`。
- **状态反馈**：实时输出“🔨 正在绘制组件：[组件名]...”。

### 阶段 3：收尾与交付

- **统计**：汇总生成的页面数、组件数、切图数。
- **最终提示**：告诉用户“全流程结束！请在本地启动项目预览效果。”
