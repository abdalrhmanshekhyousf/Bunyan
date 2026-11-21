import { useState } from 'react'
import {
  BookCheck,
  Boxes,
  BrainCircuit,
  GitBranch,
  History,
  ListChecks,
  Pencil,
  Scale,
  Users,
  Workflow,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, Modal, Skeleton } from '@/components/ui/index.js'
import { formatDate } from '@/features/projects/status.js'
import { restoreVersion, saveEditedAnalysis } from './analysisService.js'
import { useAnalyses } from './useAnalysis.js'
import AnalyzeButton from './AnalyzeButton.jsx'
import * as S from './sections.jsx'

const SECTIONS = [
  { key: 'requirements', title: 'المتطلبات', icon: ListChecks, C: S.Requirements, wide: true },
  { key: 'actors', title: 'الفاعلون', icon: Users, C: S.Actors },
  { key: 'functions', title: 'حالات الاستخدام', icon: Workflow, C: S.Functions },
  { key: 'entities', title: 'الكيانات', icon: Boxes, C: S.Entities, wide: true },
  { key: 'relationships', title: 'العلاقات', icon: GitBranch, C: S.Relationships },
  { key: 'rules', title: 'قواعد العمل', icon: Scale, C: S.Rules },
]

export default function AnalysisPanel({ project, readOnly }) {
  const { current, versions, loading } = useAnalyses(project)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  if (loading)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    )

  if (!current)
    return (
      <Card className="flex flex-col items-center gap-4 py-14 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-navy/10 text-navy dark:bg-teal/15 dark:text-teal">
          <BrainCircuit className="size-8" />
        </span>
        <h2 className="text-xl font-bold">لم يُحلَّل هذا المشروع بعد</h2>
        <p className="max-w-md text-slate-600 dark:text-slate-400">
          يقرأ بُنيان الوصف ويستخرج منه المتطلبات والفاعلين والكيانات والعلاقات وقواعد العمل.
        </p>
        {!readOnly && (
          <div className="flex justify-center">
            <AnalyzeButton project={project} />
          </div>
        )}
      </Card>
    )

  const editing = draft != null
  const a = editing ? draft : current.data
  const setSection = (key) => (items) => setDraft((d) => ({ ...d, [key]: items }))

  async function save() {
    setSaving(true)
    try {
      await saveEditedAnalysis(project, draft)
      toast.success('حُفظت التعديلات كإصدار جديد.')
      setDraft(null)
    } catch {
      toast.error('تعذّر حفظ التعديلات. تحقّق من الحقول ثم أعد المحاولة.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="navy">الإصدار {current.version}</Badge>
          <Badge tone={current.source === 'user' ? 'amber' : 'teal'}>
            {current.source === 'user' ? 'معدَّل يدوياً' : 'من الذكاء الاصطناعي'}
          </Badge>
          <span className="text-slate-500">{formatDate(current.createdAt)}</span>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap items-start gap-2">
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
                  إلغاء
                </Button>
                <Button onClick={save} loading={saving}>
                  حفظ التعديلات
                </Button>
              </>
            ) : (
              <>
                {versions.length > 1 && (
                  <Button variant="ghost" onClick={() => setHistoryOpen(true)}>
                    <History className="size-4" />
                    الإصدارات ({versions.length})
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setDraft(structuredClone(current.data))}>
                  <Pencil className="size-4" />
                  تعديل
                </Button>
                <AnalyzeButton project={project} variant="secondary" />
              </>
            )}
          </div>
        )}
      </Card>

      {a.summary && !editing && (
        <Card className="border-s-4 border-s-teal">
          <h3 className="flex items-center gap-2 font-bold">
            <BookCheck className="size-5 text-teal" />
            ملخص النظام
          </h3>
          <p className="mt-2 leading-loose">{a.summary}</p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map(({ key, title, icon, C, wide }) => (
          <S.Section
            key={key}
            title={title}
            icon={icon}
            count={a[key].length}
            className={wide ? 'md:col-span-2' : ''}
          >
            <C items={a[key]} edit={editing} onChange={setSection(key)} a={a} />
          </S.Section>
        ))}
      </div>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="سجل الإصدارات">
        <ul className="flex flex-col gap-2">
          {versions.map((v) => {
            const isCurrent = v.id === current.id
            return (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">
                    الإصدار {v.version}
                    {isCurrent && (
                      <Badge tone="teal" className="ms-2">
                        الحالي
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-slate-500">
                    {v.source === 'user' ? 'تعديل يدوي' : 'تحليل آلي'} · {formatDate(v.createdAt)} ·{' '}
                    {v.data.entities.length} كيانات
                  </span>
                </div>
                {!isCurrent && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await restoreVersion(project, v)
                      toast.success(`استُعيد الإصدار ${v.version}.`)
                      setHistoryOpen(false)
                    }}
                  >
                    استعادة
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </Modal>
    </div>
  )
}
