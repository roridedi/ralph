import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { GitCommit, MergeStrategy, MonitorSettings } from '../../shared/schema.js'

const execFileAsync = promisify(execFile)

const git = async (repoRoot: string, args: string[]) => {
  const { stdout } = await execFileAsync('git', ['-C', repoRoot, ...args], { encoding: 'utf8' })
  return stdout.trim()
}

export const getHeadSha = async (repoRoot: string): Promise<string | null> => {
  try {
    const sha = await git(repoRoot, ['rev-parse', 'HEAD'])
    return sha || null
  } catch {
    return null
  }
}

export const getLastCommit = async (repoRoot: string, branch?: string | null): Promise<GitCommit | null> => {
  try {
    const ref = branch && branch.trim().length > 0 ? branch : 'HEAD'
    const output = await git(repoRoot, ['log', '-1', '--format=%H%n%h%n%s%n%cI%n%cr', ref])
    if (!output) {
      return null
    }
    const [sha, shortSha, subject, timestamp, relativeTime] = output.split('\n')
    return { sha, shortSha, subject, timestamp, relativeTime }
  } catch {
    return null
  }
}

export type MergeExecutionResult = {
  steps: string[]
  deletedBranch: boolean
  pullRequestCreated: boolean
}

export const runPostCompleteGitActions = async (
  settings: MonitorSettings,
  branchName: string,
): Promise<MergeExecutionResult> => {
  const repoRoot = settings.paths.repoRoot
  const steps: string[] = []
  const gitSettings = settings.git

  if (gitSettings.pushBeforeMerge) {
    await execFileAsync('git', ['-C', repoRoot, 'push', 'origin', branchName], { encoding: 'utf8' })
    steps.push(`Pushed ${branchName} to origin`)
  }

  if (gitSettings.createPullRequest) {
    const args = [
      'pr',
      'create',
      '--base',
      gitSettings.targetBranch,
      '--head',
      branchName,
      '--title',
      `Ralph monitor completion for ${branchName}`,
      '--body',
      `Automated Ralph completion for ${branchName}.`,
    ]

    if (gitSettings.pullRequestDraft) {
      args.push('--draft')
    }

    await execFileAsync('gh', args, { encoding: 'utf8', cwd: repoRoot })
    steps.push(`Created pull request into ${gitSettings.targetBranch}`)
    return {
      steps,
      deletedBranch: false,
      pullRequestCreated: true,
    }
  }

  await execFileAsync('git', ['-C', repoRoot, 'checkout', gitSettings.targetBranch], { encoding: 'utf8' })
  steps.push(`Checked out ${gitSettings.targetBranch}`)

  await performMerge(repoRoot, gitSettings.mergeStrategy, gitSettings.targetBranch, branchName, steps)

  let deletedBranch = false
  if (gitSettings.deleteBranchAfterMerge) {
    if (gitSettings.mergeStrategy === 'squash') {
      steps.push(`Skipped deleting ${branchName} after squash merge because git cannot verify it as merged`)
    } else {
      const merged = await git(repoRoot, ['branch', '--merged', gitSettings.targetBranch])
      const mergedBranches = merged
        .split('\n')
        .map((line) => line.replace(/^\*/, '').trim())
        .filter(Boolean)
      if (mergedBranches.includes(branchName)) {
        await execFileAsync('git', ['-C', repoRoot, 'branch', '-d', branchName], { encoding: 'utf8' })
        steps.push(`Deleted merged branch ${branchName}`)
        deletedBranch = true
      } else {
        steps.push(`Skipped deleting ${branchName}; git does not report it as merged into ${gitSettings.targetBranch}`)
      }
    }
  }

  return {
    steps,
    deletedBranch,
    pullRequestCreated: false,
  }
}

const performMerge = async (
  repoRoot: string,
  strategy: MergeStrategy,
  targetBranch: string,
  branchName: string,
  steps: string[],
) => {
  if (strategy === 'rebase') {
    await execFileAsync('git', ['-C', repoRoot, 'checkout', branchName], { encoding: 'utf8' })
    steps.push(`Checked out ${branchName} for rebase`)
    await execFileAsync('git', ['-C', repoRoot, 'rebase', targetBranch], { encoding: 'utf8' })
    steps.push(`Rebased ${branchName} onto ${targetBranch}`)
    await execFileAsync('git', ['-C', repoRoot, 'checkout', targetBranch], { encoding: 'utf8' })
    steps.push(`Checked out ${targetBranch} after rebase`)
    await execFileAsync('git', ['-C', repoRoot, 'merge', '--ff-only', branchName], { encoding: 'utf8' })
    steps.push(`Fast-forward merged ${branchName} into ${targetBranch}`)
    return
  }

  const mergeArgs = strategy === 'squash'
    ? ['-C', repoRoot, 'merge', '--squash', branchName]
    : ['-C', repoRoot, 'merge', '--no-ff', branchName]

  await execFileAsync('git', mergeArgs, { encoding: 'utf8' })
  if (strategy === 'squash') {
    await execFileAsync('git', ['-C', repoRoot, 'commit', '-m', `Squash merge ${branchName} into ${targetBranch}`], { encoding: 'utf8' })
  }
  steps.push(`${strategy === 'squash' ? 'Squash merged' : 'Merged'} ${branchName} into ${targetBranch}`)
}

export const listArchiveDirectories = async (settings: MonitorSettings): Promise<string[]> => {
  const { readdir } = await import('node:fs/promises')
  try {
    const entries = await readdir(`${settings.paths.repoRoot}/archive`, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => right.localeCompare(left))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}
