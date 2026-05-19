import { z } from 'zod'

export const ToolSchema = z.enum(['amp', 'claude'])
export const MergeStrategySchema = z.enum(['merge', 'squash', 'rebase'])

export const UserStorySchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().default(''),
  acceptanceCriteria: z.array(z.string().trim()).default([]),
  priority: z.number().int().nonnegative(),
  passes: z.boolean(),
  notes: z.string().default(''),
})

export const PrdSchema = z.object({
  project: z.string().trim().min(1),
  branchName: z.string().trim().min(1),
  description: z.string().default(''),
  userStories: z.array(UserStorySchema).default([]),
})

export const MonitorSettingsSchema = z.object({
  defaultTool: ToolSchema.default('amp'),
  defaultMaxIterations: z.number().int().positive().default(10),
  git: z.object({
    autoMergeOnComplete: z.boolean().default(false),
    targetBranch: z.string().trim().min(1).default('main'),
    mergeStrategy: MergeStrategySchema.default('merge'),
    deleteBranchAfterMerge: z.boolean().default(false),
    pushBeforeMerge: z.boolean().default(false),
    createPullRequest: z.boolean().default(false),
    pullRequestDraft: z.boolean().default(false),
  }).default({
    autoMergeOnComplete: false,
    targetBranch: 'main',
    mergeStrategy: 'merge',
    deleteBranchAfterMerge: false,
    pushBeforeMerge: false,
    createPullRequest: false,
    pullRequestDraft: false,
  }),
  run: z.object({
    pauseOnFailure: z.boolean().default(false),
    notifyOnComplete: z.boolean().default(false),
    soundOnComplete: z.boolean().default(false),
    autoRestartOnPrdChange: z.boolean().default(false),
  }).default({
    pauseOnFailure: false,
    notifyOnComplete: false,
    soundOnComplete: false,
    autoRestartOnPrdChange: false,
  }),
  paths: z.object({
    repoRoot: z.string().trim().min(1),
    ralphScript: z.string().trim().min(1),
    prdFile: z.string().trim().min(1),
    progressFile: z.string().trim().min(1),
  }),
  qualityChecks: z.object({
    enabled: z.boolean().default(false),
    commands: z.array(z.string().trim().min(1)).default([]),
  }).default({
    enabled: false,
    commands: [],
  }),
})

export const DEFAULT_MONITOR_SETTINGS_INPUT = {
  defaultTool: 'amp',
  defaultMaxIterations: 10,
  git: {
    autoMergeOnComplete: false,
    targetBranch: 'main',
    mergeStrategy: 'merge',
    deleteBranchAfterMerge: false,
    pushBeforeMerge: false,
    createPullRequest: false,
    pullRequestDraft: false,
  },
  run: {
    pauseOnFailure: false,
    notifyOnComplete: false,
    soundOnComplete: false,
    autoRestartOnPrdChange: false,
  },
  paths: {
    repoRoot: '',
    ralphScript: './ralph.sh',
    prdFile: './prd.json',
    progressFile: './progress.txt',
  },
  qualityChecks: {
    enabled: false,
    commands: [],
  },
} as const

export const LogLineSchema = z.object({
  lineNumber: z.number().int().nonnegative(),
  stream: z.enum(['stdout', 'stderr']),
  text: z.string(),
  timestamp: z.string(),
})

export const RunIterationSchema = z.object({
  iteration: z.number().int().positive(),
  maxIterations: z.number().int().positive(),
  tool: ToolSchema,
  state: z.enum(['running', 'success', 'failed', 'stalled', 'complete']),
  startedAt: z.string(),
  endedAt: z.string().nullable().default(null),
  commitSha: z.string().nullable().default(null),
  summary: z.string().nullable().default(null),
})

export const GitCommitSchema = z.object({
  sha: z.string(),
  shortSha: z.string(),
  subject: z.string(),
  timestamp: z.string(),
  relativeTime: z.string(),
})

export const RunStatusSchema = z.object({
  state: z.enum(['idle', 'running', 'complete', 'failed', 'stalled', 'stopped']),
  tool: ToolSchema.nullable(),
  maxIterations: z.number().int().positive().nullable(),
  currentIteration: z.number().int().nonnegative(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  lastError: z.string().nullable(),
  branch: z.string().nullable(),
  lastCommit: GitCommitSchema.nullable(),
  logs: z.array(LogLineSchema),
  iterations: z.array(RunIterationSchema),
  completeSignalDetected: z.boolean().default(false),
  mergeResult: z.any().nullable().default(null),
})

export const ProgressEntrySchema = z.object({
  heading: z.string(),
  storyId: z.string(),
  timestampLabel: z.string(),
  body: z.array(z.string()),
  threadUrls: z.array(z.string().url()),
})

export const ParsedProgressSchema = z.object({
  exists: z.boolean(),
  raw: z.string(),
  codebasePatterns: z.array(z.string()),
  entries: z.array(ProgressEntrySchema),
})

export const ArchiveSummarySchema = z.object({
  name: z.string(),
  path: z.string(),
  passCount: z.number().int().nonnegative(),
  totalStories: z.number().int().nonnegative(),
  iterationCount: z.number().int().nonnegative(),
  prd: PrdSchema.nullable(),
  progress: ParsedProgressSchema,
})

export const WebSocketEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('prd:changed'), prd: PrdSchema.nullable() }),
  z.object({ type: z.literal('progress:changed'), progress: ParsedProgressSchema }),
  z.object({ type: z.literal('branch:changed'), branch: z.string().nullable() }),
  z.object({ type: z.literal('run:started'), status: RunStatusSchema }),
  z.object({ type: z.literal('run:iteration'), status: RunStatusSchema }),
  z.object({ type: z.literal('run:log'), status: RunStatusSchema, line: LogLineSchema }),
  z.object({ type: z.literal('run:complete'), status: RunStatusSchema }),
  z.object({ type: z.literal('run:failed'), status: RunStatusSchema }),
  z.object({ type: z.literal('git:merge:started'), status: RunStatusSchema, message: z.string() }),
  z.object({ type: z.literal('git:merge:succeeded'), status: RunStatusSchema, message: z.string(), result: z.any().nullable().default(null) }),
  z.object({ type: z.literal('git:merge:failed'), status: RunStatusSchema, message: z.string(), error: z.string() }),
  z.object({ type: z.literal('settings:changed'), settings: MonitorSettingsSchema }),
])

export type Tool = z.infer<typeof ToolSchema>
export type MergeStrategy = z.infer<typeof MergeStrategySchema>
export type UserStory = z.infer<typeof UserStorySchema>
export type Prd = z.infer<typeof PrdSchema>
export type MonitorSettings = z.infer<typeof MonitorSettingsSchema>
export type LogLine = z.infer<typeof LogLineSchema>
export type RunIteration = z.infer<typeof RunIterationSchema>
export type GitCommit = z.infer<typeof GitCommitSchema>
export type RunStatus = z.infer<typeof RunStatusSchema>
export type ProgressEntry = z.infer<typeof ProgressEntrySchema>
export type ParsedProgress = z.infer<typeof ParsedProgressSchema>
export type ArchiveSummary = z.infer<typeof ArchiveSummarySchema>
export type WebSocketEvent = z.infer<typeof WebSocketEventSchema>
