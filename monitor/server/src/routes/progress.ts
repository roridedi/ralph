import type { FastifyInstance } from 'fastify'
import { readProgress } from '../progress.js'
import type { MonitorSettings } from '../../../shared/schema.js'
import { isRateLimited } from './rate-limit.js'

export const registerProgressRoutes = (app: FastifyInstance, context: { getSettings: () => MonitorSettings }) => {
  app.get('/api/progress', async (request, reply) => {
    if (isRateLimited(request, 'progress-read', 60, 10_000)) {
      reply.code(429)
      return { message: 'Too many requests' }
    }

    return readProgress(context.getSettings())
  })
}
