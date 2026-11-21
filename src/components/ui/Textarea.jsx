import { useId } from 'react'
import { cn } from '@/utils/cn.js'
import { Field, fieldClass } from './Input.jsx'

export default function Textarea({ label, error, hint, className, id, rows = 6, ...props }) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <Field label={label} error={error} hint={hint} id={inputId}>
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={!!error}
        className={cn(fieldClass, 'resize-y leading-relaxed', className)}
        {...props}
      />
    </Field>
  )
}
