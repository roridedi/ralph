import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import { listArchiveDirectories } from '../git.js'
import { parseProgress } from '../progress.js'
import { PrdSchema, ParsedProgressSchema, type ArchiveSummary, type MonitorSettings } from '../../../shared/schema.js'
import { createRateLimitHook } from './rate-limit.js'

const readArchiveSummary = async (settings: MonitorSettings, name: string): Promise<ArchiveSummary> => {
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    throw new Error('Invalid archive name')
  }

  const archiveRoot = resolve(settings.paths.repoRoot, 'archive')
  const archivePath = resolve(archiveRoot, name)
  if (!archivePath.startsWith(`${archiveRoot}/`) && archivePath !== archiveRoot) {
    throw new Error('Invalid archive path')
  }
  let prd = null
  let progress = ParsedProgressSchema.parse({ exists: false, raw: '', codebasePatterns: [], entries: [] })

  try {
    const prdContent = await readFile(resolve(archivePath, 'prd.json'), 'utf8')
    prd = PrdSchema.parse(JSON.parse(prdContent))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  try {
    const progressContent = await readFile(resolve(archivePath, 'progress.txt'), 'utf8')
    progress = parseProgress(progressContent)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  return {
    name,
    path: archivePath,
    passCount: prd?.userStories.filter((story) => story.passes).length ?? 0,
    totalStories: prd?.userStories.length ?? 0,
    iterationCount: progress.entries.length,
    prd,
    progress,
  }
}

export const registerArchiveRoutes = (app: FastifyInstance, context: { getSettings: () => MonitorSettings }) => {
  app.get('/api/archive', { onRequest: createRateLimitHook(30, 10_000) }, async () => {
    const names = await listArchiveDirectories(context.getSettings())
    return Promise.all(names.map((name) => readArchiveSummary(context.getSettings(), name)))
  })

  app.get('/api/archive/:name', { onRequest: createRateLimitHook(30, 10_000) }, async (request, reply) => {
    try {
      const name = (request.params as { name: string }).name
      return await readArchiveSummary(context.getSettings(), name)
    } catch (error) {
      reply.code(400)
      return {
        message: error instanceof Error ? error.message : 'Unable to read archive',
      }
    }
  })
}
