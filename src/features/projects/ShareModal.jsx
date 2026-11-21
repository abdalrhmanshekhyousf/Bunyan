import { useState } from 'react'
import { Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button, Modal } from '@/components/ui/index.js'
import { fieldClass } from '@/components/ui/Input.jsx'
import { setShared } from './projectsService.js'

// مشاركة المشروع برابط للقراءة فقط (T3.10 + T3.12)
export default function ShareModal({ project, open, onClose }) {
  const { t } = useTranslation('projects')
  const [busy, setBusy] = useState(false)
  const url = `${location.origin}/share/${project.id}`

  async function toggle() {
    setBusy(true)
    try {
      await setShared(project.id, !project.isShared)
      toast.success(t(project.isShared ? 'share.stopped' : 'share.started'))
    } catch {
      toast.error(t('share.toggleFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t('share.copied'))
    } catch {
      toast.error(t('share.copyFailed'))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('share.title')}>
      <p className="leading-relaxed text-slate-600 dark:text-slate-400">{t('share.text')}</p>
      {project.isShared ? (
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              readOnly
              dir="ltr"
              value={url}
              aria-label={t('share.link')}
              className={`${fieldClass} h-10 text-sm`}
            />
            <Button onClick={copy} aria-label={t('share.copyLink')}>
              <Copy className="size-4" />
              {t('share.copy')}
            </Button>
          </div>
          <Button variant="danger" onClick={toggle} loading={busy} className="self-start">
            {t('share.stop')}
          </Button>
        </div>
      ) : (
        <Button onClick={toggle} loading={busy} className="mt-5">
          <Link2 className="size-4" />
          {t('share.start')}
        </Button>
      )}
    </Modal>
  )
}
