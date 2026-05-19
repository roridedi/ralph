import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { PrdSchema, type MonitorSettings, type Prd, type UserStory } from '../../shared/schema.js'

const normalizeStories = (stories: UserStory[]): UserStory[] =>
  [...stories]
    .sort((left, right) => left.priority - right.priority)
    .map((story, index) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      acceptanceCriteria: [...story.acceptanceCriteria],
      priority: index + 1,
      passes: story.passes,
      notes: story.notes,
    }))

const serializePrd = (prd: Prd) => {
  const normalized: Prd = {
    project: prd.project,
    branchName: prd.branchName,
    description: prd.description,
    userStories: normalizeStories(prd.userStories),
  }
  return `${JSON.stringify(normalized, null, 2)}\n`
}

export const readPrd = async (settings: MonitorSettings): Promise<Prd | null> => {
  try {
    const content = await readFile(settings.paths.prdFile, 'utf8')
    return PrdSchema.parse(JSON.parse(content))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

export const writePrd = async (settings: MonitorSettings, prd: unknown): Promise<Prd> => {
  const normalized = PrdSchema.parse(prd)
  await mkdir(dirname(settings.paths.prdFile), { recursive: true })
  const tempFile = `${settings.paths.prdFile}.tmp`
  await writeFile(tempFile, serializePrd(normalized), 'utf8')
  await rename(tempFile, settings.paths.prdFile)
  return PrdSchema.parse(JSON.parse(serializePrd(normalized)))
}
