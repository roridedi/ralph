import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './client'
import type { RunStatus, WebSocketEvent } from '../types'

const updateRunStatus = (current: RunStatus | undefined, next: RunStatus) => next

export const useWebSocket = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws`)

    socket.onmessage = (message) => {
      const event = JSON.parse(message.data) as WebSocketEvent
      switch (event.type) {
        case 'prd:changed':
          queryClient.setQueryData(queryKeys.prd, event.prd)
          break
        case 'progress:changed':
          queryClient.setQueryData(queryKeys.progress, event.progress)
          break
        case 'branch:changed':
          queryClient.setQueryData<RunStatus | undefined>(queryKeys.runStatus, (current) =>
            current ? { ...current, branch: event.branch } : current,
          )
          break
        case 'run:started':
        case 'run:iteration':
        case 'run:complete':
        case 'run:failed':
          queryClient.setQueryData(queryKeys.runStatus, updateRunStatus(undefined, event.status))
          break
        case 'run:log':
          queryClient.setQueryData(queryKeys.runStatus, updateRunStatus(undefined, event.status))
          break
        case 'git:merge:started':
        case 'git:merge:succeeded':
        case 'git:merge:failed':
          queryClient.setQueryData(queryKeys.runStatus, updateRunStatus(undefined, event.status))
          break
        case 'settings:changed':
          queryClient.setQueryData(queryKeys.settings, event.settings)
          break
      }
    }

    return () => socket.close()
  }, [queryClient])
}
