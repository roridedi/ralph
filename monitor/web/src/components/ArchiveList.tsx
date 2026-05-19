import { useEffect, useState } from 'react'
import type { ArchiveSummary } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function ArchiveList({ archives }: { archives: ArchiveSummary[] }) {
  const [selectedName, setSelectedName] = useState<string | null>(archives[0]?.name ?? null)

  useEffect(() => {
    if (!selectedName && archives[0]) {
      setSelectedName(archives[0].name)
    }
  }, [archives, selectedName])

  const selected = archives.find((archive) => archive.name === selectedName) ?? archives[0] ?? null

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Archive runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {archives.length === 0 ? <p className="text-sm text-slate-500">No archived runs yet.</p> : archives.map((archive) => (
            <button
              key={archive.name}
              className={`w-full rounded-lg border px-3 py-3 text-left ${selected?.name === archive.name ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-950/70'}`}
              onClick={() => setSelectedName(archive.name)}
            >
              <div className="font-medium text-slate-100">{archive.name}</div>
              <div className="text-sm text-slate-400">{archive.passCount}/{archive.totalStories} stories • {archive.iterationCount} iterations</div>
            </button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{selected?.name ?? 'Archive details'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selected ? (
            <>
              <div>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Archived PRD</h4>
                <pre className="max-h-[240px] overflow-auto rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">{JSON.stringify(selected.prd, null, 2)}</pre>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Archived progress</h4>
                <pre className="max-h-[240px] overflow-auto rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">{selected.progress.raw || 'No archived progress.txt found.'}</pre>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select an archive to inspect its PRD and progress snapshot.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
