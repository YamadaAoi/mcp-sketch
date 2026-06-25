import type { RegisterToolParams } from '@/types'
import { toolSketchHtmlList } from './sketchHtmlList'
import { toolSketchHtmlPlan } from './sketchHtmlPlan'
import { toolSketchHtmlAnalyze } from './sketchHtmlAnalyze'

export const tools: RegisterToolParams[] = [
  toolSketchHtmlList(),
  toolSketchHtmlPlan(),
  toolSketchHtmlAnalyze()
]
