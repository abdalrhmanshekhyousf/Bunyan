import { useEffect, useMemo, useRef, useState } from 'react'
import { Code2, Download, Info, Network, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, Modal, Skeleton, Tabs } from '@/components/ui/index.js'
import { useDebounce } from '@/hooks/useDebounce.js'
import { useIsDark } from '@/hooks/useIsDark.js'
import { buildAll } from '@/utils/toMermaid.js'
import { useAnalyses } from '@/features/analysis/useAnalysis.js'
import MermaidView from './MermaidView.jsx'
import { DIAGRAMS } from './diagramInfo.js'
import { resetDiagram, saveDiagram, watchDiagrams } from './diagramsService.js'
import { downloadPng, downloadSvg } from './download.js'

export default function DiagramsPanel({ project, readOnly }) {
  const { current, loading } = useAnalyses(project)
  const [saved, setSaved] = useState({})
  const [type, setType] = useState('useCase')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
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
  if (!current)
    return <Card className="py-12 text-center text-slate-500">حلّل الوصف أولاً لتُرسم المخططات.</Card>

  const info = DIAGRAMS.find((d) => d.id === type)
  const edited = saved[type]
  const code = edited?.code ?? generated[type]
  const shown = editing ? preview : code
  const fileName = `${project.title}-${info.label}`.replace(/[\\/:*?"<>|]+/g, '-')

  function switchType(t) {
    if (editing && draft !== code && !confirm('ستضيع تعديلاتك غير المحفوظة. هل تتابع؟')) return
    setEditing(false)
    setType(t)
  }

  async function onSave() {
    try {
      await saveDiagram(project.id, type, { code: draft, analysisId: current.id })
      toast.success('حُفظ المخطط.')
      setEditing(false)
    } catch {
      toast.error('تعذّر حفظ المخطط.')
    }
  }

  async function onReset() {
    await resetDiagram(project.id, type)
    setConfirmReset(false)
    setEditing(false)
    toast.success('أُعيد توليد المخطط من التحليل.')
  }

  async function onDownload(kind) {
    if (!svgRef.current) return
    const bg = dark ? '#0f172a' : '#ffffff'
    try {
      if (kind === 'svg') downloadSvg(svgRef.current, fileName, bg)
      else await downloadPng(svgRef.current, fileName, bg)
    } catch {
      toast.error('تعذّر تنزيل الصورة؛ جرّب صيغة SVG.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        items={DIAGRAMS.map(({ id, label, icon }) => ({ id, label, icon }))}
        value={type}
        onChange={switchType}
        className="no-print"
      />

      <Card className="flex flex-col gap-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">مخطط {info.label}</h3>
            {edited && <Badge tone="amber">معدَّل يدوياً</Badge>}
            {edited && edited.analysisId !== current.id && (
              <Badge tone="red">عُدِّل على إصدار تحليل أقدم</Badge>
            )}
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              aria-expanded={showInfo}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Info className="size-4" />
              ما هذا المخطط؟
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
                  تحرير الشيفرة
                </Button>
              )}
              {!readOnly && edited && !editing && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="size-4" />
                  إعادة التوليد
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
              ['ما هو؟', info.what],
              ['متى يُستعمل؟', info.when],
              ['رموزه', info.symbols],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-semibold text-navy dark:text-teal">{k}</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-300">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {!code ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
            <Network className="size-10" />
            لا توجد في التحليل بيانات كافية لهذا المخطط. أضفها من تبويب «التحليل».
          </div>
        ) : editing ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                dir="ltr"
                spellCheck={false}
                aria-label="شيفرة Mermaid"
                className="h-[min(70vh,640px)] w-full resize-none rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-sm leading-relaxed text-slate-100 focus:border-teal focus:outline-none dark:border-slate-700"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  إلغاء
                </Button>
                <Button onClick={onSave}>حفظ المخطط</Button>
              </div>
            </div>
            <MermaidView code={shown} svgRef={svgRef} label={info.label} />
          </div>
        ) : (
          <MermaidView code={shown} svgRef={svgRef} label={`مخطط ${info.label}`} />
        )}
        {code && !editing && (
          <p className="no-print text-xs text-slate-500">
            اسحب لتحريك المخطط، واستعمل Ctrl مع عجلة الفأرة أو الأزرار للتكبير، وانقر مرتين
            للملاءمة.
          </p>
        )}
      </Card>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="إعادة توليد المخطط"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={onReset}>
              إعادة التوليد
            </Button>
          </>
        }
      >
        <p className="leading-relaxed">
          عدّلتَ هذا المخطط يدوياً. ستُحذف تعديلاتك ويُرسم من جديد من نتيجة التحليل الحالية.
        </p>
      </Modal>
    </div>
  )
}
