import { cn } from '@/utils/cn.js'

export default function Card({ as: Comp = 'div', className, children, ...props }) {
  return (
    <Comp
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}
