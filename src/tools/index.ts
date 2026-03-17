import type { RegisterToolParams } from '@/types'
import { toolSketchAnalyze } from './sketchAnalyze'

export const tools: RegisterToolParams[] = [toolSketchAnalyze()]
