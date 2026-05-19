import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, queryKeys } from '../api/client'
import { StoryBoard } from '../components/StoryBoard'

export function Stories() {
  const queryClient = useQueryClient()
  const { data: prd } = useQuery({ queryKey: queryKeys.prd, queryFn: api.getPrd })
  const { data: runStatus } = useQuery({ queryKey: queryKeys.runStatus, queryFn: api.getRunStatus })
  const savePrd = useMutation({
    mutationFn: api.savePrd,
    onSuccess: (nextPrd) => {
      queryClient.setQueryData(queryKeys.prd, nextPrd)
    },
  })

  if (!prd || !runStatus) {
    return <div className="text-sm text-slate-500">Create or load a prd.json to edit stories.</div>
  }

  return <StoryBoard prd={prd} runStatus={runStatus} onSave={(nextPrd) => savePrd.mutate(nextPrd)} />
}
