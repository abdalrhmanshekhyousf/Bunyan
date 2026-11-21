import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/utils/cn.js'
import i18n from '@/lib/i18n.js'

// حقول تحرير صغيرة مشتركة بين أقسام التحليل
const base =
  'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-teal focus:ring-2 focus:ring-teal/30 focus:outline-none dark:border-slate-700 dark:bg-slate-950'

export function TextField({ value, onChange, label, ltr, className, multiline }) {
  const props = {
    value: value ?? '',
    onChange: (e) => onChange(e.target.value),
    'aria-label': label,
    placeholder: label,
    dir: ltr ? 'ltr' : undefined,
    className: cn(base, ltr && 'font-mono text-xs', className),
  }
  return multiline ? <textarea rows={2} {...props} /> : <input {...props} />
}

export function SelectField({ value, onChange, label, options, className }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={cn(base, 'w-auto', className)}
    >
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  )
}

export function RemoveButton({ onClick, label = i18n.t('analysis:edit.remove') }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
    >
      <Trash2 className="size-4" />
    </button>
  )
}

export function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 self-start rounded-lg px-2 py-1.5 text-sm font-semibold text-navy hover:bg-navy/5 dark:text-teal dark:hover:bg-teal/10"
    >
      <Plus className="size-4" />
      {children}
    </button>
  )
}

export function Mono({ children }) {
  return (
    <code
      dir="ltr"
      className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
    >
      {children}
    </code>
  )
}
