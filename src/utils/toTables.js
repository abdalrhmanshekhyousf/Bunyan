// تحويل الكيانات والعلاقات إلى جداول (T6.1): أعمدة وأنواع، ومفاتيح أساسية وأجنبية،
// وجدول وسيط لكل علاقة متعدد-لمتعدد.

// BookCopy → book_copy
export const snake = (s) =>
  String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()

// جمع إنجليزي مبسّط لأسماء الجداول: book → books، category → categories، class → classes
export function plural(word) {
  if (/(s|x|z|ch|sh)$/.test(word)) return `${word}es`
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`
  return `${word}s`
}

const tableName = (entityName) => {
  const parts = snake(entityName).split('_')
  parts[parts.length - 1] = plural(parts.at(-1))
  return parts.join('_')
}

function uniqueName(name, taken) {
  let n = name
  for (let i = 2; taken.has(n); i++) n = `${name}_${i}`
  taken.add(n)
  return n
}

export function toTables(a) {
  const tables = []
  const byEntity = {}

  for (const e of a.entities) {
    const taken = new Set()
    const columns = e.attributes.map((x) => ({
      name: uniqueName(snake(x.name) || 'col', taken),
      label: x.label,
      type: x.type,
      pk: x.isPrimaryKey,
      notNull: x.isPrimaryKey || x.isRequired,
      unique: x.isUnique && !x.isPrimaryKey,
      autoIncrement:
        x.isPrimaryKey &&
        x.type === 'int' &&
        e.attributes.filter((y) => y.isPrimaryKey).length === 1,
    }))
    const table = {
      name: tableName(e.name),
      entity: e.name,
      label: e.label,
      columns,
      foreignKeys: [],
      taken,
    }
    tables.push(table)
    byEntity[e.name] = table
  }

  const pkOf = (t) => t.columns.find((c) => c.pk) ?? t.columns[0]

  // يضيف إلى child عموداً يشير إلى المفتاح الأساسي لـ parent
  function addFk(child, parent, { unique = false, label, onDelete, name } = {}) {
    const ref = pkOf(parent)
    const base =
      name ??
      (child === parent ? `parent_${snake(parent.entity)}_id` : `${snake(parent.entity)}_id`)
    // عمود بالاسم نفسه أنشأه التحليل (ليس مفتاحاً أساسياً) نجعله المفتاح الأجنبي
    const existing = child.columns.find((c) => c.name === base && !c.pk && !c.fk)
    const col = existing ?? {
      name: uniqueName(base, child.taken),
      label: label ?? parent.label,
      type: ref.type,
      pk: false,
      notNull: false,
      unique,
      autoIncrement: false,
    }
    if (!existing) child.columns.push(col)
    col.fk = true
    child.foreignKeys.push({
      column: col.name,
      refTable: parent.name,
      refColumn: ref.name,
      onDelete,
    })
  }

  for (const r of a.relationships) {
    const from = byEntity[r.from]
    const to = byEntity[r.to]
    if (!from || !to) continue
    if (r.cardinality === '1:N') addFk(to, from)
    else if (r.cardinality === 'N:1') addFk(from, to)
    else if (r.cardinality === '1:1') addFk(to, from, { unique: true })
    else if (r.cardinality === 'M:N') {
      // جدول وسيط بمفتاح مركّب من المفتاحين الأجنبيين
      const taken = new Set(tables.map((t) => t.name))
      const name = uniqueName(`${snake(from.entity)}_${snake(to.entity)}`, taken)
      const junction = {
        name,
        entity: null,
        label: r.label ? `${from.label} — ${to.label} (${r.label})` : `${from.label} — ${to.label}`,
        columns: [],
        foreignKeys: [],
        taken: new Set(),
        junction: true,
      }
      addFk(junction, from, { onDelete: 'CASCADE' })
      // علاقة الكيان بنفسه (طالب يصادق طالباً): العمود الثاني باسم مختلف
      addFk(junction, to, {
        onDelete: 'CASCADE',
        name: from === to ? `related_${snake(to.entity)}_id` : undefined,
      })
      junction.columns.forEach((c) => {
        c.pk = true
        c.notNull = true
      })
      tables.push(junction)
    }
  }

  return tables.map(({ taken: _t, ...t }) => t)
}

// ترتيب الإنشاء: الجدول المشار إليه قبل الجدول الذي يشير إليه. الحلقات تُكسر وتُعاد إليها
// المفاتيح بـ ALTER TABLE لاحقاً (deferred)
export function creationOrder(tables) {
  const byName = Object.fromEntries(tables.map((t) => [t.name, t]))
  const done = new Set()
  const visiting = new Set()
  const order = []
  const deferred = []

  function visit(t) {
    if (done.has(t.name)) return
    visiting.add(t.name)
    for (const fk of t.foreignKeys) {
      const ref = byName[fk.refTable]
      if (!ref || ref === t || done.has(ref.name)) continue
      if (visiting.has(ref.name)) deferred.push({ table: t.name, fk })
      else visit(ref)
    }
    visiting.delete(t.name)
    done.add(t.name)
    order.push(t)
  }
  tables.forEach(visit)
  return { order, deferred }
}
