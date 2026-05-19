import type { FastifyInstance } from 'fastify'
import { readProgress } from '../progress.js'
import type { MonitorSettings } from '../../../shared/schema.js'
import { createRateLimitHook } from './rate-limit.js'

export const registerProgressRoutes = (app: FastifyInstance, context: { getSettings: () => MonitorSettings }) => {
  app.get('/api/progress', { onRequest: createRateLimitHook(60, 10_000) }, async () => readProgress(context.getSettings()))
}
