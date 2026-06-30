import type { RegisterToolParams } from '@/types'
import { toolSketchList } from './list'
import { toolSketchAnalyze } from './analyze'
import { toolSketchCheckPort } from './checkPort'
import { toolSketchPreview } from './preview'
import { toolSketchScreenshot } from './screenshot'

export const tools: RegisterToolParams[] = [
  toolSketchList(),
  toolSketchAnalyze(),
  toolSketchCheckPort(),
  toolSketchPreview(),
  toolSketchScreenshot()
]
