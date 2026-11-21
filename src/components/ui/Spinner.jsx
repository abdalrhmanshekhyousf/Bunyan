import { cn } from '@/utils/cn.js'

export default function Spinner({ className, label = 'جارٍ التحميل' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-current border-e-transparent',
        className,
      )}
    />
  )
}
