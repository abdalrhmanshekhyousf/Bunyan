// المخططات الإضافية: الحالة، والتعاون، والحِزم، والكائنات، والمكوّنات، والنشر.
// كلها (عدا التعاون) تعتمد على a.design الذي يولّده استدعاء التصميم الثاني.
import { esc } from './toMermaid.js'

const KINDS = {
  ar: { device: 'جهاز', server: 'خادم', database: 'قاعدة بيانات', cloud: 'سحابة' },
  en: { device: 'device', server: 'server', database: 'database', cloud: 'cloud' },
}
const SYSTEM = { ar: 'النظام', en: 'System' }

const safeId = (prefix, id) => `${prefix}_${String(id).replace(/[^A-Za-z0-9_]/g, '_')}`
const lines = (...xs) =>
  xs
    .flat(Infinity)
    .filter((x) => x != null && x !== false)
    .join('\n')
// تسمية بعد ":" لا تقبل ":" أخرى ولا أقواساً
const after = (t) => esc(t).replace(/[():]/g, ' ').replace(/\s+/g, ' ').trim()

// ── الحالة (State) ───────────────────────────────────────────────────
export function toState(a) {
  const machines = a.design?.stateMachines ?? []
  if (!machines.length) return null
  const label = Object.fromEntries(a.entities.map((e) => [e.name, e.label]))
  const body = (m, k, pad) => {
    const sid = (x) => safeId(`s${k}`, x)
    return [
      m.states.map((st) => `${pad}state "${esc(st.label)}" as ${sid(st.id)}`),
      `${pad}[*] --> ${sid(m.initial)}`,
      m.transitions.map(
        (t) => `${pad}${sid(t.from)} --> ${sid(t.to)}${t.event ? ` : ${after(t.event)}` : ''}`,
      ),
      m.finals.map((x) => `${pad}${sid(x)} --> [*]`),
    ]
  }
  if (machines.length === 1) return lines('stateDiagram-v2', body(machines[0], 0, '  '))
  // عدة كيانات: كل دورة حياة داخل حالة مركّبة باسم الكيان
  return lines(
    'stateDiagram-v2',
    machines.map((m, k) => [
      `  state "${esc(label[m.entity] ?? m.entity)}" as M${k} {`,
      body(m, k, '    '),
      '  }',
    ]),
  )
}

// ── التعاون (Collaboration) ─────────────────────────────────────────
// من سيناريو التتابع نفسه: المشاركون عُقد، والرسائل مرقّمة على الروابط
export function toCollaboration(a, { lang = 'ar' } = {}) {
  const steps = a.scenario.steps
  if (!steps.length) return null
  const actorIds = new Set(a.actors.map((x) => x.id))
  const labelOf = Object.fromEntries([
    ...a.actors.map((x) => [x.id, x.label]),
    ...a.entities.map((e) => [e.name, e.label]),
    ['System', SYSTEM[lang] ?? SYSTEM.ar],
  ])
  const links = new Map()
  steps.forEach((st, i) => {
    const key = `${st.from}>${st.to}`
    if (!links.has(key)) links.set(key, [])
    links.get(key).push(`${i + 1}: ${esc(st.message)}`)
  })
  const participants = [...new Set(steps.flatMap((st) => [st.from, st.to]))]
  return lines(
    'flowchart LR',
    participants.map((p) =>
      actorIds.has(p)
        ? `  ${safeId('p', p)}(["${esc(labelOf[p] ?? p)}"])`
        : `  ${safeId('p', p)}["${esc(`:${labelOf[p] ?? p}`)}"]`,
    ),
    [...links].map(([key, msgs]) => {
      const [from, to] = key.split('>')
      return `  ${safeId('p', from)} -->|"${msgs.join('<br/>')}"| ${safeId('p', to)}`
    }),
  )
}

