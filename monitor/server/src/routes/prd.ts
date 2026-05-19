import type { FastifyInstance } from 'fastify'
import { readPrd, writePrd } from '../prd.js'
import type { MonitorSettings, WebSocketEvent } from '../../../shared/schema.js'
import { isRateLimited } from './rate-limit.js'

type PrdRouteContext = {
  getSettings: () => MonitorSettings
  emit: (event: WebSocketEvent) => void
}

export const registerPrdRoutes = (app: FastifyInstance, context: PrdRouteContext) => {
  app.get('/api/prd', async (request, reply) => {
    if (isRateLimited(request, 'prd-read', 60, 10_000)) {
      reply.code(429)
      return { message: 'Too many requests' }
    }

    return readPrd(context.getSettings())
  })

  app.put('/api/prd', async (request, reply) => {
    try {
      const prd = await writePrd(context.getSettings(), request.body)
      context.emit({ type: 'prd:changed', prd })
      return prd
    } catch (error) {
      reply.code(400)
      return {
        message: error instanceof Error ? error.message : 'Invalid PRD payload',
      }
    }
  })
}
