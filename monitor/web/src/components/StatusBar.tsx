import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import type { GitCommit, RunStatus } from '../types'

const statusLabel = (runStatus: RunStatus) => {
  if (runStatus.state === 'running') return `Running iteration ${runStatus.currentIteration}/${runStatus.maxIterations ?? '?'}`
  if (runStatus.state === 'complete') return 'Complete'
  if (runStatus.state === 'stalled') return 'Stalled'
  if (runStatus.state === 'failed') return 'Failed'
  if (runStatus.state === 'stopped') return 'Stopped'
  return 'Idle'
}

const statusColor = (state: RunStatus['state']) => {
  switch (state) {
    case 'running':
      return 'bg-blue-600/20 text-blue-300 border-blue-500/40'
    case 'complete':
      return 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
    case 'failed':
    case 'stalled':
      return 'bg-rose-600/20 text-rose-300 border-rose-500/40'
    case 'stopped':
      return 'bg-amber-600/20 text-amber-300 border-amber-500/40'
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700'
  }
}

export function StatusBar({
  runStatus,
  completedStories,
  totalStories,
  lastCommit,
}: {
  runStatus: RunStatus
  completedStories: number
  totalStories: number
  lastCommit: GitCommit | null
}) {
  const progress = totalStories === 0 ? 0 : Math.round((completedStories / totalStories) * 100)

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.5fr_1fr_1fr_1.5fr]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Run status</p>
          <Badge className={statusColor(runStatus.state)}>{statusLabel(runStatus)}</Badge>
          <p className="text-sm text-slate-400">Active branch: <span className="text-slate-200">{runStatus.branch ?? 'Unknown'}</span></p>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Progress ring</p>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-blue-500/40 text-lg font-semibold text-blue-300">{progress}%</div>
            <div>
              <div className="text-2xl font-semibold">{completedStories}/{totalStories}</div>
              <div className="text-sm text-slate-400">stories complete</div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Timeline</p>
          <div className="flex flex-wrap gap-2">
            {runStatus.iterations.length === 0 ? <span className="text-sm text-slate-500">No iterations yet</span> : runStatus.iterations.map((iteration) => (
              <span
                key={iteration.iteration}
                className={`h-3 w-3 rounded-full ${iteration.state === 'complete' || iteration.state === 'success' ? 'bg-emerald-400' : iteration.state === 'running' ? 'bg-blue-400' : iteration.state === 'stalled' ? 'bg-amber-400' : 'bg-rose-400'}`}
                title={`Iteration ${iteration.iteration}: ${iteration.state}`}
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last commit</p>
          {lastCommit ? (
            <>
              <div className="font-medium text-slate-100">{lastCommit.subject}</div>
              <div className="text-sm text-slate-400">{lastCommit.shortSha} • {lastCommit.relativeTime}</div>
            </>
          ) : (
            <div className="text-sm text-slate-500">No commit data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
