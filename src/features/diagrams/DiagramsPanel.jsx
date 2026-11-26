import { useEffect, useMemo, useRef, useState } from 'react'
import { Code2, Download, Loader2, Network, PanelRight, RotateCcw, Sparkles } from 'lucide-react'
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
  const [showInfo, setShowInfo] = useState(true) // لوحة الخصائص ظاهرة افتراضياً كما في draw.io
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

  const readyCount = DIAGRAMS.filter(({ id }) => saved[id]?.code ?? generated[id]).length

  // محرّر بأسلوب draw.io: شريط أدوات في الأعلى، ومكتبة المخططات جانباً، ولوحة رسم شبكية في الوسط،
  // ولوحة خصائص في الجانب الآخر (تعريف المخطط، أو شيفرته أثناء التحرير)، وشريط حالة في الأسفل
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* شريط الأدوات */}
      <div className="no-print flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="truncate font-bold">{t('title', { label })}</h3>
          {edited && <Badge tone="amber">{t('badges.edited')}</Badge>}
          {edited && edited.analysisId !== current.id && (
            <Badge tone="red">{t('badges.staleEdit')}</Badge>
          )}
        </div>
        <div className="ms-auto flex flex-wrap items-center gap-1">
          {code && !readOnly && !editing && (
            <ToolBtn
              icon={Code2}
              label={t('actions.editCode')}
              onClick={() => {
                setDraft(code)
                setEditing(true)
                setShowInfo(true)
              }}
            />
          )}
          {code && !readOnly && edited && !editing && (
            <ToolBtn
              icon={RotateCcw}
              label={t('actions.regenerate')}
              onClick={() => setConfirmReset(true)}
            />
          )}
          {code && (
            <>
              <Divider />
              <ToolBtn icon={Download} label="SVG" onClick={() => onDownload('svg')} />
              <ToolBtn icon={Download} label="PNG" onClick={() => onDownload('png')} />
            </>
          )}
          <Divider />
          <ToolBtn
            icon={PanelRight}
            label={t('editor.format')}
            onClick={() => setShowInfo((v) => !v)}
            pressed={showInfo}
          />
        </div>
      </div>

      <div className="flex flex-col lg:h-[min(78vh,760px)] lg:flex-row">
        <DiagramLibrary value={type} onChange={switchType} available={generated} saved={saved} />

        {/* لوحة الرسم */}
        <div className="relative min-h-[24rem] min-w-0 flex-1">
          {!code && needsDesign(type) && designPending ? (
            <CanvasMessage>
              <Loader2 className="size-10 animate-spin text-teal" />
              <p className="font-semibold">{t('design.pendingTitle')}</p>
              <p className="text-sm">{t('design.pendingHint')}</p>
            </CanvasMessage>
          ) : !code && needsDesign(type) ? (
            <CanvasMessage>
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
            </CanvasMessage>
          ) : !code ? (
            <CanvasMessage>
              <Network className="size-10" />
              {t('noData')}
            </CanvasMessage>
          ) : (
            <div className="absolute inset-0 max-lg:static max-lg:h-[min(70vh,560px)]">
              <MermaidView
                canvas
                code={shown}
                svgRef={svgRef}
                label={editing ? label : t('title', { label })}
              />
            </div>
          )}
        </div>

        {/* لوحة الخصائص */}
        {(showInfo || editing) && (
          <aside
            className={cn(
              'no-print flex shrink-0 flex-col overflow-y-auto border-t border-slate-200 lg:border-s lg:border-t-0 dark:border-slate-800',
              editing ? 'lg:w-[26rem]' : 'lg:w-72',
            )}
          >
            <PanelHeading>{editing ? t('codeLabel') : t('editor.format')}</PanelHeading>
            {editing ? (
              <div className="flex flex-1 flex-col gap-2 p-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  dir="ltr"
                  spellCheck={false}
                  aria-label={t('codeLabel')}
                  className="min-h-80 w-full flex-1 resize-none rounded-lg border border-slate-300 bg-slate-950 p-3 font-mono text-[13px] leading-relaxed text-slate-100 focus:border-teal focus:outline-none dark:border-slate-700"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button size="sm" onClick={onSave}>
                    {t('actions.save')}
                  </Button>
                </div>
              </div>
            ) : (
              <dl className="flex flex-col text-sm leading-relaxed">
                {['what', 'when', 'symbols'].map((k) => (
                  <div
                    key={k}
                    className="border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800"
                  >
                    <dt className="text-xs font-semibold text-navy uppercase dark:text-teal">
                      {t(`info.${k}`)}
                    </dt>
                    <dd className="mt-1 text-slate-600 dark:text-slate-300">
                      {t(`types.${type}.${k}`)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </aside>
        )}
      </div>

      {/* شريط الحالة */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        <span>{code && !editing ? t('hint') : t('editor.livePreview')}</span>
        <span className="tabular-nums">
          {t('editor.ready', { count: readyCount, total: DIAGRAMS.length })}
        </span>
      </div>

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

function ToolBtn({ icon: Icon, label, onClick, pressed }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      title={label}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800',
        pressed && 'bg-slate-200 text-navy dark:bg-slate-800 dark:text-teal',
      )}
    >
      <Icon className="size-4" />
      <span className="max-sm:sr-only">{label}</span>
    </button>
  )
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-700" />

const PanelHeading = ({ children }) => (
  <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900">
    {children}
  </p>
)

const CanvasMessage = ({ children }) => (
  <div className="canvas-grid flex h-full min-h-[24rem] flex-col items-center justify-center gap-3 p-6 text-center text-slate-500">
    {children}
  </div>
)

// مكتبة المخططات (كلوحة الأشكال في draw.io): قائمة عمودية مقسّمة إلى مجموعات على الشاشات الواسعة،
// وشريط أفقي قابل للتمرير على الهاتف. الأزرار role="tab" كي تبقى الاختبارات وقارئات الشاشة كما هي
function DiagramLibrary({ value, onChange, available, saved }) {
  const { t } = useTranslation('diagrams')
  return (
    <nav
      aria-label={t('editor.library')}
      className="no-print flex shrink-0 gap-3 overflow-x-auto border-b border-slate-200 bg-slate-50 p-2 lg:w-56 lg:flex-col lg:gap-1 lg:overflow-y-auto lg:border-e lg:border-b-0 dark:border-slate-800 dark:bg-slate-900"
    >
      {GROUPS.map((group) => {
        const title = t(`groups.${group}`)
        return (
          <div key={group} className="flex shrink-0 flex-col gap-1 lg:mb-2">
            <p className="hidden px-2 pt-1 pb-0.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase lg:block">
              {title}
            </p>
            <div role="tablist" aria-label={title} className="flex gap-1 lg:flex-col">
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
                      'flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-start text-sm whitespace-nowrap transition-colors',
                      active
                        ? 'bg-navy font-semibold text-white dark:bg-teal dark:text-ink'
                        : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800',
                      !ready && !active && 'opacity-55',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1">{t(`types.${id}.label`)}</span>
                    {saved[id]?.code && (
                      <span
                        aria-hidden
                        className={cn(
                          'size-1.5 rounded-full',
                          active ? 'bg-white dark:bg-ink' : 'bg-amber-500',
                        )}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
