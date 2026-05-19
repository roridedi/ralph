import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import type { Prd, RunStatus, UserStory } from '../types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { StoryCard } from './StoryCard'
import { StoryEditor } from './StoryEditor'

const nextStoryId = (stories: UserStory[]) => `US-${String(stories.length + 1).padStart(3, '0')}`

export function StoryBoard({ prd, runStatus, onSave }: { prd: Prd; runStatus: RunStatus; onSave: (nextPrd: Prd) => void }) {
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)
  const [draggedStoryId, setDraggedStoryId] = useState<string | null>(null)

  const sortedStories = useMemo(() => [...prd.userStories].sort((left, right) => left.priority - right.priority), [prd.userStories])
  const backlog = sortedStories.filter((story) => !story.passes)
  const inProgress = runStatus.state === 'running' ? backlog[0] ?? null : null
  const backlogStories = inProgress ? backlog.slice(1) : backlog
  const doneStories = sortedStories.filter((story) => story.passes)
  const selectedStory = sortedStories.find((story) => story.id === selectedStoryId) ?? null

  const updateStories = (stories: UserStory[]) => {
    const normalizedStories = stories.map((story, index) => ({ ...story, priority: index + 1 }))
    onSave({ ...prd, userStories: normalizedStories })
  }

  const updateStory = (story: UserStory) => {
    updateStories(sortedStories.map((candidate) => (candidate.id === story.id ? story : candidate)))
    setSelectedStoryId(story.id)
  }

  const handleTogglePasses = (story: UserStory, passes: boolean) => {
    updateStory({ ...story, passes })
  }

  const handleAddStory = () => {
    const newStory: UserStory = {
      id: nextStoryId(sortedStories),
      title: 'New story',
      description: '',
      acceptanceCriteria: [],
      priority: sortedStories.length + 1,
      passes: false,
      notes: '',
    }
    updateStories([...sortedStories, newStory])
    setSelectedStoryId(newStory.id)
  }

  const handleDrop = (targetId: string) => {
    if (!draggedStoryId || draggedStoryId === targetId) return
    const working = [...sortedStories]
    const sourceIndex = working.findIndex((story) => story.id === draggedStoryId)
    const targetIndex = working.findIndex((story) => story.id === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return
    const [story] = working.splice(sourceIndex, 1)
    working.splice(targetIndex, 0, story)
    updateStories(working)
  }

  const renderColumn = (title: string, stories: UserStory[], dragEnabled = false) => (
    <Card className="min-h-[420px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stories.length === 0 ? <p className="text-sm text-slate-500">Nothing here yet.</p> : stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            draggable={dragEnabled}
            onDragStart={() => setDraggedStoryId(story.id)}
            onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
            onDrop={() => handleDrop(story.id)}
            onSelect={() => setSelectedStoryId(story.id)}
            onTogglePasses={(passes) => handleTogglePasses(story, passes)}
          />
        ))}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>PRD metadata</CardTitle>
            <Button onClick={handleAddStory}>Add story</Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="project">Project</Label>
            <Input id="project" value={prd.project} onChange={(event) => onSave({ ...prd, project: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="branchName">Branch name</Label>
            <Input id="branchName" value={prd.branchName} onChange={(event) => onSave({ ...prd, branchName: event.target.value })} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {renderColumn('Backlog', backlogStories, true)}
        {renderColumn('In Progress', inProgress ? [inProgress] : [])}
        {renderColumn('Done', doneStories)}
      </div>

      <StoryEditor story={selectedStory} onClose={() => setSelectedStoryId(null)} onSave={updateStory} />
    </div>
  )
}
