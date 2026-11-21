import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { FileDown, Loader2, Save, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, Skeleton } from '@/components/ui/index.js'
import { fieldClass } from '@/components/ui/Input.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { useAnalyses } from '@/features/analysis/useAnalysis.js'
import { watchDiagrams } from '@/features/diagrams/diagramsService.js'
import { renderMermaid } from '@/features/diagrams/renderMermaid.js'
import { DIAGRAMS } from '@/features/diagrams/diagramInfo.js'
import { watchDatabaseDesign } from '@/features/database/databaseService.js'
import { buildAll } from '@/utils/diagramRegistry.js'
import { toTables } from '@/utils/toTables.js'
import { DIALECTS, toSQL } from '@/utils/toSQL.js'
import { cn } from '@/utils/cn.js'
import ReportDocument from './ReportDocument.jsx'
import { REPORT_SECTIONS } from './reportSections.js'
import { generateConclusions, saveReport, saveReportVersion, watchReport } from './reportService.js'

// تبويب التقرير: يجمع البيانات ثم يعرض المحرّر بعد تحميل الإعدادات المحفوظة
export default function ReportPanel({ project, readOnly }) {
  const { t } = useTranslation('report')
  const { current, loading } = useAnalyses(project)
  const [savedDiagrams, setSavedDiagrams] = useState({})
  const [dbDesign, setDbDesign] = useState(undefined)
  const [saved, setSaved] = useState(undefined)

  useEffect(() => watchDiagrams(project.id, setSavedDiagrams), [project.id])
  useEffect(() => watchDatabaseDesign(project.id, setDbDesign), [project.id])
  useEffect(() => watchReport(project.id, setSaved), [project.id])

  if (loading || saved === undefined || dbDesign === undefined)
    return <Skeleton className="h-96 rounded-2xl" />
  if (!current)
    return <Card className="py-12 text-center text-slate-500">{t('ui.needAnalysis')}</Card>

  return (
    <ReportEditor
      // إعادة التهيئة عند تغيّر الإصدار المحفوظ من مكان آخر
      key={saved?.updatedAt?.toMillis?.() ?? 'new'}
      project={project}
      readOnly={readOnly}
      analysis={current}
      savedDiagrams={savedDiagrams}
      dbDesign={dbDesign}
      saved={saved}
    />
  )
}

