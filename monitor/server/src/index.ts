import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { resolve } from 'node:path'
import { WebSocket, WebSocketServer } from 'ws'
import { readPrd } from './prd.js'
import { readProgress } from './progress.js'
import { RalphRunner } from './runner.js'
import { createResolvedMonitorPaths, loadSettings, saveSettings } from './settings.js'
import { startWatchers } from './watcher.js'
import { registerArchiveRoutes } from './routes/archive.js'
import { registerPrdRoutes } from './routes/prd.js'
import { registerProgressRoutes } from './routes/progress.js'
import { registerRunRoutes } from './routes/run.js'
import { registerSettingsRoutes } from './routes/settings.js'
import type { MonitorSettings, WebSocketEvent } from '../../shared/schema.js'

const monitorPaths = createResolvedMonitorPaths(process.cwd())
const host = process.env.MONITOR_HOST ?? '127.0.0.1'
const port = Number(process.env.MONITOR_PORT ?? '7777')
const webDistRoot = resolve(process.cwd(), 'web/dist')

const app = Fastify({ logger: false })
const wsServer = new WebSocketServer({ noServer: true })
const clients = new Set<WebSocket>()

let settings: MonitorSettings = await loadSettings(monitorPaths)
let closeWatchers = async () => {}

const emit = (event: WebSocketEvent) => {
  const payload = JSON.stringify(event)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  }
}

const runner = new RalphRunner({
  getSettings: () => settings,
  emit,
})

const syncPrd = async () => {
  const prd = await readPrd(settings)
  emit({ type: 'prd:changed', prd })
  if (!runner.isRunning() && settings.run.autoRestartOnPrdChange) {
    await runner.start({
      tool: settings.defaultTool,
      maxIterations: settings.defaultMaxIterations,
    }).catch(async (error: unknown) => {
      emit({
        type: 'run:failed',
        status: {
          ...runner.getStatus(),
          state: 'failed',
          lastError: error instanceof Error ? error.message : 'Unable to auto-restart Ralph',
        },
      })
    })
  }
}

const syncProgress = async () => {
  emit({ type: 'progress:changed', progress: await readProgress(settings) })
}

const syncBranch = async () => {
  const branch = await runner.loadBranchFromFile()
  emit({ type: 'branch:changed', branch })
}

const syncSettings = async () => {
  settings = await loadSettings(monitorPaths)
  emit({ type: 'settings:changed', settings })
  await restartWatchers()
  await syncBranch()
}

const restartWatchers = async () => {
  await closeWatchers()
  closeWatchers = startWatchers(settings, {
    onPrdChange: syncPrd,
    onProgressChange: syncProgress,
    onBranchChange: syncBranch,
    onSettingsChange: syncSettings,
  })
}

await runner.loadBranchFromFile()
await restartWatchers()

registerPrdRoutes(app, { getSettings: () => settings, emit })
registerProgressRoutes(app, { getSettings: () => settings })
registerRunRoutes(app, { getSettings: () => settings, runner, emit })
registerArchiveRoutes(app, { getSettings: () => settings })
registerSettingsRoutes(app, {
  getSettings: () => settings,
  saveSettings: async (input) => {
    settings = await saveSettings(input, monitorPaths)
    await restartWatchers()
    await syncBranch()
    return settings
  },
  emit,
})

app.get('/api/health', async () => ({ ok: true }))

await app.register(fastifyStatic, {
  root: webDistRoot,
  prefix: '/',
})

app.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith('/api')) {
    return reply.code(404).send({ message: 'Not found' })
  }
  return reply.sendFile('index.html')
})

app.server.on('upgrade', (request, socket, head) => {
  if (request.url !== '/ws') {
    socket.destroy()
    return
  }

  wsServer.handleUpgrade(request, socket, head, (webSocket: WebSocket) => {
    wsServer.emit('connection', webSocket, request)
  })
})

wsServer.on('connection', (socket: WebSocket) => {
  clients.add(socket)
  socket.on('close', () => {
    clients.delete(socket)
  })
})

const shutdown = async () => {
  runner.stop()
  await closeWatchers()
  await app.close()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown()
})
process.on('SIGTERM', () => {
  void shutdown()
})

await app.listen({ host, port })
console.log(`Ralph monitor listening on http://${host}:${port}`)
