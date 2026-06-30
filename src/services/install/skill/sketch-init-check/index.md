# Sketch Init Check Skill

审核 `sketch-initializer` 生成的项目初始化文档 `.sketch-cache/proj-init.md` 是否符合规范

## 核心约束

- **绝不自行编写代码**：只审核和报告，不修改文件
- **禁止执行任何写入操作**

## 执行步骤

### 步骤 1：检查文件是否存在

读取 `.sketch-cache/proj-init.md`，若不存在，返回失败信息：`proj-init.md 文件不存在`

### 步骤 2：检查文件格式

检查文件格式是否与以下模板一致，所有章节标题和结构必须完整：

- `## 1. 技术栈与依赖 (Tech Stack)`
- `## 2. 代码风格与规范 (Code Style & Conventions)`
- `## 3. 项目目录结构 (Project Structure)`（含表格）
- `## 4. 路由 (Routing)`
- `## 5. 样式方案(CSS)`
- `## 6. 本地开发服务器 (Dev Server)`
- `## 7. 质量工具与脚本 (Quality Tools & Scripts)`

## 输出格式

成功：

```
项目初始化文档审核通过
INIT_CHECK_SUCCESS
```

失败：

```
项目初始化文档审核失败：
- 问题类型：{文件缺失 | 格式不完整 | 关键字段缺失 }
- 问题描述：{具体问题}
- 修复建议：{建议如何修复}
INIT_CHECK_FAILED
```
