import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, queryKeys } from '../api/client'
import { ProgressFeed } from '../components/ProgressFeed'
import { RunConsole } from '../components/RunConsole'

export function ConsolePage() {
  const queryClient = useQueryClient()
  const { data: runStatus } = useQuery({ queryKey: queryKeys.runStatus, queryFn: api.getRunStatus })
  const { data: settings } = useQuery({ queryKey: queryKeys.settings, queryFn: api.getSettings })
  const { data: progress } = useQuery({ queryKey: queryKeys.progress, queryFn: api.getProgress })

  const startRun = useMutation({
    mutationFn: api.startRun,
    onSuccess: (status) => queryClient.setQueryData(queryKeys.runStatus, status),
  })
  const stopRun = useMutation({
    mutationFn: api.stopRun,
    onSuccess: (status) => queryClient.setQueryData(queryKeys.runStatus, status),
  })

  if (!runStatus || !settings || !progress) {
    return <div className="text-sm text-slate-500">Loading console…</div>
  }

  return (
    <div className="space-y-6">
      <RunConsole
        runStatus={runStatus}
        defaultTool={settings.defaultTool}
        defaultMaxIterations={settings.defaultMaxIterations}
        onStart={(payload) => startRun.mutate(payload)}
        onStop={() => stopRun.mutate()}
      />
      <ProgressFeed progress={progress} />
    </div>
  )
}
