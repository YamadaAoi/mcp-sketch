import type { RegisterToolParams } from '@/types'
import { toolSketchHtmlPlan } from './sketchHtmlPlan'
import { toolSketchHtmlAnalyze } from './sketchHtmlAnalyze'

export const tools: RegisterToolParams[] = [
  toolSketchHtmlPlan(),
  toolSketchHtmlAnalyze()
]
