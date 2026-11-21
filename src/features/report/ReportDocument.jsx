import i18n from '@/lib/i18n.js'
import { LogoMark } from '@/components/ui/Logo.jsx'
import { DIAGRAMS } from '@/features/diagrams/diagramInfo.js'
import { REPORT_SECTIONS } from './reportSections.js'

// وثيقة التقرير (T7.1). تُكتب بلغة مخرجات المشروع لا بلغة الواجهة،
// وتُستعمل نفسها للمعاينة على الشاشة وللطباعة PDF (T7.5).

export default function ReportDocument({
  project,
  author,
  analysis: a,
  svgs,
  tables,
  sql,
  dialectLabel,
  report,
  date,
  idPrefix = 'r',
}) {
  const lang = project.language === 'en' ? 'en' : 'ar'
  const t = i18n.getFixedT(lang, 'report')
  const td = i18n.getFixedT(lang, 'diagrams')
  const include = (s) => !report.hidden?.includes(s)
  const diagrams = DIAGRAMS.filter((d) => svgs[d.id] && !report.hiddenDiagrams?.includes(d.id))
  const sections = REPORT_SECTIONS.filter(
    (s) =>
      include(s) && (s !== 'diagrams' || diagrams.length) && (s !== 'database' || tables.length),
  )
  const n = (s) => sections.indexOf(s) + 1
  const heading = (id) => (
    <h2 id={`${idPrefix}-${id}`} className="report-h2">
      <span className="text-teal">{n(id)}.</span> {t(`sections.${id}`)}
    </h2>
  )
  const fr = a.requirements.filter((r) => r.type === 'functional')
  const nfr = a.requirements.filter((r) => r.type === 'nonFunctional')
  const actorLabel = Object.fromEntries(a.actors.map((x) => [x.id, x.label]))

  return (
    <article lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className="report-doc">
      {/* الغلاف */}
      <section className="report-cover">
        <LogoMark className="size-24" />
        <p className="mt-3 text-sm font-semibold tracking-widest text-slate-500">
          {lang === 'ar' ? 'بُنيان' : 'BUNYAN'}
        </p>
        <h1 className="mt-16 text-4xl leading-tight font-bold text-navy">{project.title}</h1>
        <p className="mt-4 text-xl text-slate-600">{t('subtitle')}</p>
        <dl className="mt-24 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-start text-slate-700">
          {author && (
            <>
              <dt className="font-semibold">{t('author')}</dt>
              <dd>{author}</dd>
            </>
          )}
          <dt className="font-semibold">{t('date')}</dt>
          <dd>{date}</dd>
        </dl>
      </section>

      {/* الفهرس */}
      <section className="report-page">
        <h2 className="report-h2">{t('toc')}</h2>
        <ol className="flex flex-col gap-2 text-lg">
          {sections.map((s) => (
            <li key={s} className="flex gap-3 border-b border-dotted border-slate-300 pb-1">
              <span className="font-semibold text-teal">{n(s)}.</span>
              <a href={`#${idPrefix}-${s}`}>{t(`sections.${s}`)}</a>
            </li>
          ))}
        </ol>
        {include('diagrams') && diagrams.length > 0 && (
          <>
            <h3 className="report-h3 mt-8">{t('figures')}</h3>
            <ol className="flex flex-col gap-1">
              {diagrams.map((d, i) => (
                <li key={d.id}>
                  {t('figure', { n: i + 1 })}: {t('diagramOf', { name: td(`types.${d.id}.label`) })}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      {include('intro') && (
        <section className="report-page">
          {heading('intro')}
          <p className="report-p whitespace-pre-line">{report.intro ?? a.summary}</p>
          <h3 className="report-h3">{t('originalDescription')}</h3>
          <blockquote className="report-quote whitespace-pre-line">
            {project.description}
          </blockquote>
        </section>
      )}

      {include('requirements') && (
        <section className="report-flow">
          {heading('requirements')}
          {[
            [fr, 'functional'],
            [nfr, 'nonFunctional'],
          ].map(
            ([list, key]) =>
              list.length > 0 && (
                <div key={key}>
                  <h3 className="report-h3">{t(`requirements.${key}`)}</h3>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th className="w-20">{t('code')}</th>
                        <th>{t('requirement')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr key={r.id + r.text}>
                          <td dir="ltr" className="font-mono">
                            {r.id}
                          </td>
                          <td>{r.text}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ),
          )}
        </section>
      )}

      {include('actors') && a.actors.length > 0 && (
        <section className="report-flow">
          {heading('actors')}
          <table className="report-table">
            <thead>
              <tr>
                <th className="w-48">{t('actor')}</th>
                <th>{t('role')}</th>
              </tr>
            </thead>
            <tbody>
              {a.actors.map((x) => (
                <tr key={x.id}>
                  <td className="font-semibold">{x.label}</td>
                  <td>{x.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {include('useCases') && a.functions.length > 0 && (
        <section className="report-flow">
          {heading('useCases')}
          <table className="report-table">
            <thead>
              <tr>
                <th className="w-48">{t('useCase')}</th>
                <th className="w-40">{t('actors')}</th>
                <th>{t('description')}</th>
              </tr>
            </thead>
            <tbody>
              {a.functions.map((f) => (
                <tr key={f.id}>
                  <td className="font-semibold">{f.label}</td>
                  <td>
                    {f.actorIds.map((x) => actorLabel[x] ?? x).join(lang === 'ar' ? '، ' : ', ')}
                  </td>
                  <td>{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {include('entities') && a.entities.length > 0 && (
        <section className="report-flow">
          {heading('entities')}
          {a.entities.map((e) => (
            <div key={e.name} className="break-inside-avoid">
              <h3 className="report-h3">
                {e.label}{' '}
                <span dir="ltr" className="font-mono text-sm text-slate-500">
                  ({e.name})
                </span>
              </h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>{t('attribute')}</th>
                    <th className="w-40">{t('identifier')}</th>
                    <th className="w-28">{t('type')}</th>
                    <th className="w-16">{t('key')}</th>
                  </tr>
                </thead>
                <tbody>
                  {e.attributes.map((x) => (
                    <tr key={x.name}>
                      <td>{x.label}</td>
                      <td dir="ltr" className="font-mono">
                        {x.name}
                      </td>
                      <td dir="ltr" className="font-mono">
                        {x.type}
                      </td>
                      <td>{x.isPrimaryKey ? 'PK' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {a.relationships.length > 0 && (
            <>
              <h3 className="report-h3">{t('relationships')}</h3>
              <ul className="report-list">
                {a.relationships.map((r) => {
                  const label = (n) => a.entities.find((e) => e.name === n)?.label ?? n
                  return (
                    <li key={r.from + r.to}>
                      {label(r.from)} — {r.label} — {label(r.to)}{' '}
                      <bdi dir="ltr">({r.cardinality})</bdi>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>
      )}

      {include('rules') && a.rules.length > 0 && (
        <section className="report-flow">
          {heading('rules')}
          <ul className="report-list">
            {a.rules.map((r) => (
              <li key={r.id + r.text}>
                <span dir="ltr" className="font-mono text-sm text-slate-500">
                  {r.id}
                </span>{' '}
                {r.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {include('diagrams') && diagrams.length > 0 && (
        <section>
          <div className="report-page-break" />
          {heading('diagrams')}
          {diagrams.map((d, i) => (
            <figure key={d.id} className="report-figure">
              {/* SVG مُنقّى داخل Mermaid (securityLevel: strict) */}
              <div
                className="report-svg mermaid-host"
                dangerouslySetInnerHTML={{ __html: svgs[d.id] }}
              />
              <figcaption>
                <strong>
                  {t('figure', { n: i + 1 })}: {t('diagramOf', { name: td(`types.${d.id}.label`) })}
                </strong>
                {report.explanations !== false && (
                  <span className="block text-sm text-slate-600">{td(`types.${d.id}.what`)}</span>
                )}
              </figcaption>
            </figure>
          ))}
        </section>
      )}

      {include('database') && tables.length > 0 && (
        <section>
          <div className="report-page-break" />
          {heading('database')}
          <p className="report-p">
            {t('databaseIntro', { count: tables.length, dialect: dialectLabel })}
          </p>
          <table className="report-table">
            <thead>
              <tr>
                <th>{t('table')}</th>
                <th>{t('columns')}</th>
                <th>{t('foreignKeys')}</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((tb) => (
                <tr key={tb.name}>
                  <td>
                    <span dir="ltr" className="font-mono font-semibold">
                      {tb.name}
                    </span>
                    {tb.label && <span className="block text-sm text-slate-500">{tb.label}</span>}
                  </td>
                  <td dir="ltr" className="font-mono text-sm">
                    {tb.columns.map((c) => c.name + (c.pk ? ' (PK)' : '')).join(', ')}
                  </td>
                  <td dir="ltr" className="font-mono text-sm">
                    {tb.foreignKeys.map((f) => `${f.column} → ${f.refTable}`).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="report-h3">{t('sqlCode', { dialect: dialectLabel })}</h3>
          <pre dir="ltr" className="report-code">
            {sql}
          </pre>
        </section>
      )}

      {include('conclusions') && (
        <section>
          <div className="report-page-break" />
          {heading('conclusions')}
          {report.conclusions ? (
            <p className="report-p whitespace-pre-line">{report.conclusions}</p>
          ) : (
            <p className="report-p text-slate-400">{t('noConclusions')}</p>
          )}
          {report.recommendations?.some(Boolean) && (
            <>
              <h3 className="report-h3">{t('recommendations')}</h3>
              <ol className="report-list list-decimal">
                {report.recommendations.filter(Boolean).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}
    </article>
  )
}
