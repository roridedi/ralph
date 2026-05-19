import { readFile } from 'node:fs/promises'
import { ParsedProgressSchema, type MonitorSettings, type ParsedProgress, type ProgressEntry } from '../../shared/schema.js'

const THREAD_URL_REGEX = /https:\/\/ampcode\.com\/threads\/[^\s)]+/g

const parseCodebasePatterns = (lines: string[]): string[] => {
  const start = lines.findIndex((line) => line.trim() === '## Codebase Patterns')
  if (start === -1) {
    return []
  }

  const patterns: string[] = []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.startsWith('## ')) {
      break
    }
    const match = line.match(/^[-*]\s+(.*)$/)
    if (match) {
      patterns.push(match[1].trim())
    }
  }

  return patterns
}

const parseEntry = (heading: string, entryLines: string[]): ProgressEntry => {
  const [, timestampLabel = '', storyId = ''] = heading.match(/^##\s+(.*?)\s+-\s+(.*)$/) ?? []
  const threadUrls = Array.from(new Set(entryLines.flatMap((line) => line.match(THREAD_URL_REGEX) ?? [])))

  return {
    heading,
    timestampLabel,
    storyId,
    body: entryLines.filter((line) => line.trim().length > 0 && line.trim() !== '---'),
    threadUrls,
  }
}

export const parseProgress = (content: string): ParsedProgress => {
  const lines = content.split(/\r?\n/)
  const entries: ProgressEntry[] = []
  let activeHeading: string | null = null
  let activeLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('## ') && line.trim() !== '## Codebase Patterns') {
      if (activeHeading) {
        entries.push(parseEntry(activeHeading, activeLines))
      }
      activeHeading = line.trim()
      activeLines = []
      continue
    }

    if (activeHeading) {
      activeLines.push(line)
    }
  }

  if (activeHeading) {
    entries.push(parseEntry(activeHeading, activeLines))
  }

  return ParsedProgressSchema.parse({
    exists: true,
    raw: content,
    codebasePatterns: parseCodebasePatterns(lines),
    entries,
  })
}

export const readProgress = async (settings: MonitorSettings): Promise<ParsedProgress> => {
  try {
    const content = await readFile(settings.paths.progressFile, 'utf8')
    return parseProgress(content)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return ParsedProgressSchema.parse({
        exists: false,
        raw: '',
        codebasePatterns: [],
        entries: [],
      })
    }
    throw error
  }
}
