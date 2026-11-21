import { useEffect, useMemo, useRef, useState } from 'react'
import { Code2, Download, Info, Loader2, Network, RotateCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, Modal, Skeleton } from '@/components/ui/index.js'
import { useAuth } from '@/hooks/useAuth.js'
import { cn } from '@/utils/cn.js'
import { useDebounce } from '@/hooks/useDebounce.js'
import { useIsDark } from '@/hooks/useIsDark.js'
import { buildAll, needsDesign } from '@/utils/diagramRegistry.js'
import { addDesignToAnalysis } from '@/features/analysis/analysisService.js'
import { useAnalyses } from '@/features/analysis/useAnalysis.js'
import MermaidView from './MermaidView.jsx'
import { DIAGRAMS, GROUPS } from './diagramInfo.js'
import { resetDiagram, saveDiagram, watchDiagrams } from './diagramsService.js'
import { downloadPng, downloadSvg } from './download.js'

export default function DiagramsPanel({ project, readOnly }) {
  const { t } = useTranslation('diagrams')
  const { current, loading } = useAnalyses(project)
  const [saved, setSaved] = useState({})
  const [type, setType] = useState('useCase')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [designBusy, setDesignBusy] = useState(false)
  const { user } = useAuth()
  const svgRef = useRef(null)
  const dark = useIsDark()

  useEffect(() => watchDiagrams(project.id, setSaved), [project.id])

  const generated = useMemo(
    () => (current ? buildAll(current.data, { title: project.title, lang: project.language }) : {}),
    [current, project.title, project.language],
  )

  // معاينة حيّة أثناء التحرير بعد توقف الكتابة
  const preview = useDebounce(draft, 600)

  if (loading) return <Skeleton className="h-96 rounded-2xl" />
  if (!current) return <Card className="py-12 text-center text-slate-500">{t('analyzeFirst')}</Card>

  const label = t(`types.${type}.label`)
  const edited = saved[type]
  const code = edited?.code ?? generated[type]
  const shown = editing ? preview : code
  const fileName = `${project.title}-${label}`.replace(/[\\/:*?"<>|]+/g, '-')

  function switchType(next) {
    if (editing && draft !== code && !confirm(t('confirmDiscard'))) return
    setEditing(false)
    setType(next)
  }

  async function onSave() {
    try {
      await saveDiagram(project.id, type, { code: draft, analysisId: current.id })
      toast.success(t('toast.saved'))
      setEditing(false)
    } catch {
      toast.error(t('toast.saveFailed'))
    }
  }

  async function onReset() {
    await resetDiagram(project.id, type)
    setConfirmReset(false)
    setEditing(false)
    toast.success(t('toast.regenerated'))
  }

  const designPending = designBusy || isFreshPending(current)

  async function onGenerateDesign() {
    setDesignBusy(true)
    try {
      await addDesignToAnalysis({ project, uid: user.uid, analysis: current })
      toast.success(t('toast.designDone'))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setDesignBusy(false)
    }
  }

  async function onDownload(kind) {
    if (!svgRef.current) return
    const bg = dark ? '#0f172a' : '#ffffff'
    try {
      if (kind === 'svg') downloadSvg(svgRef.current, fileName, bg)
      else await downloadPng(svgRef.current, fileName, bg)
    } catch {
      toast.error(t('toast.downloadFailed'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <DiagramPicker value={type} onChange={switchType} available={generated} saved={saved} />

      <Card className="flex flex-col gap-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{t('title', { label })}</h3>
            {edited && <Badge tone="amber">{t('badges.edited')}</Badge>}
            {edited && edited.analysisId !== current.id && (
              <Badge tone="red">{t('badges.staleEdit')}</Badge>
            )}
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              aria-expanded={showInfo}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Info className="size-4" />
              {t('info.toggle')}
            </button>
          </div>
          {code && (
            <div className="flex flex-wrap gap-2">
              {!readOnly && !editing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraft(code)
                    setEditing(true)
                  }}
                >
                  <Code2 className="size-4" />
                  {t('actions.editCode')}
                </Button>
              )}
              {!readOnly && edited && !editing && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="size-4" />
                  {t('actions.regenerate')}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => onDownload('svg')}>
                <Download className="size-4" />
                SVG
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onDownload('png')}>
                <Download className="size-4" />
                PNG
              </Button>
            </div>
          )}
        </div>

        {showInfo && (
          <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed sm:grid-cols-3 dark:bg-slate-800/50">
            {[
              ['what', 'what'],
              ['when', 'when'],
              ['symbols', 'symbols'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-semibold text-navy dark:text-teal">{t(`info.${k}`)}</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-300">
                  {t(`types.${type}.${v}`)}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {!code && needsDesign(type) && designPending ? (
          <div
            role="status"
            className="flex flex-col items-center gap-3 py-14 text-center text-slate-500"
          >
            <Loader2 className="size-10 animate-spin text-teal" />
            <p className="font-semibold">{t('design.pendingTitle')}</p>
            <p className="text-sm">{t('design.pendingHint')}</p>
          </div>
        ) : !code && needsDesign(type) ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-slate-500">
            <Sparkles className="size-10 text-teal" />
            <p className="max-w-md">
              {current.designStatus === 'error' || current.designStatus === 'pending'
                ? t('design.failed')
                : t('design.missing')}
            </p>
            {!readOnly && (
              <Button onClick={onGenerateDesign} loading={designBusy}>
                <Sparkles className="size-4" />
                {t('design.generate')}
              </Button>
            )}
          </div>
        ) : !code ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
            <Network className="size-10" />
            {t('noData')}
          </div>
        ) : editing ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                dir="ltr"
                spellCheck={false}
                aria-label={t('codeLabel')}
                className="h-[min(70vh,640px)] w-full resize-none rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-sm leading-relaxed text-slate-100 focus:border-teal focus:outline-none dark:border-slate-700"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button onClick={onSave}>{t('actions.save')}</Button>
              </div>
            </div>
            <MermaidView code={shown} svgRef={svgRef} label={label} />
          </div>
        ) : (
          <MermaidView code={shown} svgRef={svgRef} label={t('title', { label })} />
        )}
        {code && !editing && <p className="no-print text-xs text-slate-500">{t('hint')}</p>}
      </Card>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t('resetModal.title')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="danger" onClick={onReset}>
              {t('resetModal.confirm')}
            </Button>
          </>
        }
      >
        <p className="leading-relaxed">{t('resetModal.body')}</p>
      </Modal>
    </div>
  )
}

// «pending» أقدم من 4 دقائق (أُغلق التبويب أثناء التوليد) تُعدّ فشلاً
function isFreshPending(analysis) {
  if (analysis.designStatus !== 'pending') return false
  const created = analysis.createdAt?.toMillis?.() ?? Date.now()
  return Date.now() - created < 4 * 60_000
}

// اختيار المخطط: شبكة تلتفّ على كل العروض فيظهر المخططات الأحد عشر كلها دون تمرير
function DiagramPicker({ value, onChange, available, saved }) {
  const { t } = useTranslation('diagrams')
  return (
    <div className="no-print grid gap-3 md:grid-cols-2">
      {GROUPS.map((group) => {
        const title = t(`groups.${group}`)
        return (
          <Card key={group} className="flex flex-col gap-2 p-3">
            <p className="px-1 text-xs font-semibold text-slate-500">{title}</p>
            <div role="tablist" aria-label={title} className="flex flex-wrap gap-1.5">
              {DIAGRAMS.filter((d) => d.group === group).map(({ id, icon: Icon }) => {
                const active = id === value
                const ready = !!(saved[id]?.code ?? available[id])
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onChange(id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                      active
                        ? 'bg-navy text-white dark:bg-teal dark:text-ink'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                      !ready && !active && 'opacity-60',
                    )}
                  >
                    <Icon className="size-4" />
                    {t(`types.${id}.label`)}
                  </button>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
