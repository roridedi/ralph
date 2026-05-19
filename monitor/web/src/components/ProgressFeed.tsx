import type { ParsedProgress } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function ProgressFeed({ progress }: { progress: ParsedProgress }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress feed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress.entries.length === 0 ? <p className="text-sm text-slate-500">No progress entries yet.</p> : progress.entries.map((entry) => (
          <div key={entry.heading} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-100">{entry.storyId || 'Unknown story'}</div>
                <div className="text-xs text-slate-500">{entry.timestampLabel}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.threadUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-300 hover:text-blue-200">Amp thread</a>
                ))}
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              {entry.body.map((line, index) => <li key={`${entry.heading}-${index}`}>{line}</li>)}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
