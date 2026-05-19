import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { DEFAULT_MONITOR_SETTINGS_INPUT, MonitorSettingsSchema, type MonitorSettings } from '../../shared/schema.js'

export type ResolvedMonitorPaths = {
  monitorRoot: string
  settingsFile: string
}

export const createResolvedMonitorPaths = (monitorRoot = process.cwd()): ResolvedMonitorPaths => ({
  monitorRoot: resolve(monitorRoot),
  settingsFile: resolve(monitorRoot, '../monitor.config.json'),
})

const baseDefaultSettings = (monitorRoot = process.cwd()) => ({
  ...DEFAULT_MONITOR_SETTINGS_INPUT,
  paths: {
    repoRoot: resolve(monitorRoot, '..'),
    ralphScript: './ralph.sh',
    prdFile: './prd.json',
    progressFile: './progress.txt',
  },
})

const resolveInside = (repoRoot: string, candidate: string) => {
  const resolved = isAbsolute(candidate) ? resolve(candidate) : resolve(repoRoot, candidate)
  if (!resolved.startsWith(repoRoot)) {
    throw new Error(`Path must stay within repo root: ${candidate}`)
  }
  return resolved
}

export const createDefaultSettings = (monitorRoot = process.cwd()): MonitorSettings => {
  return normalizeSettings(baseDefaultSettings(monitorRoot), monitorRoot)
}

export const normalizeSettings = (input: unknown, monitorRoot = process.cwd()): MonitorSettings => {
  const defaults = MonitorSettingsSchema.parse(baseDefaultSettings(monitorRoot))
  const parsed = MonitorSettingsSchema.parse({
    ...defaults,
    ...(typeof input === 'object' && input !== null ? input : {}),
    git: {
      ...defaults.git,
      ...((typeof input === 'object' && input !== null && 'git' in input && typeof input.git === 'object' && input.git !== null) ? input.git : {}),
    },
    run: {
      ...defaults.run,
      ...((typeof input === 'object' && input !== null && 'run' in input && typeof input.run === 'object' && input.run !== null) ? input.run : {}),
    },
    paths: {
      ...defaults.paths,
      ...((typeof input === 'object' && input !== null && 'paths' in input && typeof input.paths === 'object' && input.paths !== null) ? input.paths : {}),
    },
    qualityChecks: {
      ...defaults.qualityChecks,
      ...((typeof input === 'object' && input !== null && 'qualityChecks' in input && typeof input.qualityChecks === 'object' && input.qualityChecks !== null) ? input.qualityChecks : {}),
    },
  })

  const repoRoot = isAbsolute(parsed.paths.repoRoot)
    ? resolve(parsed.paths.repoRoot)
    : resolve(monitorRoot, parsed.paths.repoRoot)

  const normalized = {
    ...parsed,
    paths: {
      repoRoot,
      ralphScript: resolveInside(repoRoot, parsed.paths.ralphScript),
      prdFile: resolveInside(repoRoot, parsed.paths.prdFile),
      progressFile: resolveInside(repoRoot, parsed.paths.progressFile),
    },
  }

  return MonitorSettingsSchema.parse(normalized)
}

export const loadSettings = async (paths = createResolvedMonitorPaths()): Promise<MonitorSettings> => {
  try {
    const content = await readFile(paths.settingsFile, 'utf8')
    return normalizeSettings(JSON.parse(content), paths.monitorRoot)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return createDefaultSettings(paths.monitorRoot)
    }
    throw error
  }
}

export const saveSettings = async (settings: unknown, paths = createResolvedMonitorPaths()): Promise<MonitorSettings> => {
  const normalized = normalizeSettings(settings, paths.monitorRoot)
  const parent = resolve(paths.settingsFile, '..')
  await mkdir(parent, { recursive: true })
  const tempFile = `${paths.settingsFile}.tmp`
  await writeFile(tempFile, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
  await rename(tempFile, paths.settingsFile)
  return normalized
}

export const settingsFileExists = async (paths = createResolvedMonitorPaths()): Promise<boolean> => {
  try {
    await stat(paths.settingsFile)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false
    }
    throw error
  }
}
