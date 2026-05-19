import type { ParsedProgress } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function CodebasePatterns({ progress }: { progress: ParsedProgress }) {
  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Codebase patterns</CardTitle>
      </CardHeader>
      <CardContent>
        {progress.codebasePatterns.length === 0 ? <p className="text-sm text-slate-500">No patterns logged yet.</p> : (
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
            {progress.codebasePatterns.map((pattern) => <li key={pattern}>{pattern}</li>)}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
