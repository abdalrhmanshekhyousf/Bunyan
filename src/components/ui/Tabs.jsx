import { cn } from '@/utils/cn.js'

// تبويبات مُتحكَّم بها: items = [{ id, label, icon }]
export default function Tabs({ items, value, onChange, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60',
        className,
      )}
    >
      {items.map(({ id, label, icon: Icon }) => {
        const active = id === value
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              active
                ? 'bg-white text-navy shadow-sm dark:bg-slate-900 dark:text-teal'
                : 'text-slate-600 hover:text-ink dark:text-slate-400 dark:hover:text-slate-100',
            )}
          >
            {Icon && <Icon className="size-4" />}
            {label}
          </button>
        )
      })}
    </div>
  )
}