// ── الحِزم (Package) ────────────────────────────────────────────────
export function toPackage(a) {
  const packages = a.design?.packages ?? []
  if (!packages.length) return null
  const pkgOf = {}
  packages.forEach((p) => p.entities.forEach((e) => (pkgOf[e] ??= p.id)))
  const label = Object.fromEntries(a.entities.map((e) => [e.name, e.label]))
  // اعتماد بين حزمتين إذا ربطت علاقةٌ كيانين فيهما
  const deps = new Set()
  for (const r of a.relationships) {
    const [x, y] = [pkgOf[r.from], pkgOf[r.to]]
    if (x && y && x !== y) deps.add(`${x}>${y}`)
  }
  return lines(
    'flowchart TB',
    packages.map((p) => {
      const members = p.entities.filter((e) => pkgOf[e] === p.id)
      if (!members.length) return null
      return [
        `  subgraph ${safeId('pk', p.id)}["${esc(p.label)}"]`,
        members.map((e) => `    ${safeId('C', e)}["${esc(label[e] ?? e)}"]`),
        '  end',
      ]
    }),
    [...deps].map((d) => {
      const [x, y] = d.split('>')
      return `  ${safeId('pk', x)} -.-> ${safeId('pk', y)}`
    }),
  )
}

// ── الكائنات (Object) ───────────────────────────────────────────────
export function toObject(a) {
  const objects = a.design?.objects ?? []
  if (!objects.length) return null
  const label = Object.fromEntries(a.entities.map((e) => [e.name, e.label]))
  return lines(
    'classDiagram',
    '  direction RL',
    objects.map((o) => {
      const head = `  class ${safeId('o', o.id)}["${esc(`${o.id} : ${label[o.entity] ?? o.entity}`)}"]`
      return o.values.length
        ? [`${head} {`, o.values.map((v) => `    ${v.attribute} = ${after(v.value)}`), '  }']
        : head
    }),
    (a.design.objectLinks ?? []).map(
      (l) =>
        `  ${safeId('o', l.from)} -- ${safeId('o', l.to)}${l.label ? ` : ${after(l.label)}` : ''}`,
    ),
  )
}

// ── المكوّنات (Component) ──────────────────────────────────────────
const SHAPE = {
  ui: (id, t) => `${id}[["${t}"]]`,
  service: (id, t) => `${id}["${t}"]`,
  database: (id, t) => `${id}[("${t}")]`,
  external: (id, t) => `${id}{{"${t}"}}`,
}

export function toComponent(a) {
  const comps = a.design?.components ?? []
  if (!comps.length) return null
  return lines(
    'flowchart LR',
    comps.map((c) => `  ${SHAPE[c.kind](safeId('cmp', c.id), esc(c.label))}`),
    comps.flatMap((c) =>
      c.dependsOn.map((d) => `  ${safeId('cmp', c.id)} --> ${safeId('cmp', d)}`),
    ),
  )
}

// ── النشر (Deployment) ─────────────────────────────────────────────
export function toDeployment(a, { lang = 'ar' } = {}) {
  const nodes = a.design?.deploymentNodes ?? []
  if (!nodes.length) return null
  const comp = Object.fromEntries((a.design.components ?? []).map((c) => [c.id, c]))
  const kinds = KINDS[lang] ?? KINDS.ar
  return lines(
    'flowchart LR',
    nodes.map((n) => {
      const title = esc(`${n.label} «${kinds[n.kind]}»`)
      // العقدة بلا مكوّنات تُرسم صندوقاً؛ الـsubgraph الفارغ لا يُعرض جيداً
      if (!n.components.length) return `  ${safeId('n', n.id)}[["${title}"]]`
      return [
        `  subgraph ${safeId('n', n.id)}["${title}"]`,
        n.components.map(
          (cid) => `    ${SHAPE[comp[cid].kind](safeId(`d_${n.id}`, cid), esc(comp[cid].label))}`,
        ),
        '  end',
      ]
    }),
    (a.design.deploymentLinks ?? []).map(
      (l) =>
        `  ${safeId('n', l.from)} <-->${l.protocol ? `|"${esc(l.protocol)}"|` : ''} ${safeId('n', l.to)}`,
    ),
  )
}
