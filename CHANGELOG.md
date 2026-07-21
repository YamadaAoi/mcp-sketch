# mcp-sketch

## 1.5.2-alpha.1

### Patch Changes

- 修复文件名过长导致写入失败的问题；state -r参数强调场景；state内路径转相对路径；subagent建议采取规则添加；code技能调整；工作流中引入上下文压缩机制

## 1.5.2-alpha.0

### Patch Changes

- 1、组件拆分调整 2、ap参数优化，不走cli传递 3、规范leader委托subagent提示词

## 1.5.1

### Patch Changes

- subagent扩展推荐动作，skill适配老项目

## 1.5.0

### Minor Changes

- 尝试兼容老项目

## 1.4.1

### Patch Changes

- 截图等待2秒；记录日志cli content格式调整为yaml，leader记录中间状态逻辑调整

## 1.4.0

### Minor Changes

- 部分cli参数调整；预览和截图优化

## 1.3.0

### Minor Changes

- 调整工作流结构，删除plan、locate工具，删除bound步骤

## 1.2.5

### Patch Changes

- 改用agent实现工作流

## 1.2.4

### Patch Changes

- 修复部分图层误排除bug；优化流水线

## 1.2.3

### Patch Changes

- locate参数调整；图层过滤规则调整

## 1.2.2

### Patch Changes

- 添加install工具

## 1.2.1

### Patch Changes

- locate 入参bug修复

## 1.2.0

### Minor Changes

- 新增locate工具；调整技能，分别在主、子agent里运行

## 1.1.5

### Patch Changes

- 过滤图层边界情况调整

## 1.1.4

### Patch Changes

- 支持读取解压后的设计稿文件夹，同时，修改save_result文件夹和预览图文件夹名称

## 1.1.3

### Patch Changes

- analyze参数优化；skill效果优化

## 1.1.2

### Patch Changes

- 添加list工具

## 1.1.1

### Patch Changes

- 修改skill

## 1.1.0

### Minor Changes

- 添加plan工具；移除参数里的page_id和artboard_id

## 1.0.12

### Patch Changes

- readme更新引导

## 1.0.11

### Patch Changes

- 更新skill和文档

## 1.0.10

### Patch Changes

- 修改返回值结构，添加适配skills

## 1.0.9

### Patch Changes

- 更新文档

## 1.0.8

### Patch Changes

- 采用sharp处理预览图片，减少tokens消耗量

## 1.0.7

### Patch Changes

- 修改cli使用方式

## 1.0.6

### Patch Changes

- 兼容cli调用模式

## 1.0.5

### Patch Changes

- 搜索引擎优化

## 1.0.4

### Patch Changes

- 移除sketch_analyze工具（待优化）；优化提示语，优化readme

## 1.0.3

### Patch Changes

- 结果文件命名扩展

## 1.0.2

### Patch Changes

- sketch_html_analyze添加解析指定区域[x, y, width, height]内要素功能

## 1.0.1

### Patch Changes

- mcp返回改为直接返回设计内容而不是文件链接
