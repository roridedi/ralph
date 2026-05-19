import { useEffect, useState } from 'react'
import type { Tool } from '../types'
import { Button } from './ui/button'
import { Dialog } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

export function RunConfigForm({
  open,
  defaultTool,
  defaultMaxIterations,
  onClose,
  onSubmit,
}: {
  open: boolean
  defaultTool: Tool
  defaultMaxIterations: number
  onClose: () => void
  onSubmit: (payload: { tool: Tool; maxIterations: number }) => void
}) {
  const [tool, setTool] = useState<Tool>(defaultTool)
  const [maxIterations, setMaxIterations] = useState(defaultMaxIterations)

  useEffect(() => {
    if (open) {
      setTool(defaultTool)
      setMaxIterations(defaultMaxIterations)
    }
  }, [defaultTool, defaultMaxIterations, open])

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Start Ralph run</h3>
          <p className="text-sm text-slate-400">Choose the tool and iteration cap for this run.</p>
        </div>
        <div className="space-y-2">
          <Label>Tool</Label>
          <div className="flex gap-3">
            {(['amp', 'claude'] as const).map((option) => (
              <label key={option} className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm">
                <input type="radio" name="tool" checked={tool === option} onChange={() => setTool(option)} />
                {option}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-iterations">Max iterations</Label>
          <Input id="max-iterations" type="number" min={1} value={maxIterations} onChange={(event) => setMaxIterations(Number(event.target.value) || 1)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ tool, maxIterations })}>Start run</Button>
        </div>
      </div>
    </Dialog>
  )
}
