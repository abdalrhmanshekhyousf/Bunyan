import { z } from 'zod'

// بنية نتيجة التحليل (T4.4). المعرّفات إنجليزية دائماً (تصلح لـ Mermaid وSQL)،
// والتسميات (label) بلغة المشروع. انظر docs/T0-arabic-experiments.md
export const ATTRIBUTE_TYPES = ['string', 'text', 'int', 'decimal', 'boolean', 'date', 'datetime']
export const CARDINALITIES = ['1:1', '1:N', 'N:1', 'M:N']
export const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/

export const LIMITS = {
  requirements: 40,
  actors: 12,
  entities: 20,
  attributes: 20,
  methods: 10,
  functions: 30,
  relationships: 40,
  rules: 30,
  scenarioSteps: 20,
  text: 400,
  label: 80,
}

// مخطط JSON يُمرَّر إلى Gemini كـ responseJsonSchema
// ملاحظة: لا maxLength ولا maxItems ولا pattern هنا؛ Gemini يرفض المخطط المعقّد
// ("too many states")، والحدود يفرضها Zod بعد الاستجابة
// eslint-disable-next-line no-unused-vars
const str = (description, _max) => ({ type: 'string', description })
const ident = (description) => ({ type: 'string', description })
// eslint-disable-next-line no-unused-vars
const arr = (items, _max) => ({ type: 'array', items })
const obj = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  properties,
  required,
})

export const analysisJsonSchema = obj({
  summary: str('One-paragraph summary of the system in the output language', LIMITS.text),
  requirements: arr(
    obj({
      id: str('FR1, FR2… for functional; NFR1… for non-functional', 10),
      type: { type: 'string', enum: ['functional', 'nonFunctional'] },
      text: str('The requirement, one sentence', LIMITS.text),
    }),
    LIMITS.requirements,
  ),
  actors: arr(
    obj({
      id: ident('PascalCase English identifier, e.g. Student'),
      label: str('Display name in the output language'),
      description: str('Role of this actor', LIMITS.text),
    }),
    LIMITS.actors,
  ),
  entities: arr(
    obj({
      name: ident('PascalCase English singular, e.g. Book'),
      label: str('Display name in the output language'),
      attributes: arr(
        obj(
          {
            name: ident('camelCase English, e.g. publishYear'),
            label: str('Display name in the output language'),
            type: { type: 'string', enum: ATTRIBUTE_TYPES },
            isPrimaryKey: { type: 'boolean' },
            isRequired: { type: 'boolean' },
            isUnique: { type: 'boolean' },
          },
          ['name', 'label', 'type', 'isPrimaryKey'],
        ),
        LIMITS.attributes,
      ),
      methods: arr(
        obj({ name: ident('camelCase verb, e.g. borrowBook'), label: str('Display name') }),
        LIMITS.methods,
      ),
    }),
    LIMITS.entities,
  ),
  functions: arr(
    obj({
      id: ident('PascalCase use-case identifier, e.g. BorrowBook'),
      label: str('Use-case name in the output language'),
      actorIds: arr(ident('An actor id from actors'), LIMITS.actors),
      description: str('What happens in this use case', LIMITS.text),
    }),
    LIMITS.functions,
  ),
  relationships: arr(
    obj({
      from: ident('Entity name'),
      to: ident('Entity name'),
      cardinality: { type: 'string', enum: CARDINALITIES },
      label: str('Verb phrase in the output language, e.g. "يستعير"'),
    }),
    LIMITS.relationships,
  ),
  rules: arr(
    obj({ id: str('BR1, BR2…', 10), text: str('A business rule or constraint', LIMITS.text) }),
    LIMITS.rules,
  ),
  scenario: obj({
    label: str('Name of the main scenario in the output language'),
    steps: arr(
      obj({
        from: ident('Actor id, entity name, or System'),
        to: ident('Actor id, entity name, or System'),
        message: str('Short action in the output language'),
        condition: str('Optional decision/guard in the output language; empty if none'),
      }),
      LIMITS.scenarioSteps,
    ),
  }),
})

// ── التحقق والتنظيف (T4.16) ─────────────────────────────────────────────
const clip = (max) =>
  z
    .string()
    .trim()
    .transform((s) => s.slice(0, max))
