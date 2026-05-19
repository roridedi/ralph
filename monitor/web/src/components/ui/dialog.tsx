import type { PropsWithChildren } from 'react'
import { cn } from '../../lib-utils'

export function Dialog({ open, onClose, children }: PropsWithChildren<{ open: boolean; onClose: () => void }>) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" onClick={onClose}>
      <div className={cn('w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl')} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
