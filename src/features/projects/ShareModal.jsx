import { useState } from 'react'
import { Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Modal } from '@/components/ui/index.js'
import { fieldClass } from '@/components/ui/Input.jsx'
import { setShared } from './projectsService.js'

// مشاركة المشروع برابط للقراءة فقط (T3.10 + T3.12)
export default function ShareModal({ project, open, onClose }) {
  const [busy, setBusy] = useState(false)
  const url = `${location.origin}/share/${project.id}`

  async function toggle() {
    setBusy(true)
    try {
      await setShared(project.id, !project.isShared)
      toast.success(project.isShared ? 'أُوقفت المشاركة.' : 'أصبح المشروع مشترَكاً.')
    } catch {
      toast.error('تعذّر تغيير حالة المشاركة.')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('نُسخ الرابط.')
    } catch {
      toast.error('تعذّر النسخ؛ انسخ الرابط يدوياً.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="مشاركة المشروع">
      <p className="leading-relaxed text-slate-600 dark:text-slate-400">
        يستطيع أي مستخدم مسجّل في بُنيان يملك الرابط أن يطّلع على المشروع ونتائجه، دون أن يعدّل شيئاً.
      </p>
      {project.isShared ? (
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              readOnly
              dir="ltr"
              value={url}
              aria-label="رابط المشاركة"
              className={`${fieldClass} h-10 text-sm`}
            />
            <Button onClick={copy} aria-label="نسخ الرابط">
              <Copy className="size-4" />
              نسخ
            </Button>
          </div>
          <Button variant="danger" onClick={toggle} loading={busy} className="self-start">
            إيقاف المشاركة
          </Button>
        </div>
      ) : (
        <Button onClick={toggle} loading={busy} className="mt-5">
          <Link2 className="size-4" />
          تفعيل رابط المشاركة
        </Button>
      )}
    </Modal>
  )
}
