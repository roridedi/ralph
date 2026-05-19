import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, queryKeys } from '../api/client'
import { SettingsPanel } from '../components/SettingsPanel'

export function Settings() {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery({ queryKey: queryKeys.settings, queryFn: api.getSettings })
  const { data: defaults } = useQuery({ queryKey: queryKeys.defaults, queryFn: api.getDefaultSettings })
  const saveSettings = useMutation({
    mutationFn: api.saveSettings,
    onSuccess: (nextSettings) => queryClient.setQueryData(queryKeys.settings, nextSettings),
  })

  if (!settings || !defaults) {
    return <div className="text-sm text-slate-500">Loading settings…</div>
  }

  return <SettingsPanel settings={settings} defaults={defaults} onSave={(nextSettings) => saveSettings.mutate(nextSettings)} />
}
