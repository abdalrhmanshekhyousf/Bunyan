import { describe, expect, it } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { creationOrder, plural, snake, toTables } from '@/utils/toTables.js'
import { toSQL } from '@/utils/toSQL.js'
import { analysisSchema } from '@/features/analysis/schema.js'
import { libraryAnalysis as a } from './fixtures/libraryAnalysis.js'

const tables = toTables(a)
const byName = Object.fromEntries(tables.map((t) => [t.name, t]))

describe('الأسماء', () => {
  it('snake_case والجمع', () => {
    expect(snake('BookCopy')).toBe('book_copy')
    expect(snake('dueDate')).toBe('due_date')
    expect(snake('ISBNCode')).toBe('isbn_code')
    expect(['book', 'category', 'class', 'box', 'day'].map(plural)).toEqual([
      'books',
      'categories',
      'classes',
      'boxes',
      'days',
    ])
  })
})

describe('toTables', () => {
  it('جدول لكل كيان باسم جمع، وأعمدة snake_case', () => {
    expect(Object.keys(byName)).toEqual(
      expect.arrayContaining(['students', 'books', 'authors', 'borrowings']),
    )
    expect(byName.borrowings.columns.map((c) => c.name)).toContain('due_date')
  })
  it('1:N و N:1 يضعان المفتاح الأجنبي في الطرف المتعدد', () => {
    expect(byName.borrowings.foreignKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ column: 'student_id', refTable: 'students', refColumn: 'id' }),
        expect.objectContaining({ column: 'book_id', refTable: 'books', refColumn: 'id' }),
      ]),
    )
  })
  it('M:N يولّد جدولاً وسيطاً بمفتاح مركّب وحذف متتالٍ', () => {
    const j = byName.book_author
    expect(j.junction).toBe(true)
    expect(j.columns.map((c) => [c.name, c.pk])).toEqual([
      ['book_id', true],
      ['author_id', true],
    ])
    expect(j.foreignKeys.every((f) => f.onDelete === 'CASCADE')).toBe(true)
  })
  it('علاقة الكيان بنفسه وعلاقتان بين الكيانين نفسيهما لا تتصادم أسماؤها', () => {
    const t = toTables(
      analysisSchema.parse({
        entities: [
          { name: 'Employee', label: 'موظف', attributes: [], methods: [] },
          { name: 'Task', label: 'مهمة', attributes: [], methods: [] },
        ],
        relationships: [
          { from: 'Employee', to: 'Employee', cardinality: '1:N', label: 'يدير' },
          { from: 'Employee', to: 'Task', cardinality: '1:N', label: 'ينشئ' },
          { from: 'Task', to: 'Employee', cardinality: 'N:1', label: 'مسندة إلى' },
        ],
      }),
    )
    const emp = t.find((x) => x.name === 'employees')
    const task = t.find((x) => x.name === 'tasks')
    expect(emp.foreignKeys[0].column).toBe('parent_employee_id')
    expect(task.foreignKeys.map((f) => f.column)).toEqual(['employee_id', 'employee_id_2'])
  })
})

describe('creationOrder', () => {
  it('ينشئ الجدول المشار إليه أولاً', () => {
    const names = creationOrder(tables).order.map((t) => t.name)
    expect(names.indexOf('students')).toBeLessThan(names.indexOf('borrowings'))
    expect(names.indexOf('books')).toBeLessThan(names.indexOf('borrowings'))
    expect(names.indexOf('authors')).toBeLessThan(names.indexOf('book_author'))
  })
  it('يكسر الحلقات ويؤجّل مفاتيحها', () => {
    const cyc = toTables(
      analysisSchema.parse({
        entities: [
          { name: 'A', label: 'أ', attributes: [], methods: [] },
          { name: 'B', label: 'ب', attributes: [], methods: [] },
        ],
        relationships: [
          { from: 'A', to: 'B', cardinality: '1:N', label: '' },
          { from: 'B', to: 'A', cardinality: '1:1', label: '' },
        ],
      }),
    )
    expect(creationOrder(cyc).deferred).toHaveLength(1)
    expect(toSQL(cyc, 'mysql')).toMatch(/ALTER TABLE \w+ ADD CONSTRAINT/)
  })
})

describe('toSQL', () => {
  it('SQLite: الشيفرة تُنفَّذ فعلاً وتفرض المفاتيح الأجنبية', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(toSQL(tables, 'sqlite'))
    const names = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((r) => r.name)
    expect(names).toEqual(
      expect.arrayContaining(['students', 'books', 'borrowings', 'book_author']),
    )
    db.exec("INSERT INTO students (name) VALUES ('أحمد')")
    expect(() => db.exec('INSERT INTO borrowings (due_date, student_id) VALUES (1, 999)')).toThrow(
      /FOREIGN KEY/,
    )
  })
  it('MySQL: AUTO_INCREMENT وCOMMENT بالعربية وInnoDB', () => {
    const sql = toSQL(tables, 'mysql', { title: 'المكتبة' })
    expect(sql).toContain('id INT AUTO_INCREMENT PRIMARY KEY')
    expect(sql).toContain("COMMENT 'الاسم'")
    expect(sql).toContain('ENGINE=InnoDB DEFAULT CHARSET=utf8mb4')
    expect(sql).toContain('FOREIGN KEY (student_id) REFERENCES students(id)')
  })
  it('PostgreSQL: IDENTITY وCOMMENT ON وفهارس للمفاتيح الأجنبية', () => {
    const sql = toSQL(tables, 'postgres')
    expect(sql).toContain('id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY')
    expect(sql).toContain("COMMENT ON COLUMN students.name IS 'الاسم';")
    expect(sql).toContain('CREATE INDEX idx_borrowings_student_id ON borrowings(student_id);')
    expect(sql).toContain('PRIMARY KEY (book_id, author_id)')
  })
  it('يحيط الكلمات المحجوزة بعلامات التنصيص ويهرّب الفاصلة العليا', () => {
    const t = toTables(
      analysisSchema.parse({
        entities: [
          {
            name: 'Order',
            label: "طلب الزبون's",
            attributes: [
              { name: 'id', label: 'id', type: 'int', isPrimaryKey: true },
              { name: 'date', label: 'التاريخ', type: 'date', isPrimaryKey: false },
            ],
            methods: [],
          },
        ],
      }),
    )
    const sql = toSQL(t, 'mysql')
    expect(sql).toContain('CREATE TABLE orders (')
    expect(sql).toContain('`date` DATE')
    expect(sql).toContain("COMMENT='طلب الزبون''s'")
  })
})
