import chokidar from 'chokidar'
import type { MonitorSettings } from '../../shared/schema.js'

type WatcherCallbacks = {
  onPrdChange: () => void | Promise<void>
  onProgressChange: () => void | Promise<void>
  onBranchChange: () => void | Promise<void>
  onSettingsChange: () => void | Promise<void>
}

const debounce = (callback: () => void | Promise<void>) => {
  let timeout: NodeJS.Timeout | null = null
  return () => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      void callback()
    }, 100)
  }
}

export const startWatchers = (settings: MonitorSettings, callbacks: WatcherCallbacks) => {
  const prdWatcher = chokidar.watch(settings.paths.prdFile, { ignoreInitial: true })
  const progressWatcher = chokidar.watch(settings.paths.progressFile, { ignoreInitial: true })
  const branchWatcher = chokidar.watch(`${settings.paths.repoRoot}/.last-branch`, { ignoreInitial: true })
  const settingsWatcher = chokidar.watch(`${settings.paths.repoRoot}/monitor.config.json`, { ignoreInitial: true })

  const onPrd = debounce(callbacks.onPrdChange)
  const onProgress = debounce(callbacks.onProgressChange)
  const onBranch = debounce(callbacks.onBranchChange)
  const onSettings = debounce(callbacks.onSettingsChange)

  prdWatcher.on('add', onPrd).on('change', onPrd)
  progressWatcher.on('add', onProgress).on('change', onProgress)
  branchWatcher.on('add', onBranch).on('change', onBranch)
  settingsWatcher.on('add', onSettings).on('change', onSettings)

  return async () => {
    await Promise.all([
      prdWatcher.close(),
      progressWatcher.close(),
      branchWatcher.close(),
      settingsWatcher.close(),
    ])
  }
}
