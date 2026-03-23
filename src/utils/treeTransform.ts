/**
 * 栈元素定义：
 * originalNode: 原始节点
 * newNode: 已经创建好的新节点（部分填充，children 待定）
 * parentChildrenArray: 指向新节点应该被放入的父级 children 数组
 */
interface StackItem<T, R> {
  originalNode: T
  newNode: R
  parentChildrenArray: R[]
}

/**
 * 树结构转换函数
 * @param tree - 原始树结构数组
 * @param transform - 节点转换函数，接收原始节点、索引和路径，返回新节点
 * @param getTChildren - 获取原始节点子节点的函数
 * @param getRChildren - 获取新节点子节点的函数
 * @returns 转换后的树结构数组
 */
export function treeTransform<T, R>(
  tree: T[],
  transform: (node: T) => R | undefined,
  getTChildren: (node: T) => T[] | undefined,
  getRChildren: (node: R) => R[]
): R[] {
  if (!tree || tree.length === 0) return []

  const result: R[] = []
  const stack: StackItem<T, R>[] = []
  const tempRoots: R[] = []

  for (let i = tree.length - 1; i >= 0; i--) {
    const originalNode = tree[i]
    const newNode = transform(originalNode)
    if (!newNode) continue
    stack.push({
      originalNode,
      newNode,
      parentChildrenArray: result
    })

    tempRoots.push(newNode)
  }

  tempRoots.reverse()
  result.push(...tempRoots)

  while (stack.length > 0) {
    const { originalNode, newNode } = stack.pop()!
    const originalChildren = getTChildren(originalNode)

    if (originalChildren && originalChildren.length > 0) {
      const tempChildren: R[] = []
      const newChildrenArray = getRChildren(newNode)

      for (let i = originalChildren.length - 1; i >= 0; i--) {
        const childNode = originalChildren[i]
        const newChildNode = transform(childNode)
        if (!newChildNode) continue

        stack.push({
          originalNode: childNode,
          newNode: newChildNode,
          parentChildrenArray: newChildrenArray
        })

        tempChildren.push(newChildNode)
      }

      tempChildren.reverse()
      newChildrenArray.push(...tempChildren)
    }
  }

  return result
}
