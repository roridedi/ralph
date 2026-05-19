import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib-utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-offset-slate-950 placeholder:text-slate-500 focus:border-blue-500', className)}
      {...props}
    />
  )
}
