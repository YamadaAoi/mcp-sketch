import type { RegisterToolParams } from '@/types'
import { toolSketchAnalyze } from './sketchAnalyze'
import { toolSketchHtmlAnalyze } from './sketchHtmlAnalyze'

export const tools: RegisterToolParams[] = [
  toolSketchAnalyze(),
  toolSketchHtmlAnalyze()
]
