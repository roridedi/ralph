import { useMemo, useState } from 'react'
import type { RunStatus, Tool } from '../types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { RunConfigForm } from './RunConfigForm'

export function RunConsole({
  runStatus,
  defaultTool,
  defaultMaxIterations,
  onStart,
  onStop,
}: {
  runStatus: RunStatus
  defaultTool: Tool
  defaultMaxIterations: number
  onStart: (payload: { tool: Tool; maxIterations: number }) => void
  onStop: () => void
}) {
  const [configOpen, setConfigOpen] = useState(false)
  const groupedLogs = useMemo(() => {
    const groups: Array<{ title: string; lines: string[] }> = []
    let current = { title: 'Bootstrap', lines: [] as string[] }
    for (const line of runStatus.logs) {
      const match = line.text.match(/Ralph Iteration\s+(\d+)\s+of\s+(\d+)\s+\((amp|claude)\)/i)
      if (match) {
        if (current.lines.length > 0) groups.push(current)
        current = { title: `Iteration ${match[1]} of ${match[2]} (${match[3]})`, lines: [line.text] }
      } else {
        current.lines.push(line.text)
      }
    }
    if (current.lines.length > 0) groups.push(current)
    return groups
  }, [runStatus.logs])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Run controls</CardTitle>
              <p className="text-sm text-slate-400">Start or stop Ralph directly from the browser.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setConfigOpen(true)} disabled={runStatus.state === 'running'}>Start run</Button>
              <Button variant="destructive" onClick={onStop} disabled={runStatus.state !== 'running'}>Stop run</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {runStatus.completeSignalDetected ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">Ralph emitted <code>&lt;promise&gt;COMPLETE&lt;/promise&gt;</code>.</div>
          ) : null}
          {runStatus.lastError ? (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{runStatus.lastError}</div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {groupedLogs.length === 0 ? <p className="text-sm text-slate-500">No logs yet.</p> : groupedLogs.map((group) => (
            <details key={group.title} open className="rounded-lg border border-slate-800 bg-slate-950/70">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-200">{group.title}</summary>
              <pre className="max-h-[320px] overflow-auto px-3 pb-3 text-xs text-slate-300">{group.lines.join('\n')}</pre>
            </details>
          ))}
        </CardContent>
      </Card>

      <RunConfigForm
        open={configOpen}
        defaultTool={defaultTool}
        defaultMaxIterations={defaultMaxIterations}
        onClose={() => setConfigOpen(false)}
        onSubmit={(payload) => {
          onStart(payload)
          setConfigOpen(false)
        }}
      />
    </div>
  )
}
