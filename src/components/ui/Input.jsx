import { useId } from 'react'
import { cn } from '@/utils/cn.js'

export const fieldClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-ink placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 aria-[invalid=true]:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

// غلاف الحقل: عنوان + رسالة خطأ أو تلميح
export function Field({ label, error, hint, id, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-slate-500">{hint}</p>
      )}
    </div>
  )
}

// يقبل ref مباشرة (React 19)، فيعمل مع register في React Hook Form
export default function Input({ label, error, hint, className, id, ...props }) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <Field label={label} error={error} hint={hint} id={inputId}>
      <input
        id={inputId}
        aria-invalid={!!error}
        className={cn(fieldClass, 'h-10', className)}
        {...props}
      />
    </Field>
  )
}
