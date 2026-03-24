/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import babelTraverse from '@babel/traverse'

type TraverseFunction = typeof import('@babel/traverse').default

/**
 * 获取安全的babel-traverse函数
 * @description 由于babel-traverse函数在不同环境下的行为不一致，这里封装一个安全的获取函数
 * @returns 安全的babel-traverse函数
 */
export function getSafeTraverse() {
  const mod = babelTraverse as any
  return (mod.default || mod) as TraverseFunction
}
