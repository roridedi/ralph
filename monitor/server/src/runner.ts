import { spawn, exec as execCallback } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { getHeadSha, getLastCommit, runPostCompleteGitActions } from './git.js'
import { readPrd } from './prd.js'
import {
  RunStatusSchema,
  type LogLine,
  type MonitorSettings,
  type RunIteration,
  type RunStatus,
  type Tool,
  type WebSocketEvent,
} from '../../shared/schema.js'

const execAsync = promisify(execCallback)
const ITERATION_REGEX = /Ralph Iteration\s+(\d+)\s+of\s+(\d+)\s+\((amp|claude)\)/i
const COMPLETE_SIGNAL = '<promise>COMPLETE</promise>'
const MAX_LOG_LINES = 1000

type StartOptions = {
  tool: Tool
  maxIterations: number
}

type RunnerCallbacks = {
  getSettings: () => MonitorSettings
  emit: (event: WebSocketEvent) => void
}

type ActiveIterationState = RunIteration & {
  startSha: string | null
}

const createIdleStatus = (): RunStatus => RunStatusSchema.parse({
  state: 'idle',
  tool: null,
  maxIterations: null,
  currentIteration: 0,
  startedAt: null,
  endedAt: null,
  completedAt: null,
  lastError: null,
  branch: null,
  lastCommit: null,
  logs: [],
  iterations: [],
  completeSignalDetected: false,
  mergeResult: null,
})

const now = () => new Date().toISOString()

export class RalphRunner {
  private child: ReturnType<typeof spawn> | null = null
  private status: RunStatus = createIdleStatus()
  private lineNumber = 1
  private activeIteration: ActiveIterationState | null = null
  private stopRequested = false
  private lineProcessing = Promise.resolve()

  constructor(private readonly callbacks: RunnerCallbacks) {}

  getStatus() {
    return this.status
  }

  isRunning() {
    return this.child !== null
  }

  setBranch(branch: string | null) {
    this.status = RunStatusSchema.parse({ ...this.status, branch })
  }

  async refreshLastCommit() {
    const settings = this.callbacks.getSettings()
    const lastCommit = await getLastCommit(settings.paths.repoRoot, this.status.branch)
    this.status = RunStatusSchema.parse({ ...this.status, lastCommit })
  }

  async start(options: StartOptions) {
    if (this.child) {
      throw new Error('Ralph is already running')
    }

    const settings = this.callbacks.getSettings()
    const prd = await readPrd(settings)
    this.stopRequested = false
    this.lineNumber = 1
    this.activeIteration = null
    this.lineProcessing = Promise.resolve()
    this.status = RunStatusSchema.parse({
      ...createIdleStatus(),
      state: 'running',
      tool: options.tool,
      maxIterations: options.maxIterations,
      startedAt: now(),
      branch: prd?.branchName ?? this.status.branch,
      logs: [],
      iterations: [],
    })
    await this.refreshLastCommit()
    this.callbacks.emit({ type: 'run:started', status: this.status })

    const args = ['--tool', options.tool, String(options.maxIterations)]
    this.child = spawn(settings.paths.ralphScript, args, {
      cwd: settings.paths.repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })

    this.attachStream(this.child.stdout, 'stdout')
    this.attachStream(this.child.stderr, 'stderr')

    this.child.on('error', async (error) => {
      await this.failRun(error.message)
    })

    this.child.on('exit', async (code, signal) => {
      this.child = null
      await this.lineProcessing
      await this.finalizeActiveIteration(this.status.completeSignalDetected ? 'complete' : code === 0 ? 'success' : 'failed')
      await this.refreshLastCommit()

      if (this.status.completeSignalDetected) {
        this.status = RunStatusSchema.parse({
          ...this.status,
          state: 'complete',
          completedAt: now(),
          endedAt: now(),
        })
        this.callbacks.emit({ type: 'run:complete', status: this.status })
        await this.handlePostCompleteActions()
        return
      }

      const nextState = this.stopRequested || signal === 'SIGTERM' ? 'stopped' : this.status.state === 'stalled' ? 'stalled' : 'failed'
      this.status = RunStatusSchema.parse({
        ...this.status,
        state: nextState,
        endedAt: now(),
        lastError: nextState === 'failed' ? `Ralph exited with code ${code ?? 'unknown'}` : this.status.lastError,
      })
      this.callbacks.emit({ type: 'run:failed', status: this.status })
    })
  }

  stop() {
    if (!this.child) {
      return false
    }
    this.stopRequested = true
    this.child.kill('SIGTERM')
    return true
  }

