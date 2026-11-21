import { z } from 'zod'

// بيانات المخططات الإضافية (الحالة، والحِزم، والكائنات، والمكوّنات، والنشر).
// تُولَّد في استدعاء ثانٍ صغير بعد التحليل، ويُعطى فيه أسماء الكيانات كي تبقى المراجع متسقة.

const S = (description) => ({ type: 'string', description })
const A = (items) => ({ type: 'array', items })
const O = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  properties,
  required,
})

export const COMPONENT_KINDS = ['ui', 'service', 'database', 'external']
export const NODE_KINDS = ['device', 'server', 'database', 'cloud']

export const designJsonSchema = O({
  stateMachines: A(
    O({
      entity: S('Entity name from the given list whose lifecycle is described'),
      states: A(
        O({ id: S('PascalCase English id'), label: S('State name in the output language') }),
      ),
      initial: S('id of the initial state'),
      finals: A(S('ids of final states (may be empty)')),
      transitions: A(
        O({
          from: S('state id'),
          to: S('state id'),
          event: S('Event/trigger in the output language'),
        }),
      ),
    }),
  ),
  packages: A(
    O({
      id: S('PascalCase English id'),
      label: S('Package name in the output language'),
      entities: A(S('Entity names that belong to this package')),
    }),
  ),
  objects: A(
    O({
      id: S('camelCase instance id, e.g. student1'),
      entity: S('Entity name it instantiates'),
      values: A(
        O({ attribute: S('attribute name of that entity'), value: S('Realistic sample value') }),
      ),
    }),
  ),
  objectLinks: A(
    O({ from: S('object id'), to: S('object id'), label: S('Short verb in the output language') }),
  ),
  components: A(
    O({
      id: S('PascalCase English id'),
      label: S('Component name in the output language'),
      kind: { type: 'string', enum: COMPONENT_KINDS },
      dependsOn: A(S('ids of components it uses')),
    }),
  ),
  deploymentNodes: A(
    O({
      id: S('PascalCase English id'),
      label: S('Node name in the output language, e.g. "خادم الويب"'),
      kind: { type: 'string', enum: NODE_KINDS },
      components: A(S('ids of components deployed on this node')),
    }),
  ),
  deploymentLinks: A(
    O({ from: S('node id'), to: S('node id'), protocol: S('e.g. HTTPS, TCP/IP, SQL') }),
  ),
})

// ── التحقق والتنظيف ─────────────────────────────────────────────────
const txt = (max = 80) =>
  z.string().transform((s) => s.replace(/ـ/g, '').replace(/\s+/g, ' ').trim().slice(0, max))
const label = txt().pipe(z.string().min(1))
const id = z
  .string()
  .transform((s) =>
    s
      .replace(/[^A-Za-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/^(\d)/, '_$1')
      .slice(0, 60),
  )
  .pipe(z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/))

const list = (schema, max) =>
  z
    .array(z.unknown())
    .catch([])
    .default([])
    .transform((xs) =>
      xs
        .flatMap((x) => {
          const r = schema.safeParse(x)
          return r.success ? [r.data] : []
        })
        .slice(0, max),
    )

const baseDesign = z.object({
  stateMachines: list(
    z.object({
      entity: id,
      states: list(z.object({ id, label }), 12),
      initial: id.catch(''),
      finals: z.array(id).catch([]),
      transitions: list(z.object({ from: id, to: id, event: txt() }), 25),
    }),
    3,
  ),
  packages: list(z.object({ id, label, entities: z.array(id).catch([]) }), 8),
  objects: list(
    z.object({
      id,
      entity: id,
      values: list(z.object({ attribute: id, value: txt(40) }), 8),
    }),
    10,
  ),
  objectLinks: list(z.object({ from: id, to: id, label: txt() }), 15),
  components: list(
    z.object({
      id,
      label,
      kind: z.enum(COMPONENT_KINDS).catch('service'),
      dependsOn: z.array(id).catch([]),
    }),
    12,
  ),
  deploymentNodes: list(
    z.object({
      id,
      label,
      kind: z.enum(NODE_KINDS).catch('server'),
      components: z.array(id).catch([]),
    }),
    8,
  ),
  deploymentLinks: list(z.object({ from: id, to: id, protocol: txt(30) }), 12),
})

// يحذف المراجع المعطوبة بالنسبة إلى كيانات التحليل
export function parseDesign(raw, entityNames = []) {
  const d = baseDesign.parse(raw ?? {})
  const entities = new Set(entityNames)
  const known = (n) => entities.size === 0 || entities.has(n)

  const stateMachines = d.stateMachines
    .filter((m) => known(m.entity) && m.states.length >= 2)
    .map((m) => {
      const ids = new Set(m.states.map((s) => s.id))
      return {
        ...m,
        initial: ids.has(m.initial) ? m.initial : m.states[0].id,
        finals: m.finals.filter((x) => ids.has(x)),
        transitions: m.transitions.filter((t) => ids.has(t.from) && ids.has(t.to)),
      }
    })
  const objects = d.objects.filter((o) => known(o.entity))
  const objectIds = new Set(objects.map((o) => o.id))
  const componentIds = new Set(d.components.map((c) => c.id))
  const nodeIds = new Set(d.deploymentNodes.map((n) => n.id))

  return {
    stateMachines,
    packages: d.packages
      .map((p) => ({ ...p, entities: p.entities.filter(known) }))
      .filter((p) => p.entities.length),
    objects,
    objectLinks: d.objectLinks.filter((l) => objectIds.has(l.from) && objectIds.has(l.to)),
    components: d.components.map((c) => ({
      ...c,
      dependsOn: c.dependsOn.filter((x) => componentIds.has(x) && x !== c.id),
    })),
    deploymentNodes: d.deploymentNodes.map((n) => ({
      ...n,
      components: n.components.filter((x) => componentIds.has(x)),
    })),
    deploymentLinks: d.deploymentLinks.filter((l) => nodeIds.has(l.from) && nodeIds.has(l.to)),
  }
}

export const hasDesign = (a) =>
  !!a?.design && Object.values(a.design).some((v) => Array.isArray(v) && v.length)
