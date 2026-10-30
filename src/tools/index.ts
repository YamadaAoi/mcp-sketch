import type { RegisterToolParams } from '@/types'
import { toolSketchList } from './list'
import { toolSketchAnalyze } from './analyze'
import { toolSketchDev } from './dev'

export const tools: RegisterToolParams[] = [
  toolSketchList(),
  toolSketchAnalyze(),
  toolSketchDev()
]
