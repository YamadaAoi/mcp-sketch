/**
 * 解析并锁定目标 Artboard (页面)
 * 1. 首先尝试轻量级读取 document.json 获取所有 pages 和 artboards 的元数据，避免加载整个大文件。
 * 2. 优先级逻辑：ID > Name > 历史会话记录 > 返回候选列表。
 * 3. 如果名称模糊匹配到多个结果 (如 "Home" 匹配到 "Home Page" 和 "Home Mobile")，必须返回 candidates 列表让 AI 让用户选择，严禁自动猜测。
 * 4. 如果找到历史会话 (.mcp_state.json) 且用户未指定新目标，默认复用历史会话锁定的 Artboard ID。
 * @param file_path - Sketch 文件的绝对路径
 * @param artboard_id - (可选) 用户指定的 Artboard UUID
 * @param artboard_name - (可选) 用户指定的 Artboard 名称 (支持模糊匹配)
 */
export function resolveArtboardTarget(
  file_path: string,
  artboard_id?: string,
  artboard_name?: string
) {
  console.log('resolveArtboardTarget', file_path, artboard_id, artboard_name)
}
