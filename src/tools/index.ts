import type { RegisterToolParams } from '@/types'
import { toolSketchList } from './list'
import { toolSketchAnalyze } from './analyze'

export const tools: RegisterToolParams[] = [
  toolSketchList(),
  toolSketchAnalyze()
]
