import { useEffect, useState, type ReactNode } from 'react'
import type { MonitorSettings } from '../types'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { splitNonEmptyLines } from '../utils/text'

function Section({ title, description, children, onSave }: { title: string; description: string; children: ReactNode; onSave: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={onSave}>Save</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

export function SettingsPanel({ settings, defaults, onSave }: { settings: MonitorSettings; defaults: MonitorSettings; onSave: (settings: MonitorSettings) => void }) {
  const [draft, setDraft] = useState(settings)

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="text-sm text-blue-300 hover:text-blue-200" onClick={() => onSave(defaults)}>Reset to defaults</button>
      </div>

      <Section title="Tool" description="Defaults used when you start a run." onSave={() => onSave(draft)}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Default tool</Label>
            <div className="flex gap-3">
              {(['amp', 'claude'] as const).map((tool) => (
                <label key={tool} className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm">
                  <input type="radio" checked={draft.defaultTool === tool} onChange={() => setDraft({ ...draft, defaultTool: tool })} />
                  {tool}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Default max iterations</Label>
            <Input type="number" min={1} value={draft.defaultMaxIterations} onChange={(event) => setDraft({ ...draft, defaultMaxIterations: Number(event.target.value) || 1 })} />
          </div>
        </div>
      </Section>

      <Section title="Git" description="Post-complete merge or PR behavior managed by the daemon." onSave={() => onSave(draft)}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.git.autoMergeOnComplete} onChange={(event) => setDraft({ ...draft, git: { ...draft.git, autoMergeOnComplete: event.currentTarget.checked } })} />Auto merge on complete</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.git.pushBeforeMerge} onChange={(event) => setDraft({ ...draft, git: { ...draft.git, pushBeforeMerge: event.currentTarget.checked } })} />Push before merge</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.git.createPullRequest} onChange={(event) => setDraft({ ...draft, git: { ...draft.git, createPullRequest: event.currentTarget.checked } })} />Create pull request</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.git.pullRequestDraft} onChange={(event) => setDraft({ ...draft, git: { ...draft.git, pullRequestDraft: event.currentTarget.checked } })} />Draft pull request</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.git.deleteBranchAfterMerge} onChange={(event) => setDraft({ ...draft, git: { ...draft.git, deleteBranchAfterMerge: event.currentTarget.checked } })} />Delete branch after merge</label>
          <div className="space-y-2">
            <Label>Target branch</Label>
            <Input value={draft.git.targetBranch} onChange={(event) => setDraft({ ...draft, git: { ...draft.git, targetBranch: event.target.value } })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Merge strategy</Label>
            <div className="flex gap-3">
              {(['merge', 'squash', 'rebase'] as const).map((strategy) => (
                <label key={strategy} className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm">
                  <input type="radio" checked={draft.git.mergeStrategy === strategy} onChange={() => setDraft({ ...draft, git: { ...draft.git, mergeStrategy: strategy } })} />
                  {strategy}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Run" description="Control how the daemon responds during and after runs." onSave={() => onSave(draft)}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.run.pauseOnFailure} onChange={(event) => setDraft({ ...draft, run: { ...draft.run, pauseOnFailure: event.currentTarget.checked } })} />Pause on failure</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.run.notifyOnComplete} onChange={(event) => setDraft({ ...draft, run: { ...draft.run, notifyOnComplete: event.currentTarget.checked } })} />Notify on complete</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.run.soundOnComplete} onChange={(event) => setDraft({ ...draft, run: { ...draft.run, soundOnComplete: event.currentTarget.checked } })} />Sound on complete</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.run.autoRestartOnPrdChange} onChange={(event) => setDraft({ ...draft, run: { ...draft.run, autoRestartOnPrdChange: event.currentTarget.checked } })} />Auto restart on PRD change</label>
        </div>
      </Section>

      <Section title="Paths" description="Advanced local path overrides; all paths must stay within the repo root." onSave={() => onSave(draft)}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Repo root</Label>
            <Input value={draft.paths.repoRoot} onChange={(event) => setDraft({ ...draft, paths: { ...draft.paths, repoRoot: event.target.value } })} />
          </div>
          <div className="space-y-2">
            <Label>Ralph script</Label>
            <Input value={draft.paths.ralphScript} onChange={(event) => setDraft({ ...draft, paths: { ...draft.paths, ralphScript: event.target.value } })} />
          </div>
          <div className="space-y-2">
            <Label>PRD file</Label>
            <Input value={draft.paths.prdFile} onChange={(event) => setDraft({ ...draft, paths: { ...draft.paths, prdFile: event.target.value } })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Progress file</Label>
            <Input value={draft.paths.progressFile} onChange={(event) => setDraft({ ...draft, paths: { ...draft.paths, progressFile: event.target.value } })} />
          </div>
        </div>
      </Section>

      <Section title="Quality Checks" description="Optional commands the daemon runs after each iteration." onSave={() => onSave(draft)}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.qualityChecks.enabled} onChange={(event) => setDraft({ ...draft, qualityChecks: { ...draft.qualityChecks, enabled: event.currentTarget.checked } })} />Enable quality checks</label>
          <div className="space-y-2">
            <Label>Commands (one per line)</Label>
            <Textarea
              value={draft.qualityChecks.commands.join('\n')}
              onChange={(event) => setDraft({
                ...draft,
                qualityChecks: {
                  ...draft.qualityChecks,
                  commands: splitNonEmptyLines(event.target.value),
                },
              })}
            />
          </div>
        </div>
      </Section>
    </div>
  )
}
