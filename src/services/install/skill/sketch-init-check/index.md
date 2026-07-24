# Sketch Init Check Skill

审核 `sketch-init` 和 `sketch-init-components` 生成的初始化文档是否符合规范

## 核心约束

- **绝不自行编写代码**：只审核和报告，不修改文件
- **禁止执行任何写入操作**

## 执行步骤

### 步骤 1：检查 proj-init.md

读取 `.sketch-cache/proj-init.md`，若不存在，返回失败信息：`proj-init.md 文件不存在`

### 步骤 2：检查 components-init.md

读取 `.sketch-cache/components-init.md`，若不存在，返回失败信息：`components-init.md 文件不存在`

### 步骤 3：检查格式

检查 proj-init.md 的 6 个主要章节是否存在（标题不完全一致也可以，主题对就行）：

- 技术栈与依赖
- 代码风格与规范
- 项目目录结构
- 路由
- 样式方案
- 质量工具与脚本

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
- 问题描述：{具体问题，注明是 proj-init.md 还是 components-init.md}
- 修复建议：{建议如何修复}
INIT_CHECK_FAILED
```
