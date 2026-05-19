import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify'

const buckets = new Map<string, { count: number; resetAt: number }>()

const consumeRateLimit = (key: string, maxRequests: number, windowMs: number) => {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  if (current.count >= maxRequests) {
    return true
  }

  current.count += 1
  buckets.set(key, current)
  return false
}

export const isRateLimited = (request: FastifyRequest, scope: string, maxRequests: number, windowMs: number) =>
  consumeRateLimit(`${scope}:${request.ip || 'local'}`, maxRequests, windowMs)

export const createRateLimitHook = (scope: string, maxRequests: number, windowMs: number) => (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  if (isRateLimited(request, scope, maxRequests, windowMs)) {
    reply.code(429).send({ message: 'Too many requests' })
    return
  }

  done()
}
