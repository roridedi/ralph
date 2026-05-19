import { useQuery } from '@tanstack/react-query'
import { api, queryKeys } from '../api/client'
import { ArchiveList } from '../components/ArchiveList'

export function History() {
  const { data: archives } = useQuery({ queryKey: queryKeys.archive, queryFn: api.getArchive })

  if (!archives) {
    return <div className="text-sm text-slate-500">Loading history…</div>
  }

  return <ArchiveList archives={archives} />
}
