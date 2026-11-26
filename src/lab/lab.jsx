// صفحة تجارب للتطوير فقط (T0.8 + T0.9) — لا تدخل في npm run build
import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import mermaid from 'mermaid'
import '@fontsource/readex-pro/400.css'
import '@fontsource/readex-pro/600.css'
import '@/index.css'
import { samples } from './samples.js'

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  fontFamily: 'Readex Pro, sans-serif',
  themeVariables: {
    fontFamily: 'Readex Pro, sans-serif',
    primaryColor: '#e0f2f1',
    primaryBorderColor: '#14b8a6',
    primaryTextColor: '#0f172a',
    lineColor: '#1e2a78',
  },
})

window.__results = {}
window.__mermaid = mermaid

function Diagram({ id, code }) {
  const ref = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    // ننتظر الخط قبل الرسم حتى يقيس Mermaid عرض النص العربي صح
    Promise.all([
      document.fonts.load('16px "Readex Pro"'),
      document.fonts.load('600 16px "Readex Pro"'),
    ])
      .then(() => mermaid.render(`m-${id}`, code))
      .then(({ svg }) => {
        if (cancelled) return
        ref.current.innerHTML = svg
        window.__results[id] = 'ok'
      })
      .catch((e) => {
        if (cancelled) return
        setError(
          String(e.message || e)
            .split('\n')
            .slice(0, 3)
            .join(' '),
        )
        window.__results[id] = 'error: ' + String(e.message || e).split('\n')[0]
      })
    return () => {
      cancelled = true
    }
  }, [id, code])

  return (
    <div className="min-h-40 rounded-lg border border-slate-200 bg-white p-3">
      {error ? (
        <pre className="text-sm whitespace-pre-wrap text-red-600" dir="ltr">
          {error}
        </pre>
      ) : null}
      <div
        ref={ref}
        data-diagram={id}
        className="mermaid-host flex justify-center [&_svg]:max-w-full"
      />
    </div>
  )
}

async function exportCanvasPdf() {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ])
  const el = document.getElementById('report')
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgH = (canvas.height * pageW) / canvas.width
  let y = 0
  while (y < imgH) {
    pdf.addImage(canvas, 'JPEG', 0, -y, pageW, imgH, undefined, 'FAST')
    y += pageH
    if (y < imgH) pdf.addPage()
  }
  return pdf
}

window.__canvasPdfBase64 = async () => {
  const pdf = await exportCanvasPdf()
  return pdf.output('datauristring').split(',')[1]
}

function Lab() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6 font-['Readex_Pro'] text-ink">
      <header className="no-print space-y-2">
        <h1 className="text-3xl font-semibold text-navy">مختبر Data Analytics — تجارب العربي</h1>
        <p className="text-slate-600">
          T0.8: كل مخطط بطريقتين. A = معرّفات عربية، B = معرّفات إنجليزية مع تسميات عربية.
        </p>
      </header>

      <section className="no-print space-y-8">
        {samples.map((s) => (
          <div key={s.key} className="space-y-3">
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-slate-500">A — معرّفات عربية</div>
                <Diagram id={`${s.key}-A`} code={s.A} />
              </div>
              <div>
                <div className="mb-1 text-sm text-slate-500">B — إنجليزي + تسميات عربية</div>
                <Diagram id={`${s.key}-B`} code={s.B} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="no-print flex gap-3">
          <button
            className="rounded-lg bg-navy px-4 py-2 text-white"
            onClick={async () => (await exportCanvasPdf()).save('bunyan-canvas.pdf')}
          >
            PDF عبر html2canvas + jsPDF
          </button>
          <button
            className="rounded-lg bg-teal px-4 py-2 text-white"
            onClick={() => window.print()}
          >
            PDF عبر طباعة المتصفح
          </button>
        </div>

        <article id="report" className="space-y-4 rounded-lg border border-slate-200 bg-white p-8">
          <h2 className="text-2xl font-semibold text-navy">تقرير تجريبي: نظام إدارة مكتبة</h2>
          <p className="leading-8">
            يهدف النظام إلى إدارة الكتب والطلاب وعمليات الاستعارة والإرجاع والغرامات. يستطيع الطالب
            البحث عن كتاب واستعارته، ويُسجّل النظام تاريخ الإرجاع المتوقع. إذا تأخر الطالب عن موعد
            الإرجاع تُحتسب غرامة بقيمة 0.50 دينار عن كل يوم (مثلاً 3 أيام = 1.50).
          </p>
          <p className="leading-8">
            نص مختلط: الجدول Borrow يرتبط بـ Student عبر المفتاح الأجنبي student_id، والعلاقة 1:M.
          </p>
          <ul className="list-disc space-y-1 ps-6">
            <li>FR-01: تسجيل الدخول بالبريد وكلمة المرور</li>
            <li>FR-02: استعارة كتاب متوفر فقط</li>
          </ul>
          <Diagram id="report-er" code={samples[4].B} />
        </article>
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Lab />
  </StrictMode>,
)
