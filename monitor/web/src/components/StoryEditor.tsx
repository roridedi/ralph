import { useEffect, useState } from 'react'
import type { UserStory } from '../types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'

export function StoryEditor({
  story,
  onClose,
  onSave,
}: {
  story: UserStory | null
  onClose: () => void
  onSave: (story: UserStory) => void
}) {
  const [draft, setDraft] = useState<UserStory | null>(story)

  useEffect(() => {
    setDraft(story)
  }, [story])

  if (!draft) {
    return null
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl border-l border-slate-800 bg-slate-950/95 p-6 backdrop-blur">
      <Card className="h-full overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Edit story</CardTitle>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="story-id">ID</Label>
            <Input id="story-id" value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="story-title">Title</Label>
            <Input id="story-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="story-description">Description</Label>
            <Textarea id="story-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="story-criteria">Acceptance criteria (one per line)</Label>
            <Textarea
              id="story-criteria"
              value={draft.acceptanceCriteria.join('\n')}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  acceptanceCriteria: event.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="story-notes">Notes</Label>
            <Textarea id="story-notes" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="story-priority">Priority</Label>
              <Input id="story-priority" type="number" min={1} value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: Number(event.target.value) || 1 })} />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm text-slate-300">
              <Checkbox checked={draft.passes} onChange={(event) => setDraft({ ...draft, passes: event.currentTarget.checked })} />
              Story passes
            </label>
          </div>
          <Button className="w-full" onClick={() => onSave(draft)}>Save story</Button>
        </CardContent>
      </Card>
    </div>
  )
}
