// محوّلات نتيجة التحليل إلى شيفرة Mermaid (T5.1).
// القاعدة من تجارب T0.8: معرّفات إنجليزية + تسميات بين علامتي تنصيص (عربية أو إنجليزية).
// كل نص يمرّ عبر esc() فلا يكسر الصياغة ولا يحقن HTML أو روابط (T5.10).

const WORDS = {
  ar: { system: 'النظام', start: 'بداية', end: 'نهاية', yes: 'نعم', no: 'لا' },
  en: { system: 'System', start: 'Start', end: 'End', yes: 'Yes', no: 'No' },
}
const words = (lang) => WORDS[lang] ?? WORDS.ar

// تهريب نص داخل تسمية بين علامتي تنصيص، أو نص رسالة في مخطط التتابع
export function esc(text) {
  return (
    String(text ?? '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/ـ/g, '')
      .replace(/[{}[\]|`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      // في مرور واحد، كي لا تُهرَّب الرموز الناتجة نفسها
      .replace(/[#"<>;]/g, (c) => ENTITIES[c])
  )
}
const ENTITIES = { '#': '#35;', '"': '#quot;', '<': '#lt;', '>': '#gt;', ';': '#59;' }

// معرّف آمن: بادئة تمنع التصادم مع الكلمات المحجوزة (end، graph، loop…)
const safeId = (prefix, id) => `${prefix}_${String(id).replace(/[^A-Za-z0-9_]/g, '_')}`

const lines = (...xs) =>
  xs
    .flat(Infinity)
    .filter((x) => x != null && x !== false)
    .join('\n')

// ── حالات الاستخدام ────────────────────────────────────────────────
export function toUseCase(a, { title = '', lang = 'ar' } = {}) {
  if (!a.functions.length) return null
  const usedActors = new Set(a.functions.flatMap((f) => f.actorIds))
  const actors = a.actors.filter((x) => usedActors.has(x.id))
  return lines(
    'flowchart RL',
    actors.map((x) => `  ${safeId('act', x.id)}(("${esc(x.label)}"))`),
    `  subgraph SYS["${esc(title || words(lang).system)}"]`,
    a.functions.map((f) => `    ${safeId('uc', f.id)}(["${esc(f.label)}"])`),
    '  end',
    actors.map((x) => {
      const ucs = a.functions.filter((f) => f.actorIds.includes(x.id))
      return `  ${safeId('act', x.id)} --- ${ucs.map((f) => safeId('uc', f.id)).join(' & ')}`
    }),
    '  classDef actor fill:transparent,stroke-width:2px',
    actors.length && `  class ${actors.map((x) => safeId('act', x.id)).join(',')} actor`,
  )
}

// ── الأصناف ─────────────────────────────────────────────────────────
const CLASS_ARROWS = {
  '1:1': ['"1"', '--', '"1"'],
  '1:N': ['"1"', '-->', '"*"'],
  'N:1': ['"*"', '-->', '"1"'],
  'M:N': ['"*"', '--', '"*"'],
}

export function toClass(a) {
  if (!a.entities.length) return null
  return lines(
    'classDiagram',
    '  direction RL',
    a.entities.map((e) => {
      const members = [
        ...e.attributes.map((x) => `    +${x.name}: ${x.type}`),
        ...e.methods.map((m) => `    +${m.name}()`),
      ]
      const head = `  class ${safeId('C', e.name)}["${esc(e.label)}"]`
      return members.length ? [`${head} {`, members, '  }'] : head
    }),
    a.relationships.map((r) => {
      const [l, arrow, rr] = CLASS_ARROWS[r.cardinality] ?? CLASS_ARROWS['1:N']
      const label = esc(r.label).replace(/:/g, ' ')
      return `  ${safeId('C', r.from)} ${l} ${arrow} ${rr} ${safeId('C', r.to)}${label ? ` : ${label}` : ''}`
    }),
  )
}

// ── التتابع ─────────────────────────────────────────────────────────
export function toSequence(a, { lang = 'ar' } = {}) {
  const steps = a.scenario.steps
  if (!steps.length) return null
  const actorIds = new Set(a.actors.map((x) => x.id))
  const labelOf = Object.fromEntries([
    ...a.actors.map((x) => [x.id, x.label]),
    ...a.entities.map((e) => [e.name, e.label]),
    ['System', words(lang).system],
  ])
  // المشاركون بترتيب ظهورهم: الفاعلون أولاً ثم النظام ثم الكيانات
  const order = [...new Set(steps.flatMap((s) => [s.from, s.to]))].sort((x, y) => rank(x) - rank(y))
  function rank(p) {
    return actorIds.has(p) ? 0 : p === 'System' ? 1 : 2
  }
  return lines(
    'sequenceDiagram',
    a.scenario.label && `  title ${esc(a.scenario.label)}`,
    order.map(
      (p) =>
        `  ${actorIds.has(p) ? 'actor' : 'participant'} ${safeId('p', p)} as ${esc(labelOf[p] ?? p)}`,
    ),
    steps.map((s) => {
      // الرجوع من النظام أو البيانات نحو فاعل = رسالة ردّ (خط متقطع)
      const reply = !actorIds.has(s.from) && rank(s.to) < rank(s.from)
      const msg = `  ${safeId('p', s.from)}${reply ? '-->>' : '->>'}${safeId('p', s.to)}: ${esc(s.message)}`
      return s.condition ? [`  opt ${esc(s.condition)}`, `  ${msg}`, '  end'] : msg
    }),
  )
}

// ── النشاط ──────────────────────────────────────────────────────────
export function toActivity(a, { lang = 'ar' } = {}) {
  const steps = a.scenario.steps
  if (!steps.length) return null
  const w = words(lang)
  const labelOf = Object.fromEntries(a.actors.map((x) => [x.id, x.label]))
  const out = ['flowchart TD', `  START(["${esc(w.start)}"])`, `  FINISH(["${esc(w.end)}"])`]
  let prev = 'START'
  steps.forEach((s, i) => {
    const who = labelOf[s.from]
    const text = esc(who ? `${who}: ${s.message}` : s.message)
    const node = `S${i}`
    if (s.condition) {
      const dec = `D${i}`
      out.push(`  ${dec}{"${esc(s.condition)}"}`, `  ${prev} --> ${dec}`)
      out.push(
        `  ${node}["${text}"]`,
        `  ${dec} -- ${esc(w.yes)} --> ${node}`,
        `  ${dec} -- ${esc(w.no)} --> FINISH`,
      )
    } else {
      out.push(`  ${node}["${text}"]`, `  ${prev} --> ${node}`)
    }
    prev = node
  })
  out.push(`  ${prev} --> FINISH`)
  return out.join('\n')
}

// ── الكيانات والعلاقات (ER) ──────────────────────────────────────────
const ER_ARROWS = { '1:1': '||--||', '1:N': '||--o{', 'N:1': '}o--||', 'M:N': '}o--o{' }

export function toER(a) {
  if (!a.entities.length) return null
  // المفتاح الأجنبي يظهر في الطرف «المتعدد» من علاقة 1:N (وفي M:N يُنشأ جدول وسيط في T6.1)
  const fks = {}
  for (const r of a.relationships) {
    const [one, many] =
      r.cardinality === '1:N' ? [r.from, r.to] : r.cardinality === 'N:1' ? [r.to, r.from] : []
    if (one) (fks[many] ??= []).push(one)
  }
  const fkName = (ent) => `${ent[0].toLowerCase()}${ent.slice(1)}Id`
  return lines(
    'erDiagram',
    '  direction RL',
    a.relationships.map(
      (r) =>
        `  ${safeId('E', r.from)} ${ER_ARROWS[r.cardinality] ?? ER_ARROWS['1:N']} ${safeId('E', r.to)} : "${esc(r.label) || ' '}"`,
    ),
    a.entities.map((e) => {
      const names = new Set(e.attributes.map((x) => x.name))
      const fkAttrs = (fks[e.name] ?? [])
        .filter((one) => !names.has(fkName(one)))
        .map((one) => {
          const target = a.entities.find((x) => x.name === one)
          return `    int ${fkName(one)} FK "${esc(target?.label ?? one)}"`
        })
      return [
        `  ${safeId('E', e.name)}["${esc(e.label)}"] {`,
        e.attributes.map(
          (x) =>
            `    ${x.type} ${x.name}${x.isPrimaryKey ? ' PK' : ''}${x.label ? ` "${esc(x.label)}"` : ''}`,
        ),
        fkAttrs,
        '  }',
      ]
    }),
  )
}

export const DIAGRAM_TYPES = [
  { id: 'useCase', build: toUseCase },
  { id: 'class', build: toClass },
  { id: 'sequence', build: toSequence },
  { id: 'activity', build: toActivity },
  { id: 'er', build: toER },
]

export function buildAll(a, opts) {
  return Object.fromEntries(DIAGRAM_TYPES.map(({ id, build }) => [id, build(a, opts)]))
}
