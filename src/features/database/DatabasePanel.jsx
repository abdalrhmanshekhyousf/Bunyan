import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Database, Download, Pencil, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, Modal, Skeleton } from '@/components/ui/index.js'
import { useAnalyses } from '@/features/analysis/useAnalysis.js'
import { toTables } from '@/utils/toTables.js'
import { DIALECTS, toSQL } from '@/utils/toSQL.js'
import { cn } from '@/utils/cn.js'
import TableEditor from './TableEditor.jsx'
import { resetDatabaseDesign, saveDatabaseDesign, watchDatabaseDesign } from './databaseService.js'

// تبويب قاعدة البيانات: الجداول (T6.1/T6.4) وكود SQL (T6.2/T6.5)، والحفظ (T6.7)
export default function DatabasePanel({ project, readOnly }) {
  const { t } = useTranslation('database')
  const { current, loading } = useAnalyses(project)
  const [saved, setSaved] = useState(undefined)
  const [dialectChoice, setDialect] = useState(null)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => watchDatabaseDesign(project.id, setSaved), [project.id])

  // النوع المختار، وإلا المحفوظ مع التصميم، وإلا MySQL
  const dialect = dialectChoice ?? saved?.dialect ?? 'mysql'
  const generated = useMemo(() => (current ? toTables(current.data) : []), [current])
  const tables = draft ?? saved?.tables ?? generated
  const sql = useMemo(
    () => (tables.length ? toSQL(tables, dialect, { title: project.title }) : ''),
    [tables, dialect, project.title],
  )

  if (loading || saved === undefined) return <Skeleton className="h-96 rounded-2xl" />
  if (!current) return <Card className="py-12 text-center text-slate-500">{t('needAnalysis')}</Card>
  if (!tables.length && !draft)
    return (
      <Card className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
        <Database className="size-10" />
        {t('noEntities')}
      </Card>
    )

  const editing = draft != null

  async function save() {
    setSaving(true)
    try {
      await saveDatabaseDesign(project.id, { tables: draft, analysisId: current.id, dialect })
      toast.success(t('saved'))
      setDraft(null)
    } catch {
      toast.error(t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  function download() {
    const name = `${project.title}-${DIALECTS[dialect].label}`.replace(/[\\/:*?"<>|]+/g, '-')
    const url = URL.createObjectURL(new Blob([sql], { type: 'application/sql;charset=utf-8' }))
    Object.assign(document.createElement('a'), { href: url, download: `${name}.sql` }).click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{t('tables')}</h3>
            <Badge>{tables.length}</Badge>
            {saved?.editedByUser && !editing && <Badge tone="amber">{t('editedByUser')}</Badge>}
            {saved?.editedByUser && saved.analysisId !== current.id && !editing && (
              <Badge tone="red">{t('olderAnalysis')}</Badge>
            )}
          </div>
          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              {editing ? (
                <>
                  <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={save} loading={saving}>
                    {t('save')}
                  </Button>
                </>
              ) : (
                <>
                  {saved?.editedByUser && (
                    <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
                      <RotateCcw className="size-4" />
                      {t('regenerate')}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDraft(structuredClone(tables))}
                  >
                    <Pencil className="size-4" />
                    {t('edit')}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <TableEditor tables={tables} onChange={setDraft} readOnly={readOnly || !editing} />
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label={t('dialect')}
            className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60"
          >
            {Object.entries(DIALECTS).map(([key, d]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={dialect === key}
                onClick={() => setDialect(key)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-semibold',
                  dialect === key
                    ? 'bg-white text-navy shadow-sm dark:bg-slate-900 dark:text-teal'
                    : 'text-slate-600 dark:text-slate-400',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={copy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? t('copied') : t('copy')}
            </Button>
            <Button variant="secondary" size="sm" onClick={download}>
              <Download className="size-4" />
              .sql
            </Button>
          </div>
        </div>
        <pre
          dir="ltr"
          className="max-h-[70vh] overflow-auto rounded-xl bg-slate-950 p-4 text-start font-mono text-sm leading-relaxed text-slate-100"
        >
          <SqlHighlight code={sql} />
        </pre>
      </Card>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t('regenerate')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await resetDatabaseDesign(project.id)
                setConfirmReset(false)
                toast.success(t('regenerated'))
              }}
            >
              {t('regenerate')}
            </Button>
          </>
        }
      >
        <p className="leading-relaxed">{t('regenerateConfirm')}</p>
      </Modal>
    </div>
  )
}

// تلوين بسيط لصياغة SQL: الكلمات المفتاحية، والأنواع، والنصوص، والتعليقات
const KEYWORDS =
  /\b(CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|UNIQUE|ON|DELETE|CASCADE|INDEX|ALTER|ADD|CONSTRAINT|COMMENT|IS|COLUMN|AUTO_INCREMENT|GENERATED|ALWAYS|AS|IDENTITY|AUTOINCREMENT|ENGINE|DEFAULT|CHARSET|PRAGMA)\b/
const TYPES = /\b(VARCHAR|TEXT|INT|INTEGER|DECIMAL|NUMERIC|BOOLEAN|DATE|DATETIME|TIMESTAMP)\b/
const TOKEN = new RegExp(`(--[^\\n]*)|('(?:[^']|'')*')|${KEYWORDS.source}|${TYPES.source}`, 'g')

function SqlHighlight({ code }) {
  const parts = []
  let last = 0
  for (const m of code.matchAll(TOKEN)) {
    if (m.index > last) parts.push(code.slice(last, m.index))
    const cls = m[1]
      ? 'text-slate-500 italic'
      : m[2]
        ? 'text-amber-300'
        : KEYWORDS.test(m[0])
          ? 'text-teal-300 font-semibold'
          : 'text-sky-300'
    parts.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  parts.push(code.slice(last))
  return parts
}
