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
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, Modal, Skeleton } from '@/components/ui/index.js'
import { formatDate } from '@/features/projects/status.js'
import { restoreVersion, saveEditedAnalysis } from './analysisService.js'
import { useAnalyses } from './useAnalysis.js'
import AnalyzeButton from './AnalyzeButton.jsx'
import * as S from './sections.jsx'

const SECTIONS = [
  {
    key: 'requirements',
    title: 'sections.requirements',
    icon: ListChecks,
    C: S.Requirements,
    wide: true,
  },
  { key: 'actors', title: 'sections.actors', icon: Users, C: S.Actors },
  { key: 'functions', title: 'sections.functions', icon: Workflow, C: S.Functions },
  { key: 'entities', title: 'sections.entities', icon: Boxes, C: S.Entities, wide: true },
  { key: 'relationships', title: 'sections.relationships', icon: GitBranch, C: S.Relationships },
  { key: 'rules', title: 'sections.rules', icon: Scale, C: S.Rules },
]

export default function AnalysisPanel({ project, readOnly }) {
  const { t } = useTranslation('analysis')
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
        <h2 className="text-xl font-bold">{t('empty.title')}</h2>
        <p className="max-w-md text-slate-600 dark:text-slate-400">{t('empty.text')}</p>
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
      toast.success(t('edit.saved'))
      setDraft(null)
    } catch {
      toast.error(t('edit.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="navy">{t('version', { version: current.version })}</Badge>
          <Badge tone={current.source === 'user' ? 'amber' : 'teal'}>
            {t(current.source === 'user' ? 'source.user' : 'source.ai')}
          </Badge>
          <span className="text-slate-500">{formatDate(current.createdAt)}</span>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap items-start gap-2">
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
                  {t('edit.cancel')}
                </Button>
                <Button onClick={save} loading={saving}>
                  {t('edit.save')}
                </Button>
              </>
            ) : (
              <>
                {versions.length > 1 && (
                  <Button variant="ghost" onClick={() => setHistoryOpen(true)}>
                    <History className="size-4" />
                    {t('history.button', { count: versions.length })}
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setDraft(structuredClone(current.data))}>
                  <Pencil className="size-4" />
                  {t('edit.start')}
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
            {t('summary')}
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

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title={t('history.title')}>
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
                    {t('version', { version: v.version })}
                    {isCurrent && (
                      <Badge tone="teal" className="ms-2">
                        {t('history.current')}
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t(v.source === 'user' ? 'history.manual' : 'history.auto')} ·{' '}
                    {formatDate(v.createdAt)} ·{' '}
                    {t('history.entities', { count: v.data.entities.length })}
                  </span>
                </div>
                {!isCurrent && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await restoreVersion(project, v)
                      toast.success(t('history.restored', { version: v.version }))
                      setHistoryOpen(false)
                    }}
                  >
                    {t('history.restore')}
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
