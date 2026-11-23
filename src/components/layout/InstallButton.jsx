import { useSyncExternalStore } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button.jsx'
import { canInstall, promptInstall, subscribeInstall } from '@/lib/pwa.js'

// زر «تثبيت التطبيق»: يظهر فقط حين يسمح المتصفح بالتثبيت ولم يُثبَّت التطبيق بعد
export default function InstallButton() {
  const { t } = useTranslation()
  const available = useSyncExternalStore(subscribeInstall, canInstall, () => false)
  if (!available) return null

  async function install() {
    if (await promptInstall()) toast.success(t('install.done'))
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={install}
      aria-label={t('install.label')}
      title={t('install.hint')}
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">{t('install.label')}</span>
    </Button>
  )
}
