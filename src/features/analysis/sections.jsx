import { ArrowLeftRight, Key } from 'lucide-react'
import { Badge, Card } from '@/components/ui/index.js'
import { cn } from '@/utils/cn.js'
import { ATTRIBUTE_TYPES, CARDINALITIES } from './schema.js'
import { AddButton, Mono, RemoveButton, SelectField, TextField } from './fields.jsx'

// أقسام نتيجة التحليل (T4.8). كل النصوص تُعرض كنص عادي (T4.17): لا dangerouslySetInnerHTML
// كل قسم يستقبل: items، وedit، وonChange(items)، وa (التحليل كاملاً للمراجع)

export function Section({ title, count, icon: Icon, children, className }) {
  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      <h3 className="flex items-center gap-2 text-lg font-bold">
        {Icon && <Icon className="size-5 text-teal" />}
        {title}
        {count != null && <Badge>{count}</Badge>}
      </h3>
      {children}
    </Card>
  )
}

const update = (items, i, patch) => items.map((x, j) => (j === i ? { ...x, ...patch } : x))
const remove = (items, i) => items.filter((_, j) => j !== i)
const nextId = (items, prefix) => {
  const n = Math.max(0, ...items.map((x) => parseInt(String(x.id).replace(/\D/g, '')) || 0))
  return `${prefix}${n + 1}`
}
const Empty = () => <p className="text-sm text-slate-500">لا توجد عناصر.</p>