const label = clip(LIMITS.label).pipe(z.string().min(1))
const text = clip(LIMITS.text)
const id = z
  .string()
  .trim()
  .transform((s) =>
    s
      .replace(/[^A-Za-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/^(\d)/, '_$1')
      .slice(0, 60),
  )
  .pipe(z.string().regex(IDENT))

const list = (schema, max) =>
  z
    .array(z.unknown())
    .default([])
    // نتجاهل العنصر المعطوب بدل رفض النتيجة كلها
    .transform((xs) =>
      xs
        .flatMap((x) => {
          const r = schema.safeParse(x)
          return r.success ? [r.data] : []
        })
        .slice(0, max),
    )

const attribute = z.object({
  name: id,
  label,
  type: z.enum(ATTRIBUTE_TYPES).catch('string'),
  isPrimaryKey: z.boolean().catch(false),
  isRequired: z.boolean().catch(false),
  isUnique: z.boolean().catch(false),
})

export const analysisSchema = z
  .object({
    summary: text.default(''),
    requirements: list(
      z.object({
        id: clip(10),
        type: z.enum(['functional', 'nonFunctional']).catch('functional'),
        text: text.pipe(z.string().min(1)),
      }),
      LIMITS.requirements,
    ),
    actors: list(z.object({ id, label, description: text.default('') }), LIMITS.actors),
    entities: list(
      z.object({
        name: id,
        label,
        attributes: list(attribute, LIMITS.attributes),
        methods: list(z.object({ name: id, label }), LIMITS.methods),
      }),
      LIMITS.entities,
    ),
    functions: list(
      z.object({
        id,
        label,
        actorIds: z.array(id).catch([]),
        description: text.default(''),
      }),
      LIMITS.functions,
    ),
    relationships: list(
      z.object({
        from: id,
        to: id,
        cardinality: z.enum(CARDINALITIES).catch('1:N'),
        label: clip(LIMITS.label).default(''),
      }),
      LIMITS.relationships,
    ),
    rules: list(z.object({ id: clip(10), text: text.pipe(z.string().min(1)) }), LIMITS.rules),
    scenario: z
      .object({
        label: clip(LIMITS.label).default(''),
        steps: list(
          z.object({ from: id, to: id, message: label, condition: clip(LIMITS.label).default('') }),
          LIMITS.scenarioSteps,
        ),
      })
      .catch({ label: '', steps: [] }),
  })
  .transform(normalize)

// إصلاح المراجع: إزالة التكرار، وحذف العلاقات/الفاعلين الذين يشيرون إلى غير موجود
function normalize(a) {
  const uniq = (xs, key) => {
    const seen = new Set()
    return xs.filter((x) => !seen.has(key(x).toLowerCase()) && seen.add(key(x).toLowerCase()))
  }
  const actors = uniq(a.actors, (x) => x.id)
  const entities = uniq(a.entities, (x) => x.name).map((e) => {
    const attributes = uniq(e.attributes, (x) => x.name)
    // كل كيان يحتاج مفتاحاً أساسياً
    if (!attributes.some((x) => x.isPrimaryKey))
      attributes.unshift({
        name: 'id',
        label: 'id',
        type: 'int',
        isPrimaryKey: true,
        isRequired: true,
        isUnique: true,
      })
    return { ...e, attributes, methods: uniq(e.methods, (x) => x.name) }
  })
  const actorIds = new Set(actors.map((x) => x.id))
  const entityNames = new Set(entities.map((x) => x.name))
  const participants = new Set([...actorIds, ...entityNames, 'System'])

  return {
    ...a,
    actors,
    entities,
    functions: uniq(a.functions, (x) => x.id).map((f) => ({
      ...f,
      actorIds: [...new Set(f.actorIds)].filter((x) => actorIds.has(x)),
    })),
    relationships: uniq(
      a.relationships.filter((r) => entityNames.has(r.from) && entityNames.has(r.to)),
      (r) => `${r.from}-${r.to}`,
    ),
    scenario: {
      ...a.scenario,
      steps: a.scenario.steps.filter((s) => participants.has(s.from) && participants.has(s.to)),
    },
  }
}

export const emptyAnalysis = () => analysisSchema.parse({})
