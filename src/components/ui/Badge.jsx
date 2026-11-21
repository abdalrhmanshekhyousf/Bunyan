import { cn } from '@/utils/cn.js'

const tones = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  navy: 'bg-navy/10 text-navy dark:bg-navy/40 dark:text-indigo-200',
  teal: 'bg-teal/15 text-teal-600 dark:text-teal',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
}

export default function Badge({ tone = 'slate', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
