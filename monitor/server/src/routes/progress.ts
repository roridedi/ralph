import type { FastifyInstance } from 'fastify'
import { readProgress } from '../progress.js'
import type { MonitorSettings } from '../../../shared/schema.js'

export const registerProgressRoutes = (app: FastifyInstance, context: { getSettings: () => MonitorSettings }) => {
  app.get('/api/progress', async () => readProgress(context.getSettings()))
}
