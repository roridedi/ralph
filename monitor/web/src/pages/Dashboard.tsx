import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, queryKeys } from '../api/client'
import { CodebasePatterns } from '../components/CodebasePatterns'
import { ProgressFeed } from '../components/ProgressFeed'
import { StatusBar } from '../components/StatusBar'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export function Dashboard() {
  const { data: prd } = useQuery({ queryKey: queryKeys.prd, queryFn: api.getPrd })
  const { data: progress } = useQuery({ queryKey: queryKeys.progress, queryFn: api.getProgress })
  const { data: runStatus } = useQuery({ queryKey: queryKeys.runStatus, queryFn: api.getRunStatus })

  const nextStory = useMemo(() => prd?.userStories.filter((story) => !story.passes).sort((left, right) => left.priority - right.priority)[0] ?? null, [prd])
  const completedStories = prd?.userStories.filter((story) => story.passes).length ?? 0
  const totalStories = prd?.userStories.length ?? 0

  if (!runStatus || !progress) {
    return <div className="text-sm text-slate-500">Loading dashboard…</div>
  }

  return (
    <div className="space-y-6">
      <StatusBar runStatus={runStatus} completedStories={completedStories} totalStories={totalStories} lastCommit={runStatus.lastCommit} />
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Next story</CardTitle>
          </CardHeader>
          <CardContent>
            {nextStory ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{nextStory.id}</p>
                  <h2 className="text-xl font-semibold text-slate-50">{nextStory.title}</h2>
                </div>
                <p className="text-sm text-slate-300">{nextStory.description}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
                  {nextStory.acceptanceCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No remaining stories. Ralph can finish whenever the run completes.</p>
            )}
          </CardContent>
        </Card>
        <CodebasePatterns progress={progress} />
      </div>
      <ProgressFeed progress={progress} />
    </div>
  )
}