  private attachStream(stream: NodeJS.ReadableStream | null, streamName: LogLine['stream']) {
    if (!stream) {
      return
    }

    let buffer = ''
    stream.setEncoding('utf8')
    stream.on('data', (chunk: string) => {
      buffer += chunk
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        this.queueLine(streamName, line)
      }
    })
    stream.on('end', () => {
      if (buffer.length > 0) {
        this.queueLine(streamName, buffer)
        buffer = ''
      }
    })
  }

  private queueLine(stream: LogLine['stream'], text: string) {
    this.lineProcessing = this.lineProcessing
      .then(() => this.handleLine(stream, text))
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Line processing failed'
        this.status = RunStatusSchema.parse({
          ...this.status,
          state: 'failed',
          lastError: message,
        })
      })
  }

  private async handleLine(stream: LogLine['stream'], text: string) {
    const line: LogLine = {
      lineNumber: this.lineNumber,
      stream,
      text,
      timestamp: now(),
    }
    this.lineNumber += 1

    const logs = [...this.status.logs, line].slice(-MAX_LOG_LINES)
    this.status = RunStatusSchema.parse({ ...this.status, logs })

    const iterationMatch = text.match(ITERATION_REGEX)
    if (iterationMatch) {
      await this.finalizeActiveIteration('success')
      const [, iterationValue, maxIterationsValue, toolValue] = iterationMatch
      const startSha = await getHeadSha(this.callbacks.getSettings().paths.repoRoot)
      const nextIteration: ActiveIterationState = {
        iteration: Number(iterationValue),
        maxIterations: Number(maxIterationsValue),
        tool: toolValue as Tool,
        state: 'running',
        startedAt: now(),
        endedAt: null,
        commitSha: null,
        summary: null,
        startSha,
      }
      this.activeIteration = nextIteration
      this.status = RunStatusSchema.parse({
        ...this.status,
        currentIteration: nextIteration.iteration,
        iterations: [...this.status.iterations, nextIteration],
      })
      this.callbacks.emit({ type: 'run:iteration', status: this.status })
    }

    if (text.includes(COMPLETE_SIGNAL)) {
      this.status = RunStatusSchema.parse({ ...this.status, completeSignalDetected: true })
    }

    this.callbacks.emit({ type: 'run:log', status: this.status, line })
  }

  private async finalizeActiveIteration(defaultState: RunIteration['state']) {
    if (!this.activeIteration) {
      return
    }

    const repoRoot = this.callbacks.getSettings().paths.repoRoot
    const headSha = await getHeadSha(repoRoot)
    const iterationState = headSha && headSha !== this.activeIteration.startSha
      ? (this.status.completeSignalDetected ? 'complete' : 'success')
      : defaultState === 'complete'
        ? 'complete'
        : this.callbacks.getSettings().run.pauseOnFailure
          ? 'stalled'
          : defaultState

    const updatedIteration: RunIteration = {
      iteration: this.activeIteration.iteration,
      maxIterations: this.activeIteration.maxIterations,
      tool: this.activeIteration.tool,
      state: iterationState,
      startedAt: this.activeIteration.startedAt,
      endedAt: now(),
      commitSha: headSha,
      summary: iterationState === 'stalled'
        ? 'Iteration completed without creating a new commit'
        : iterationState === 'complete'
          ? 'Ralph reported complete'
          : 'Iteration finished',
    }

    const iterations = this.status.iterations.map((iteration) =>
      iteration.iteration === updatedIteration.iteration ? updatedIteration : iteration,
    )

    const nextStatusState = iterationState === 'stalled' ? 'stalled' : this.status.state
    this.status = RunStatusSchema.parse({
      ...this.status,
      state: nextStatusState,
      iterations,
      lastError: iterationState === 'stalled' ? updatedIteration.summary : this.status.lastError,
    })

    await this.runQualityChecks(updatedIteration.iteration)

    if (iterationState === 'stalled' && this.callbacks.getSettings().run.pauseOnFailure) {
      this.stopRequested = true
      this.child?.kill('SIGTERM')
    }

    this.activeIteration = null
  }

  private async runQualityChecks(iteration: number) {
    const settings = this.callbacks.getSettings()
    if (!settings.qualityChecks.enabled || settings.qualityChecks.commands.length === 0) {
      return
    }

    for (const command of settings.qualityChecks.commands) {
      try {
        const { stdout, stderr } = await execAsync(command, { cwd: settings.paths.repoRoot, encoding: 'utf8' })
        for (const outputLine of `${stdout}${stderr}`.split(/\r?\n/).filter(Boolean)) {
          await this.handleLine('stdout', `[quality][iteration ${iteration}] ${outputLine}`)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Quality check failed'
        await this.handleLine('stderr', `[quality][iteration ${iteration}] ${message}`)
        if (settings.run.pauseOnFailure) {
          this.status = RunStatusSchema.parse({
            ...this.status,
            state: 'stalled',
            lastError: `Quality checks failed after iteration ${iteration}`,
          })
          this.stopRequested = true
          this.child?.kill('SIGTERM')
          return
        }
      }
    }
  }

  private async handlePostCompleteActions() {
    const settings = this.callbacks.getSettings()
    if (!settings.git.autoMergeOnComplete || !this.status.branch) {
      return
    }

    this.callbacks.emit({
      type: 'git:merge:started',
      status: this.status,
      message: `Running post-complete git actions for ${this.status.branch}`,
    })

    try {
      const result = await runPostCompleteGitActions(settings, this.status.branch)
      await this.refreshLastCommit()
      this.status = RunStatusSchema.parse({ ...this.status, mergeResult: result })
      this.callbacks.emit({
        type: 'git:merge:succeeded',
        status: this.status,
        message: result.steps.join(' • '),
        result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown git error'
      this.status = RunStatusSchema.parse({ ...this.status, mergeResult: { error: message } })
      this.callbacks.emit({
        type: 'git:merge:failed',
        status: this.status,
        message: 'Post-complete git actions failed',
        error: message,
      })
    }
  }

  private async failRun(message: string) {
    this.status = RunStatusSchema.parse({
      ...this.status,
      state: 'failed',
      endedAt: now(),
      lastError: message,
    })
    this.callbacks.emit({ type: 'run:failed', status: this.status })
  }

  async loadBranchFromFile() {
    const repoRoot = this.callbacks.getSettings().paths.repoRoot
    try {
      const branch = (await readFile(`${repoRoot}/.last-branch`, 'utf8')).trim() || null
      this.setBranch(branch)
      await this.refreshLastCommit()
      return branch
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.setBranch(null)
        await this.refreshLastCommit()
        return null
      }
      throw error
    }
  }
}
