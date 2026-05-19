import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify'

const buckets = new Map<string, { count: number; resetAt: number }>()

export const createRateLimitHook = (maxRequests: number, windowMs: number) => (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  const now = Date.now()
  const key = request.ip || 'local'
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    done()
    return
  }

  if (current.count >= maxRequests) {
    reply.code(429).send({ message: 'Too many requests' })
    return
  }

  current.count += 1
  buckets.set(key, current)
  done()
}
