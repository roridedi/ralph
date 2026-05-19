import type { DragEvent } from 'react'
import type { UserStory } from '../types'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'

export function StoryCard({
  story,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onSelect,
  onTogglePasses,
}: {
  story: UserStory
  draggable?: boolean
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void
  onDrop?: (event: DragEvent<HTMLDivElement>) => void
  onSelect: () => void
  onTogglePasses: (next: boolean) => void
}) {
  return (
    <Card
      className="cursor-pointer border-slate-800 bg-slate-950/80"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{story.id}</div>
            <div className="font-medium text-slate-100">{story.title}</div>
          </div>
          <Badge>Priority {story.priority}</Badge>
        </div>
        <p className="text-sm text-slate-400">{story.description || 'No description yet.'}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {story.acceptanceCriteria.slice(0, 3).map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>
        <label className="flex items-center gap-2 text-sm text-slate-300" onClick={(event) => event.stopPropagation()}>
          <Checkbox checked={story.passes} onChange={(event) => onTogglePasses(event.currentTarget.checked)} />
          Mark passed
        </label>
      </CardContent>
    </Card>
  )
}
