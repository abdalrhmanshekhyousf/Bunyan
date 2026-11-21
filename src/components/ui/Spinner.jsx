import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn.js'

export default function Spinner({ className, label }) {
  const { t } = useTranslation()
  return (
    <span
      role="status"
      aria-label={label ?? t('loading')}
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-current border-e-transparent',
        className,
      )}
    />
  )
}
