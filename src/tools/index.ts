import type { RegisterToolParams } from '@/types'
import { toolSketchHtmlList } from './sketchHtmlList'
import { toolSketchHtmlAnalyze } from './sketchHtmlAnalyze'

export const tools: RegisterToolParams[] = [
  toolSketchHtmlList(),
  toolSketchHtmlAnalyze()
]
