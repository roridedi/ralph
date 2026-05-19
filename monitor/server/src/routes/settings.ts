import type { FastifyInstance } from 'fastify'
import { createDefaultSettings } from '../settings.js'
import type { MonitorSettings, WebSocketEvent } from '../../../shared/schema.js'

type SettingsRouteContext = {
  getSettings: () => MonitorSettings
  saveSettings: (settings: unknown) => Promise<MonitorSettings>
  emit: (event: WebSocketEvent) => void
}

export const registerSettingsRoutes = (app: FastifyInstance, context: SettingsRouteContext) => {
  app.get('/api/settings', async () => context.getSettings())

  app.put('/api/settings', async (request, reply) => {
    try {
      const settings = await context.saveSettings(request.body)
      context.emit({ type: 'settings:changed', settings })
      return settings
    } catch (error) {
      reply.code(400)
      return {
        message: error instanceof Error ? error.message : 'Invalid settings payload',
      }
    }
  })

  app.get('/api/settings/defaults', async () => createDefaultSettings(process.cwd()))
}
