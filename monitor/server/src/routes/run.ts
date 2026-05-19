import type { FastifyInstance } from 'fastify'
import { ToolSchema, type MonitorSettings, type WebSocketEvent } from '../../../shared/schema.js'
import type { RalphRunner } from '../runner.js'

type RunRouteContext = {
  getSettings: () => MonitorSettings
  runner: RalphRunner
  emit: (event: WebSocketEvent) => void
}

export const registerRunRoutes = (app: FastifyInstance, context: RunRouteContext) => {
  app.get('/api/run/status', async () => context.runner.getStatus())

  app.post('/api/run/start', async (request, reply) => {
    if (context.runner.isRunning()) {
      reply.code(409)
      return { message: 'Ralph is already running' }
    }

    const settings = context.getSettings()
    const body = (request.body ?? {}) as Record<string, unknown>
    const tool = ToolSchema.parse(body.tool ?? settings.defaultTool)
    const maxIterations = Number(body.maxIterations ?? settings.defaultMaxIterations)

    if (!Number.isInteger(maxIterations) || maxIterations <= 0) {
      reply.code(400)
      return { message: 'maxIterations must be a positive integer' }
    }

    try {
      await context.runner.start({ tool, maxIterations })
      return context.runner.getStatus()
    } catch (error) {
      reply.code(500)
      return {
        message: error instanceof Error ? error.message : 'Unable to start Ralph',
      }
    }
  })

  app.post('/api/run/stop', async (_request, reply) => {
    const stopped = context.runner.stop()
    if (!stopped) {
      reply.code(409)
      return { message: 'Ralph is not running' }
    }
    return context.runner.getStatus()
  })
}
