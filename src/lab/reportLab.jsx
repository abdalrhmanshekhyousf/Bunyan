// مختبر التقرير (للتطوير فقط): يعرض التقرير من بيانات المثال دون Firebase،
// ليُختبر تصديره PDF آلياً بـ scripts/report-check.mjs. افتح /report-lab.html?lang=en للإنجليزية
import { createRoot } from 'react-dom/client'
import '@fontsource/readex-pro/400.css'
import '@fontsource/readex-pro/600.css'
import '@fontsource/readex-pro/700.css'
import '@/index.css'
import '@/lib/i18n.js'
import ReportDocument from '@/features/report/ReportDocument.jsx'
import { renderMermaid } from '@/features/diagrams/renderMermaid.js'
import { buildAll } from '@/utils/diagramRegistry.js'
import { toTables } from '@/utils/toTables.js'
import { toSQL } from '@/utils/toSQL.js'
import { librarySamples } from '@/features/projects/sampleProject.js'
import { libraryAnalysis } from '../../tests/fixtures/libraryAnalysis.js'

const lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ar'
const project = { id: 'lab', ...librarySamples[lang], language: lang }

const codes = Object.fromEntries(
  Object.entries(buildAll(libraryAnalysis, { title: project.title, lang })).map(([k, c]) => [
    k,
    c?.replace(/^  direction RL$/m, '  direction TB'),
  ]),
)
const svgs = {}
for (const [id, code] of Object.entries(codes)) {
  if (!code) continue
  try {
    svgs[id] = await renderMermaid(code, 'light')
  } catch (e) {
    console.error('diagram failed', id, e.message)
  }
}
const tables = toTables(libraryAnalysis)

createRoot(document.getElementById('report')).render(
  <ReportDocument
    project={project}
    author={lang === 'ar' ? 'طالب تجريبي' : 'Test Student'}
    analysis={libraryAnalysis}
    svgs={svgs}
    tables={tables}
    sql={toSQL(tables, 'mysql', { title: project.title })}
    dialectLabel="MySQL"
    report={{
      intro: libraryAnalysis.summary,
      conclusions:
        lang === 'ar' ? 'يحقق التصميم متطلبات النظام.' : 'The design meets the requirements.',
      recommendations: lang === 'ar' ? ['اختبار النظام', 'نسخ احتياطي يومي'] : ['Test', 'Backups'],
      hidden: [],
      hiddenDiagrams: [],
      explanations: true,
    }}
    date="2026-11-21"
  />,
)
window.__ready = Object.keys(svgs).length
