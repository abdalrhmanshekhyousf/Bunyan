import { useTranslation } from 'react-i18next'
import { Key, Link2 } from 'lucide-react'
import { ATTRIBUTE_TYPES } from '@/features/analysis/schema.js'
import { AddButton, RemoveButton, SelectField, TextField } from '@/features/analysis/fields.jsx'
import { snake } from '@/utils/toTables.js'
import { cn } from '@/utils/cn.js'

// محرّر الجداول (T6.4): إضافة الأعمدة وحذفها، وتغيير النوع، وتحديد PK وFK
const pkOf = (t) => t.columns.find((c) => c.pk) ?? t.columns[0]

export default function TableEditor({ tables, onChange, readOnly }) {
  const { t } = useTranslation('database')

  const setTable = (i, patch) => onChange(tables.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  function setColumn(i, k, patch) {
    const table = tables[i]
    const columns = table.columns.map((c, j) => (j === k ? { ...c, ...patch } : c))
    // إعادة تسمية العمود تُحدّث مفتاحه الأجنبي
    let foreignKeys = table.foreignKeys
    if (patch.name && patch.name !== table.columns[k].name)
      foreignKeys = foreignKeys.map((f) =>
        f.column === table.columns[k].name ? { ...f, column: patch.name } : f,
      )
    setTable(i, { columns, foreignKeys })
  }

  function setReference(i, k, refTable) {
    const table = tables[i]
    const col = table.columns[k]
    const others = table.foreignKeys.filter((f) => f.column !== col.name)
    const target = tables.find((x) => x.name === refTable)
    const foreignKeys = target
      ? [...others, { column: col.name, refTable, refColumn: pkOf(target).name }]
      : others
    const columns = table.columns.map((c, j) => (j === k ? { ...c, fk: !!target } : c))
    setTable(i, { columns, foreignKeys })
  }

  function removeColumn(i, k) {
    const table = tables[i]
    const name = table.columns[k].name
    setTable(i, {
      columns: table.columns.filter((_, j) => j !== k),
      foreignKeys: table.foreignKeys.filter((f) => f.column !== name),
    })
  }

  function removeTable(i) {
    const name = tables[i].name
    // نحذف المفاتيح الأجنبية التي تشير إليه في الجداول الأخرى
    onChange(
      tables
        .filter((_, j) => j !== i)
        .map((x) => ({
          ...x,
          foreignKeys: x.foreignKeys.filter((f) => f.refTable !== name),
          columns: x.columns.map((c) =>
            x.foreignKeys.some((f) => f.column === c.name && f.refTable === name)
              ? { ...c, fk: false }
              : c,
          ),
        })),
    )
  }

  const addTable = () => {
    const taken = new Set(tables.map((x) => x.name))
    let n = 1
    while (taken.has(`table_${n}`)) n++
    onChange([
      ...tables,
      {
        name: `table_${n}`,
        label: '',
        entity: null,
        foreignKeys: [],
        columns: [
          {
            name: 'id',
            label: '',
            type: 'int',
            pk: true,
            notNull: true,
            unique: false,
            autoIncrement: true,
          },
        ],
      },
    ])
  }

  const typeOptions = ATTRIBUTE_TYPES.map((x) => ({ value: x, label: t(`types.${x}`) }))

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {tables.map((table, i) => {
        const fkOf = Object.fromEntries(table.foreignKeys.map((f) => [f.column, f.refTable]))
        return (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-2 bg-navy px-3 py-2 text-white dark:bg-slate-800">
              {readOnly ? (
                <span dir="ltr" className="font-mono font-semibold">
                  {table.name}
                </span>
              ) : (
                <input
                  dir="ltr"
                  value={table.name}
                  aria-label={t('tableName')}
                  onChange={(e) => setTable(i, { name: snake(e.target.value) || e.target.value })}
                  className="w-40 rounded bg-white/10 px-2 py-1 font-mono text-sm outline-none focus:bg-white/20"
                />
              )}
              <span className="truncate text-sm opacity-80">{table.label}</span>
              {table.junction && (
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-xs">{t('junction')}</span>
              )}
              {!readOnly && (
                <span className="ms-auto [&_button]:text-white/70 [&_button:hover]:bg-white/10">
                  <RemoveButton label={t('removeTable')} onClick={() => removeTable(i)} />
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-2 py-1.5 text-start font-semibold">{t('column')}</th>
                    <th className="px-2 py-1.5 text-start font-semibold">{t('type')}</th>
                    <th className="px-2 py-1.5 font-semibold" title={t('pkHint')}>
                      PK
                    </th>
                    <th className="px-2 py-1.5 font-semibold" title={t('notNullHint')}>
                      NN
                    </th>
                    <th className="px-2 py-1.5 font-semibold" title={t('uniqueHint')}>
                      UQ
                    </th>
                    <th className="px-2 py-1.5 text-start font-semibold">{t('references')}</th>
                    {!readOnly && <th />}
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((c, k) => (
                    <tr key={k} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-2 py-1">
                        {readOnly ? (
                          <span dir="ltr" className="flex items-center gap-1 font-mono text-xs">
                            {c.pk && <Key className="size-3.5 text-amber-500" />}
                            {fkOf[c.name] && <Link2 className="size-3.5 text-teal" />}
                            {c.name}
                          </span>
                        ) : (
                          <TextField
                            label={t('column')}
                            ltr
                            value={c.name}
                            onChange={(v) => setColumn(i, k, { name: snake(v) || v })}
                            className="min-w-28"
                          />
                        )}
                      </td>
                      <td className="px-2 py-1">
                        {readOnly ? (
                          t(`types.${c.type}`)
                        ) : (
                          <SelectField
                            label={t('type')}
                            value={c.type}
                            options={typeOptions}
                            onChange={(type) => setColumn(i, k, { type })}
                          />
                        )}
                      </td>
                      {['pk', 'notNull', 'unique'].map((flag) => (
                        <td key={flag} className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={!!c[flag]}
                            disabled={readOnly}
                            aria-label={t(`${flag}Hint`)}
                            onChange={(e) =>
                              setColumn(i, k, {
                                [flag]: e.target.checked,
                                ...(flag === 'pk' && !e.target.checked
                                  ? { autoIncrement: false }
                                  : {}),
                              })
                            }
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1">
                        {readOnly ? (
                          <span
                            dir="ltr"
                            className={cn('font-mono text-xs', !fkOf[c.name] && 'text-slate-400')}
                          >
                            {fkOf[c.name] ?? '—'}
                          </span>
                        ) : (
                          <SelectField
                            label={t('references')}
                            value={fkOf[c.name] ?? ''}
                            options={[
                              { value: '', label: '—' },
                              // يشمل الجدول نفسه (علاقة ذاتية مثل مدير الموظف)
                              ...tables.map((x) => ({ value: x.name, label: x.name })),
                            ]}
                            onChange={(v) => setReference(i, k, v)}
                          />
                        )}
                      </td>
                      {!readOnly && (
                        <td className="px-1">
                          <RemoveButton
                            label={t('removeColumn')}
                            onClick={() => removeColumn(i, k)}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!readOnly && (
              <div className="border-t border-slate-100 p-2 dark:border-slate-800">
                <AddButton
                  onClick={() =>
                    setTable(i, {
                      columns: [
                        ...table.columns,
                        {
                          name: `column_${table.columns.length + 1}`,
                          label: '',
                          type: 'string',
                          pk: false,
                          notNull: false,
                          unique: false,
                          autoIncrement: false,
                        },
                      ],
                    })
                  }
                >
                  {t('addColumn')}
                </AddButton>
              </div>
            )}
          </div>
        )
      })}
      {!readOnly && (
        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 dark:border-slate-800">
          <AddButton onClick={addTable}>{t('addTable')}</AddButton>
        </div>
      )}
    </div>
  )
}