export function Requirements({ items, edit, onChange }) {
  if (!edit) {
    const groups = [
      ['functional', 'وظيفية'],
      ['nonFunctional', 'غير وظيفية'],
    ]
    return groups.map(([type, title]) => {
      const list = items.filter((r) => r.type === type)
      if (!list.length) return null
      return (
        <div key={type}>
          <p className="mb-2 text-sm font-semibold text-slate-500">{title}</p>
          <ul className="flex flex-col gap-2">
            {list.map((r) => (
              <li key={r.id + r.text} className="flex gap-3 leading-relaxed">
                <Mono>{r.id}</Mono>
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    })
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((r, i) => (
        <div key={i} className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
          <TextField
            label="الرمز"
            ltr
            value={r.id}
            onChange={(id) => onChange(update(items, i, { id }))}
            className="w-20"
          />
          <SelectField
            label="النوع"
            value={r.type}
            onChange={(type) => onChange(update(items, i, { type }))}
            options={[
              { value: 'functional', label: 'وظيفي' },
              { value: 'nonFunctional', label: 'غير وظيفي' },
            ]}
          />
          <TextField
            label="نص المتطلب"
            multiline
            value={r.text}
            onChange={(text) => onChange(update(items, i, { text }))}
          />
          <RemoveButton onClick={() => onChange(remove(items, i))} />
        </div>
      ))}
      <AddButton
        onClick={() =>
          onChange([...items, { id: nextId(items, 'FR'), type: 'functional', text: '' }])
        }
      >
        إضافة متطلب
      </AddButton>
    </div>
  )
}

export function Actors({ items, edit, onChange }) {
  if (!edit)
    return items.length ? (
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((x) => (
          <li key={x.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{x.label}</span>
              <Mono>{x.id}</Mono>
            </div>
            {x.description && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{x.description}</p>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <Empty />
    )
  return (
    <div className="flex flex-col gap-2">
      {items.map((x, i) => (
        <div key={i} className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
          <TextField
            label="الاسم"
            value={x.label}
            onChange={(label) => onChange(update(items, i, { label }))}
            className="sm:w-40"
          />
          <TextField
            label="المعرّف"
            ltr
            value={x.id}
            onChange={(id) => onChange(update(items, i, { id }))}
            className="sm:w-32"
          />
          <TextField
            label="الدور"
            value={x.description}
            onChange={(description) => onChange(update(items, i, { description }))}
          />
          <RemoveButton onClick={() => onChange(remove(items, i))} />
        </div>
      ))}
      <AddButton
        onClick={() =>
          onChange([...items, { id: `Actor${items.length + 1}`, label: '', description: '' }])
        }
      >
        إضافة فاعل
      </AddButton>
    </div>
  )
}

export function Functions({ items, edit, onChange, a }) {
  const actorLabel = Object.fromEntries(a.actors.map((x) => [x.id, x.label]))
  if (!edit)
    return items.length ? (
      <ul className="flex flex-col gap-3">
        {items.map((f) => (
          <li
            key={f.id}
            className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{f.label}</span>
              {f.actorIds.map((id) => (
                <Badge key={id} tone="navy">
                  {actorLabel[id] ?? id}
                </Badge>
              ))}
            </div>
            {f.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400">{f.description}</p>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <Empty />
    )
  return (
    <div className="flex flex-col gap-3">
      {items.map((f, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
        >
          <div className="flex gap-2">
            <TextField
              label="اسم حالة الاستخدام"
              value={f.label}
              onChange={(label) => onChange(update(items, i, { label }))}
            />
            <TextField
              label="المعرّف"
              ltr
              value={f.id}
              onChange={(id) => onChange(update(items, i, { id }))}
              className="w-36"
            />
            <RemoveButton onClick={() => onChange(remove(items, i))} />
          </div>
          <TextField
            label="الوصف"
            value={f.description}
            onChange={(description) => onChange(update(items, i, { description }))}
          />
          <div className="flex flex-wrap gap-2">
            {a.actors.map((x) => {
              const on = f.actorIds.includes(x.id)
              return (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    onChange(
                      update(items, i, {
                        actorIds: on ? f.actorIds.filter((y) => y !== x.id) : [...f.actorIds, x.id],
                      }),
                    )
                  }
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold ring-1',
                    on
                      ? 'bg-navy text-white ring-navy dark:bg-teal dark:text-ink dark:ring-teal'
                      : 'ring-slate-300 dark:ring-slate-700',
                  )}
                >
                  {x.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <AddButton
        onClick={() =>
          onChange([
            ...items,
            { id: `UseCase${items.length + 1}`, label: '', actorIds: [], description: '' },
          ])
        }
      >
        إضافة حالة استخدام
      </AddButton>
    </div>
  )
}

const TYPE_LABELS = {
  string: 'نص قصير',
  text: 'نص طويل',
  int: 'عدد صحيح',
  decimal: 'عدد عشري',
  boolean: 'نعم/لا',
  date: 'تاريخ',
  datetime: 'تاريخ ووقت',
}

export function Entities({ items, edit, onChange }) {
  if (!edit)
    return items.length ? (
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((e) => (
          <div
            key={e.name}
            className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between bg-navy px-3 py-2 text-white dark:bg-slate-800">
              <span className="font-bold">{e.label}</span>
              <code dir="ltr" className="font-mono text-xs opacity-80">
                {e.name}
              </code>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {e.attributes.map((x) => (
                  <tr
                    key={x.name}
                    className="border-t border-slate-100 first:border-0 dark:border-slate-800"
                  >
                    <td className="px-3 py-1.5">
                      <span className="flex items-center gap-1.5">
                        {x.isPrimaryKey && (
                          <Key className="size-3.5 text-amber-500" aria-label="مفتاح أساسي" />
                        )}
                        {x.label}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-end font-mono text-xs text-slate-500" dir="ltr">
                      {x.name}: {x.type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {e.methods.length > 0 && (
              <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-800">
                العمليات: {e.methods.map((m) => m.label).join('، ')}
              </p>
            )}
          </div>
        ))}
      </div>
    ) : (
      <Empty />
    )

  return (
    <div className="flex flex-col gap-4">
      {items.map((e, i) => {
        const setAttrs = (attributes) => onChange(update(items, i, { attributes }))
        return (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <div className="flex gap-2">
              <TextField
                label="اسم الكيان"
                value={e.label}
                onChange={(label) => onChange(update(items, i, { label }))}
              />
              <TextField
                label="المعرّف"
                ltr
                value={e.name}
                onChange={(name) => onChange(update(items, i, { name }))}
                className="w-36"
              />
              <RemoveButton label="حذف الكيان" onClick={() => onChange(remove(items, i))} />
            </div>
            {e.attributes.map((x, k) => (
              <div key={k} className="flex flex-wrap items-center gap-2 ps-3 sm:flex-nowrap">
                <TextField
                  label="الخاصية"
                  value={x.label}
                  onChange={(label) => setAttrs(update(e.attributes, k, { label }))}
                />
                <TextField
                  label="المعرّف"
                  ltr
                  value={x.name}
                  onChange={(name) => setAttrs(update(e.attributes, k, { name }))}
                  className="sm:w-32"
                />
                <SelectField
                  label="النوع"
                  value={x.type}
                  onChange={(type) => setAttrs(update(e.attributes, k, { type }))}
                  options={ATTRIBUTE_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
                />
                <label className="flex shrink-0 items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={x.isPrimaryKey}
                    onChange={(ev) =>
                      setAttrs(update(e.attributes, k, { isPrimaryKey: ev.target.checked }))
                    }
                  />
                  مفتاح
                </label>
                <RemoveButton
                  label="حذف الخاصية"
                  onClick={() => setAttrs(remove(e.attributes, k))}
                />
              </div>
            ))}
            <AddButton
              onClick={() =>
                setAttrs([
                  ...e.attributes,
                  {
                    name: `field${e.attributes.length + 1}`,
                    label: '',
                    type: 'string',
                    isPrimaryKey: false,
                    isRequired: false,
                    isUnique: false,
                  },
                ])
              }
            >
              إضافة خاصية
            </AddButton>
          </div>
        )
      })}
      <AddButton
        onClick={() =>
          onChange([
            ...items,
            {
              name: `Entity${items.length + 1}`,
              label: '',
              methods: [],
              attributes: [
                {
                  name: 'id',
                  label: 'المعرّف',
                  type: 'int',
                  isPrimaryKey: true,
                  isRequired: true,
                  isUnique: true,
                },
              ],
            },
          ])
        }
      >
        إضافة كيان
      </AddButton>
    </div>
  )
}

const CARD_LABELS = {
  '1:1': 'واحد لواحد',
  '1:N': 'واحد لمتعدد',
  'N:1': 'متعدد لواحد',
  'M:N': 'متعدد لمتعدد',
}

export function Relationships({ items, edit, onChange, a }) {
  const label = Object.fromEntries(a.entities.map((e) => [e.name, e.label]))
  if (!edit)
    return items.length ? (
      <ul className="flex flex-col gap-2">
        {items.map((r) => (
          <li key={r.from + r.to} className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{label[r.from] ?? r.from}</span>
            <span className="text-slate-500">{r.label}</span>
            <span className="font-semibold">{label[r.to] ?? r.to}</span>
            <Badge tone="teal">
              <ArrowLeftRight className="size-3" />
              {CARD_LABELS[r.cardinality]} <bdi dir="ltr">({r.cardinality})</bdi>
            </Badge>
          </li>
        ))}
      </ul>
    ) : (
      <Empty />
    )
  const opts = a.entities.map((e) => ({ value: e.name, label: e.label || e.name }))
  return (
    <div className="flex flex-col gap-2">
      {items.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <SelectField
            label="من"
            value={r.from}
            options={opts}
            onChange={(from) => onChange(update(items, i, { from }))}
          />
          <TextField
            label="العلاقة"
            value={r.label}
            onChange={(l) => onChange(update(items, i, { label: l }))}
            className="w-32"
          />
          <SelectField
            label="إلى"
            value={r.to}
            options={opts}
            onChange={(to) => onChange(update(items, i, { to }))}
          />
          <SelectField
            label="التعدد"
            value={r.cardinality}
            options={CARDINALITIES.map((c) => ({ value: c, label: `${CARD_LABELS[c]} (2066${c}2069)` }))}
            onChange={(cardinality) => onChange(update(items, i, { cardinality }))}
          />
          <RemoveButton onClick={() => onChange(remove(items, i))} />
        </div>
      ))}
      {opts.length >= 1 && (
        <AddButton
          onClick={() =>
            onChange([
              ...items,
              { from: opts[0].value, to: opts.at(-1).value, cardinality: '1:N', label: '' },
            ])
          }
        >
          إضافة علاقة
        </AddButton>
      )}
    </div>
  )
}

export function Rules({ items, edit, onChange }) {
  if (!edit)
    return items.length ? (
      <ul className="flex flex-col gap-2">
        {items.map((r) => (
          <li key={r.id + r.text} className="flex gap-3 leading-relaxed">
            <Mono>{r.id}</Mono>
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    ) : (
      <Empty />
    )
  return (
    <div className="flex flex-col gap-2">
      {items.map((r, i) => (
        <div key={i} className="flex items-start gap-2">
          <TextField
            label="الرمز"
            ltr
            value={r.id}
            onChange={(id) => onChange(update(items, i, { id }))}
            className="w-20"
          />
          <TextField
            label="القاعدة"
            multiline
            value={r.text}
            onChange={(text) => onChange(update(items, i, { text }))}
          />
          <RemoveButton onClick={() => onChange(remove(items, i))} />
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, { id: nextId(items, 'BR'), text: '' }])}>
        إضافة قاعدة
      </AddButton>
    </div>
  )
}
