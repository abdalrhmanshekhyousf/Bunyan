import { describe, expect, it } from 'vitest'
import { esc, toActivity, toClass, toER, toSequence, toUseCase } from '@/utils/toMermaid.js'
import { buildAll } from '@/utils/diagramRegistry.js'
import { emptyAnalysis } from '@/features/analysis/schema.js'
import { libraryAnalysis as a } from './fixtures/libraryAnalysis.js'

describe('esc', () => {
  it('يهرّب الرموز التي تكسر صياغة Mermaid أو تحقن HTML', () => {
    expect(esc('a "b" <script>; #x\nسطر')).toBe('a #quot;b#quot; #lt;script#gt;#59; #35;x سطر')
  })
  it('يحذف التطويل والأقواس', () => {
    expect(esc('يقوم بـ [x] {y}')).toBe('يقوم ب x y')
  })
})

describe('toUseCase', () => {
  const code = toUseCase(a, { title: 'نظام المكتبة' })
  it('يرسم الفاعلين دوائر وحالات الاستخدام داخل حدود النظام', () => {
    expect(code).toMatch(/^flowchart RL/)
    expect(code).toContain('act_Student(("طالب"))')
    expect(code).toContain('subgraph SYS["نظام المكتبة"]')
    expect(code).toContain('uc_BorrowBook(["استعارة كتاب"])')
  })
  it('يربط كل فاعل بحالاته', () => {
    expect(code).toContain('act_Student --- uc_SearchBooks & uc_BorrowBook')
  })
  it('يحمي المعرّفات من الكلمات المحجوزة مثل end', () => {
    expect(code).toContain('uc_end(')
    expect(code).not.toMatch(/^\s+end\(/m)
  })
})

describe('toClass', () => {
  const code = toClass(a)
  it('يكتب الأصناف بتسمياتها وخصائصها وعملياتها', () => {
    expect(code).toContain('class C_Student["طالب"] {')
    expect(code).toContain('+name: string')
    expect(code).toContain('+borrowBook()')
  })
  it('يحوّل التعدد إلى أسهم صحيحة', () => {
    expect(code).toContain('C_Student "1" --> "*" C_Borrowing : يجري')
    expect(code).toContain('C_Borrowing "*" --> "1" C_Book : تخص')
    expect(code).toContain('C_Book "*" -- "*" C_Author : كتبه')
  })
})

describe('toSequence', () => {
  const code = toSequence(a)
  it('يرتّب المشاركين: الفاعلون ثم النظام ثم الكيانات', () => {
    const order = [...code.matchAll(/^\s+(?:actor|participant) (\w+)/gm)].map((m) => m[1])
    expect(order).toEqual(['p_Student', 'p_System', 'p_Book', 'p_Borrowing'])
  })
  it('يستعمل خطاً متقطعاً للردود، وopt للشروط', () => {
    expect(code).toContain('p_System-->>p_Student: تأكيد #lt;الاستعارة#gt;')
    expect(code).toContain('opt الكتاب متاح؟')
  })
  it('يهرّب الفاصلة المنقوطة داخل الرسالة', () => {
    expect(code).toContain('إنشاء إعارة#59; لمدة 14 يوماً')
  })
})

describe('toActivity', () => {
  const code = toActivity(a)
  it('يبدأ وينتهي، ويحوّل الشرط إلى قرار بفرعين', () => {
    expect(code).toContain('START(["بداية"])')
    expect(code).toContain('D2{"الكتاب متاح؟"}')
    expect(code).toContain('D2 -- نعم --> S2')
    expect(code).toContain('D2 -- لا --> FINISH')
    expect(code.trim().endsWith('S4 --> FINISH')).toBe(true)
  })
  it('يكتب كلمات الإنجليزية عند اختيارها', () => {
    expect(toActivity(a, { lang: 'en' })).toContain('START(["Start"])')
  })
})

describe('toER', () => {
  const code = toER(a)
  it('يرسم العلاقات برموز التعدد', () => {
    expect(code).toContain('E_Student ||--o{ E_Borrowing : "يجري"')
    expect(code).toContain('E_Borrowing }o--|| E_Book : "تخص"')
    expect(code).toContain('E_Book }o--o{ E_Author : "كتبه"')
  })
  it('يضع التسمية داخل تعريف الكيان فقط (قيد T0.8)', () => {
    expect(code).toContain('E_Book["كتاب"] {')
    expect(code).not.toMatch(/E_\w+\["[^"]*"\] [|}]/)
  })
  it('يضيف المفاتيح الأجنبية في الطرف المتعدد', () => {
    const borrowing = code.slice(code.indexOf('E_Borrowing["'))
    expect(borrowing).toContain('int studentId FK "طالب"')
    expect(borrowing).toContain('int bookId FK "كتاب"')
  })
  it('يهرّب علامات التنصيص في التسميات', () => {
    expect(code).toContain('"العنوان #quot;الكامل#quot;"')
  })
})

describe('buildAll', () => {
  it('يعيد null للمخططات التي لا بيانات لها', () => {
    expect(Object.values(buildAll(emptyAnalysis())).every((x) => x === null)).toBe(true)
    expect(Object.keys(buildAll(emptyAnalysis()))).toHaveLength(11)
  })
})
