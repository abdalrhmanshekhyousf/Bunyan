import { useEffect, useState } from 'react'
import { BookOpen, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, Skeleton } from '@/components/ui/index.js'
import { formatDate } from '@/features/projects/status.js'
import { librarySamples } from '@/features/projects/sampleProject.js'
import {
  createTemplate,
  deleteTemplate,
  setTemplatePublished,
  watchTemplates,
} from './adminService.js'
import TemplateModal from './TemplateModal.jsx'

// إدارة القوالب: إضافة وتعديل وحذف ونشر (T8.4)
export default function TemplatesManager() {
  const { t, i18n } = useTranslation('admin')
  const [state, setState] = useState({ templates: [], loading: true, error: null })
  const [editing, setEditing] = useState(undefined) // undefined مغلق، null جديد، كائن للتعديل
  const [busy, setBusy] = useState(null)

  useEffect(
    () =>
      watchTemplates(
        (templates) => setState({ templates, loading: false, error: null }),
        (error) => {
          console.error('watchTemplates:', error.code, error.message)
          setState((s) => ({ ...s, loading: false, error }))
        },
      ),
    [],
  )

  async function run(id, action) {
    setBusy(id)
    try {
      await action()
    } catch (e) {
      console.error('template action:', e.code, e.message)
      toast.error(t('templates.actionFailed'))
    } finally {
      setBusy(null)
    }
  }

  const importSample = () =>
    run('sample', async () => {
      const lang = i18n.language === 'en' ? 'en' : 'ar'
      await createTemplate({ ...librarySamples[lang], language: lang, published: true })
      toast.success(t('templates.saved'))
    })

  const remove = (tpl) => {
    if (!confirm(t('templates.confirmDelete', { title: tpl.title }))) return
    run(tpl.id, async () => {
      await deleteTemplate(tpl.id)
      toast.success(t('templates.deleted'))
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('templates.intro')}</p>
        <Button onClick={() => setEditing(null)} className="shrink-0">
          <Plus className="size-5" />
          {t('templates.add')}
        </Button>
      </div>

      {state.error ? (
        <Card className="border-red-200 text-red-700 dark:border-red-900 dark:text-red-300">
          {t('templates.loadFailed')}
        </Card>
      ) : state.loading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : state.templates.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-slate-600 dark:text-slate-400">{t('templates.empty')}</p>
          <Button variant="secondary" onClick={importSample} loading={busy === 'sample'}>
            <BookOpen className="size-4" />
            {t('templates.importSample')}
          </Button>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {state.templates.map((tpl) => (
            <li key={tpl.id}>
              <Card className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-lg font-bold" dir="auto">
                    {tpl.title}
                  </h3>
                  <div className="flex shrink-0 gap-1">
                    <Badge tone="navy">{tpl.language === 'en' ? 'EN' : 'ع'}</Badge>
                    <Badge tone={tpl.published ? 'teal' : 'slate'}>
                      {t(tpl.published ? 'templates.published' : 'templates.draft')}
                    </Badge>
                  </div>
                </div>
                <p
                  className="line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                  dir="auto"
                >
                  {tpl.description}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">{formatDate(tpl.updatedAt)}</span>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={busy === tpl.id}
                      onClick={() =>
                        run(tpl.id, () => setTemplatePublished(tpl.id, !tpl.published))
                      }
                    >
                      {tpl.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      {t(tpl.published ? 'templates.unpublish' : 'templates.publish')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(tpl)}>
                      <Pencil className="size-4" />
                      {t('templates.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(tpl)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="size-4" />
                      {t('templates.delete')}
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <TemplateModal
        open={editing !== undefined}
        template={editing}
        onClose={() => setEditing(undefined)}
      />
    </div>
  )
}
