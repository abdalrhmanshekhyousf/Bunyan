import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button.jsx'

// مبدّل العربية/الإنجليزية (T1.10 + T1.11)
export default function LanguageToggle() {
  const { t, i18n } = useTranslation()
  const next = i18n.language === 'ar' ? 'en' : 'ar'
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => i18n.changeLanguage(next)}
      aria-label={t('language.switch')}
      title={t('language.switch')}
      className="gap-1.5 px-2"
    >
      <Languages className="size-5" />
      <span lang={next}>{next === 'ar' ? 'ع' : 'EN'}</span>
    </Button>
  )
}