function ReportEditor({ project, readOnly, analysis, savedDiagrams, dbDesign, saved }) {
  const { t, i18n } = useTranslation('report')
  const { user } = useAuth()
  const a = analysis.data
  const [form, setForm] = useState(() => ({
    intro: saved?.intro ?? a.summary ?? '',
    conclusions: saved?.conclusions ?? '',
    recommendations: saved?.recommendations ?? [],
    hidden: saved?.hidden ?? [],
    hiddenDiagrams: saved?.hiddenDiagrams ?? [],
    explanations: saved?.explanations ?? true,
    dialect: saved?.dialect ?? dbDesign?.dialect ?? 'mysql',
  }))
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(null) // 'save' | 'ai' | 'export'
  const [svgs, setSvgs] = useState(null)
  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setDirty(true)
  }

  // شيفرة المخططات: المعدّلة يدوياً أولاً، وإلا المولّدة من التحليل
  const codes = useMemo(() => {
    const generated = buildAll(a, { title: project.title, lang: project.language })
    return Object.fromEntries(
      DIAGRAMS.map(({ id }) => [id, savedDiagrams[id]?.code ?? portrait(generated[id])]).filter(
        ([, c]) => c,
      ),
    )
  }, [a, savedDiagrams, project.title, project.language])

  // رسم المخططات بالوضع الفاتح للطباعة، واحداً بعد الآخر
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const out = {}
      for (const [id, code] of Object.entries(codes)) {
        try {
          out[id] = await renderMermaid(code, 'light')
        } catch {
          /* مخطط فيه خطأ صياغة: يُحذف من التقرير */
        }
        if (cancelled) return
      }
      setSvgs(out)
    })()
    return () => {
      cancelled = true
    }
  }, [codes])

  const tables = useMemo(() => dbDesign?.tables ?? toTables(a), [dbDesign, a])
  const sql = useMemo(
    () => (tables.length ? toSQL(tables, form.dialect, { title: project.title }) : ''),
    [tables, form.dialect, project.title],
  )
  const date = todayLong(project.language)

  const doc = (idPrefix) =>
    svgs && (
      <ReportDocument
        idPrefix={idPrefix}
        project={project}
        author={readOnly ? '' : user?.displayName}
        analysis={a}
        svgs={svgs}
        tables={tables}
        sql={sql}
        dialectLabel={DIALECTS[form.dialect].label}
        report={form}
        date={date}
      />
    )

  async function onSave() {
    setBusy('save')
    try {
      await saveReport(project.id, form)
      setDirty(false)
      toast.success(t('ui.saved'))
    } catch {
      toast.error(t('ui.saveFailed'))
    } finally {
      setBusy(null)
    }
  }

  async function onGenerate() {
    setBusy('ai')
    try {
      const out = await generateConclusions(a, project.language)
      set(out)
      toast.success(t('ui.generated'))
    } catch {
      toast.error(t('ui.generateFailed'))
    } finally {
      setBusy(null)
    }
  }

  // التصدير: نحفظ نسخة (T7.6) ثم نطبع الوثيقة وحدها عبر المتصفح (T7.5)
  async function onExport() {
    setBusy('export')
    try {
      if (!readOnly) {
        await saveReport(project.id, form)
        setDirty(false)
        await saveReportVersion(project.id, {
          report: form,
          analysisId: analysis.id,
          analysisVersion: analysis.version,
        }).catch(() => {})
      }
      const prevTitle = document.title
      document.title = project.title // اسم ملف PDF المقترح
      document.body.classList.add('printing-report')
      const done = () => {
        document.body.classList.remove('printing-report')
        document.title = prevTitle
        window.removeEventListener('afterprint', done)
      }
      window.addEventListener('afterprint', done)
      await document.fonts.ready
      window.print()
      toast.info(t('ui.printHint'), { duration: 8000 })
    } finally {
      setBusy(null)
    }
  }

  const sectionLabel = (s) =>
    i18n.getFixedT(project.language === 'en' ? 'en' : 'ar', 'report')(`sections.${s}`)
  const toggle = (key, value) =>
    set({
      [key]: form[key].includes(value)
        ? form[key].filter((x) => x !== value)
        : [...form[key], value],
    })

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[22rem_1fr]">
      <div className="no-print flex flex-col gap-4 xl:sticky xl:top-20">
        <Card className="flex flex-col gap-3">
          <Button onClick={onExport} loading={busy === 'export'} disabled={!svgs}>
            <FileDown className="size-5" />
            {t('ui.export')}
          </Button>
          {!readOnly && (
            <Button
              variant="secondary"
              onClick={onSave}
              loading={busy === 'save'}
              disabled={!dirty}
            >
              <Save className="size-4" />
              {dirty ? t('ui.save') : t('ui.allSaved')}
            </Button>
          )}
          <p className="text-xs leading-relaxed text-slate-500">{t('ui.exportHint')}</p>
        </Card>

        {!readOnly && (
          <>
            <Card className="flex flex-col gap-3">
              <h3 className="font-bold">{t('ui.sections')}</h3>
              <div className="flex flex-col gap-1.5">
                {REPORT_SECTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!form.hidden.includes(s)}
                      onChange={() => toggle('hidden', s)}
                    />
                    {sectionLabel(s)}
                  </label>
                ))}
              </div>
              {!form.hidden.includes('diagrams') && (
                <>
                  <h4 className="mt-2 text-sm font-semibold text-slate-500">{t('ui.diagrams')}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {DIAGRAMS.filter((d) => codes[d.id]).map((d) => {
                      const on = !form.hiddenDiagrams.includes(d.id)
                      return (
                        <button
                          key={d.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle('hiddenDiagrams', d.id)}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                            on
                              ? 'bg-navy text-white ring-navy dark:bg-teal dark:text-ink dark:ring-teal'
                              : 'ring-slate-300 dark:ring-slate-700',
                          )}
                        >
                          {i18n.t(`diagrams:types.${d.id}.label`)}
                        </button>
                      )
                    })}
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.explanations}
                      onChange={(e) => set({ explanations: e.target.checked })}
                    />
                    {t('ui.explanations')}
                  </label>
                </>
              )}
              <label className="mt-2 flex flex-col gap-1 text-sm">
                <span className="font-semibold">{t('ui.dialect')}</span>
                <select
                  value={form.dialect}
                  onChange={(e) => set({ dialect: e.target.value })}
                  className={`${fieldClass} h-10`}
                >
                  {Object.entries(DIALECTS).map(([k, d]) => (
                    <option key={k} value={k}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
            </Card>

            <Card className="flex flex-col gap-3">
              <h3 className="font-bold">{t('ui.texts')}</h3>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">{sectionLabel('intro')}</span>
                <textarea
                  rows={5}
                  value={form.intro}
                  onChange={(e) => set({ intro: e.target.value })}
                  className={fieldClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">{t('ui.conclusions')}</span>
                <textarea
                  rows={6}
                  value={form.conclusions}
                  onChange={(e) => set({ conclusions: e.target.value })}
                  className={fieldClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">{t('ui.recommendations')}</span>
                <textarea
                  rows={6}
                  value={form.recommendations.join('\n')}
                  onChange={(e) => set({ recommendations: e.target.value.split('\n') })}
                  placeholder={t('ui.recommendationsHint')}
                  className={fieldClass}
                />
              </label>
              <Button variant="secondary" onClick={onGenerate} loading={busy === 'ai'}>
                <Sparkles className="size-4" />
                {form.conclusions ? t('ui.regenerateAi') : t('ui.generateAi')}
              </Button>
            </Card>
          </>
        )}
      </div>

      {/* المعاينة: ورقة A4 */}
      <div className="overflow-x-auto rounded-2xl bg-slate-200 p-3 sm:p-6 dark:bg-slate-800">
        <div className="mx-auto w-full max-w-[21cm] bg-white px-6 py-8 shadow-lg sm:px-12">
          {doc('preview') ?? (
            <div className="flex flex-col items-center gap-3 py-24 text-slate-500">
              <Loader2 className="size-8 animate-spin" />
              {t('ui.rendering')}
            </div>
          )}
        </div>
      </div>

      {/* نسخة الطباعة خارج #root؛ تظهر في الطباعة وحدها */}
      {svgs && createPortal(<div className="print-portal">{doc('r')}</div>, document.body)}
    </div>
  )
}

// تاريخ اليوم بلغة التقرير
function todayLong(language) {
  return new Intl.DateTimeFormat(language === 'en' ? 'en' : 'ar', { dateStyle: 'long' }).format(
    new Date(),
  )
}

// صفحة A4 طولية: المخططات الأفقية (الأصناف، وER، والكائنات) تُرسم عمودية في التقرير فلا تصغر
function portrait(code) {
  return code?.replace(/^  direction RL$/m, '  direction TB')
}
