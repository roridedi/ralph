import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib-utils'

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cn('h-4 w-4 rounded border-slate-600 bg-slate-950 text-blue-500', className)} {...props} />
}
