import type { ArchiveSummary, MonitorSettings, ParsedProgress, Prd, RunStatus, Tool } from '../types'

const jsonRequest = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const queryKeys = {
  prd: ['prd'] as const,
  progress: ['progress'] as const,
  runStatus: ['run-status'] as const,
  settings: ['settings'] as const,
  defaults: ['settings-defaults'] as const,
  archive: ['archive'] as const,
}

export const api = {
  getPrd: () => jsonRequest<Prd | null>('/api/prd'),
  savePrd: (prd: Prd) => jsonRequest<Prd>('/api/prd', { method: 'PUT', body: JSON.stringify(prd) }),
  getProgress: () => jsonRequest<ParsedProgress>('/api/progress'),
  getRunStatus: () => jsonRequest<RunStatus>('/api/run/status'),
  startRun: (payload: { tool: Tool; maxIterations: number }) => jsonRequest<RunStatus>('/api/run/start', { method: 'POST', body: JSON.stringify(payload) }),
  stopRun: () => jsonRequest<RunStatus>('/api/run/stop', { method: 'POST' }),
  getSettings: () => jsonRequest<MonitorSettings>('/api/settings'),
  getDefaultSettings: () => jsonRequest<MonitorSettings>('/api/settings/defaults'),
  saveSettings: (settings: MonitorSettings) => jsonRequest<MonitorSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  getArchive: () => jsonRequest<ArchiveSummary[]>('/api/archive'),
  getArchiveEntry: (name: string) => jsonRequest<ArchiveSummary>(`/api/archive/${encodeURIComponent(name)}`),
}
