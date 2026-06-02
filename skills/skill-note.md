# 本项目技能介绍

## skill: sketch-workflow

- 作为主技能调用子技能`skecth-init`、`sketch-split`、`sketch-draw`完成绘制任务
- 只负责调度子技能，传递参数，绝不编码
- 必须严格按照`sketch-workflow`定义的流程执行任务
- 各子技能都有`工作流模式`和`独立运行模式`，`sketch-workflow`主技能只调用各子技能的`工作流模式`

## skill: skecth-init

- 调用`npx -y mcp-sketch list [options]`命令提取 Sketch 导出文件（zip 或目录）中的所有画板（名称、预览图），通过多模态模型读取预览图，智能规划路由结构
- 只负责规划路由，编写路由配置文件，新建空白入口组件，绝不编写组件具体实现代码

## skill: sketch-split

- 调用`npx -y mcp-sketch plan [options]`命令提取画板基本信息和预览图，合理拆分为待开发组件，并创建相应的空白组件和描述文档
- 只负责拆分组件，不负责组件具体实现代码

## skill: sketch-draw

- 调用`npx -y mcp-sketch analyze [options]`命令提取出有效图层、切图和预览图，根据描述文档实现组件的具体功能
- 真正负责编写单个组件的具体实现代码

# 遇到过的问题

## 1、本技能不是针对vue组件的，而是面向通用组件的

- 技能中的示例组件需要改成伪代码，摆脱vue组件的限制

## 2、组件拆分距离期望值相差较大，需要调整

- 例如：左侧菜单栏，顶部导航栏等应该作为项目通用类组件提取出来

## 3、需要在工作流中合适的位置校验代码质量

- 例如：根据项目实际情况，调用eslint、tsc、prettier等工具，检查代码质量

## 4、需要在工作流中，明确`skecth-init`、`sketch-split`、`sketch-draw`是技能，否则，ai可能误判为命令工具调用

- 例如：调用`skill: skecth-init`

## 5、画板枚举与用户选择这个步骤放置位置是否合理？

- 是不是应该放技能`skecth-init`中

## 6、画板枚举与用户选择是否有更友好的交互方式？

- 是否可以交由ai根据实际情况选择以什么形式让用户多选画板？比如在claude-code，trae这些工具里，应该有更友好的交互方式

## 7、本技能的工作流以todo列表的形式展示是否更好？

- todo列表展示也要注意执行顺序的问题

## 8、`sketch-draw`技能调用analyze命令时，切图存放位置需要指定

- 指定在 src/assets目录下与组件相对应的目录结构

## 9、考虑到eslint可能会校验组件命名是否符合规范，在创建组件时，采用PascalCase命名法，每个组件名至少由两个单词组成
