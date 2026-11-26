import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/index.js'

// يظهر بدل صفحة الخطأ الإنجليزية الافتراضية للموجّه، حين تفشل صفحة في التحميل حتى بعد إعادة المحاولة
export default function RouteError() {
  const { t } = useTranslation('common')
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">{t('routeError.title')}</h1>
      <p className="max-w-md text-slate-600 dark:text-slate-400">{t('routeError.body')}</p>
      <Button onClick={() => window.location.reload()}>{t('routeError.reload')}</Button>
    </div>
  )
}
