import { describe, it, expect, beforeAll, vi } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { handleSketchAnalyze } from '@/services/sketchAnalyze/index'
import type { InputSchema } from '@/services/sketchAnalyze/resolveArtboardTarget/index'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('handleSketchAnalyze', () => {
  const fixturesDir = path.resolve(__dirname, '../fixtures')
  const sketchFilePath = path.resolve(fixturesDir, '登录 2.sketch')

  beforeAll(async () => {
    const sketchExists = await fs
      .access(sketchFilePath)
      .then(() => true)
      .catch(() => false)
    if (!sketchExists) {
      throw new Error(
        `Test fixture not found: ${sketchFilePath}\n` +
          'Please place "登录 2.sketch" in src/tests/fixtures/'
      )
    }
  })

  it('should parse sketch file and return json file path', async () => {
    const args: InputSchema = {
      file_path: sketchFilePath
    }

    const result = await handleSketchAnalyze(args)

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.endsWith('.json')).toBe(true)
  })

  it('should parse with page_name filter', async () => {
    const args: InputSchema = {
      file_path: sketchFilePath,
      page_name: '页面 1'
    }

    const result = await handleSketchAnalyze(args)

    expect(result).toBeDefined()
    expect(result).toContain('938A76BB-E3F8-4A44-82D7-3DFA8AE122BE')
  })

  it('should parse with artboard_name filter', async () => {
    const args: InputSchema = {
      file_path: sketchFilePath,
      artboard_name: '00 _登录页'
    }

    const result = await handleSketchAnalyze(args)

    expect(result).toBeDefined()
  })

  it('should parse with node_name filter', async () => {
    const args: InputSchema = {
      file_path: sketchFilePath,
      artboard_name: '00 _登录页',
      node_name: '编组'
    }

    const result = await handleSketchAnalyze(args)

    expect(result).toBeDefined()
    expect(result).not.toContain('_all.json')
    expect(result).toMatch(/\.json$/)
  })

  it('should write correct json file', async () => {
    const args: InputSchema = {
      file_path: sketchFilePath
    }

    const result = await handleSketchAnalyze(args)

    await new Promise(resolve => setTimeout(resolve, 200))

    const jsonExists = await fs
      .access(result)
      .then(() => true)
      .catch(() => false)
    expect(jsonExists).toBe(true)

    if (jsonExists) {
      const content = await fs.readFile(result, 'utf8')
      const data = JSON.parse(content)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    }
  })

  it('should throw error for invalid page_name', async () => {
    const args: InputSchema = {
      file_path: sketchFilePath,
      page_name: 'NonExistentPage'
    }

    await expect(handleSketchAnalyze(args)).rejects.toThrow(/Sketch 解析失败/)
  })

  it('should throw error for invalid artboard_name', async () => {
    const args: InputSchema = {
      file_path: sketchFilePath,
      artboard_name: 'NonExistentArtboard'
    }

    await expect(handleSketchAnalyze(args)).rejects.toThrow(/Sketch 解析失败/)
  })
})
