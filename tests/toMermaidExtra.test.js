import { describe, expect, it } from 'vitest'
import {
  toCollaboration,
  toComponent,
  toDeployment,
  toObject,
  toPackage,
  toState,
} from '@/utils/toMermaidExtra.js'
import { emptyAnalysis } from '@/features/analysis/schema.js'
import { hasDesign } from '@/features/analysis/designSchema.js'
import { libraryAnalysis as a } from './fixtures/libraryAnalysis.js'

describe('تنظيف بيانات التصميم', () => {
  const d = a.design
  it('يحذف دورة حياة كيان غير موجود والانتقالات والحالات النهائية المعطوبة', () => {
    expect(d.stateMachines).toHaveLength(1)
    expect(d.stateMachines[0].finals).toEqual(['Returned'])
    expect(d.stateMachines[0].transitions).toHaveLength(4)
  })
  it('يحذف المراجع المعطوبة في الحِزم والروابط والمكوّنات', () => {
    expect(d.packages.find((p) => p.id === 'Loans').entities).toEqual(['Borrowing'])
    expect(d.objectLinks).toHaveLength(2)
    expect(d.components[0].dependsOn).toEqual(['LoanService'])
  })
  it('يعرف وجود بيانات التصميم', () => {
    expect(hasDesign(a)).toBe(true)
    expect(hasDesign(emptyAnalysis())).toBe(false)
  })
})

describe('toState', () => {
  const code = toState(a)
  it('يكتب الحالات بتسمياتها، والبداية والنهاية', () => {
    expect(code).toMatch(/^stateDiagram-v2/)
    expect(code).toContain('state "نشطة" as s0_Active')
    expect(code).toContain('[*] --> s0_Requested')
    expect(code).toContain('s0_Returned --> [*]')
  })
  it('يحذف النقطتين والأقواس من أسماء الأحداث', () => {
    expect(code).toContain('s0_Active --> s0_Overdue : تجاوز تاريخ الاستحقاق')
    expect(code).toContain(': سداد الغرامة 500')
  })
})

describe('toCollaboration', () => {
  const code = toCollaboration(a)
  it('يرقّم الرسائل على الروابط بترتيب السيناريو', () => {
    expect(code).toContain('p_Student -->|"1: يطلب استعارة كتاب"| p_System')
    expect(code).toContain('p_System -->|"5: تأكيد #lt;الاستعارة#gt;"| p_Student')
  })
  it('يكتب الكائنات بنقطتين قبل اسمها', () => {
    expect(code).toContain('p_Book[":كتاب"]')
  })
})

describe('toPackage', () => {
  const code = toPackage(a)
  it('يضع كل كيان في حزمته', () => {
    expect(code).toContain('subgraph pk_Catalog["الفهرس"]')
    expect(code).toContain('C_Author["مؤلف"]')
  })
  it('يرسم الاعتماد بين الحِزم من العلاقات العابرة', () => {
    expect(code).toContain('pk_UserManagement -.-> pk_Loans')
    expect(code).toContain('pk_Loans -.-> pk_Catalog')
    expect(code).not.toContain('pk_Catalog -.-> pk_Catalog')
  })
})

describe('toObject', () => {
  const code = toObject(a)
  it('يسمّي الكائن باسمه وصنفه ويعرض قيمه', () => {
    expect(code).toContain('class o_student1["student1 : طالب"] {')
    expect(code).toContain('name = أحمد طالب')
    expect(code).toContain('o_student1 -- o_borrowing1 : يستعير')
  })
})

describe('toComponent', () => {
  const code = toComponent(a)
  it('يرسم كل نوع بشكله، والاعتمادات', () => {
    expect(code).toContain('cmp_WebApp[["تطبيق الويب"]]')
    expect(code).toContain('cmp_Database[("قاعدة البيانات")]')
    expect(code).toContain('cmp_Mailer{{"خدمة البريد"}}')
    expect(code).toContain('cmp_WebApp --> cmp_LoanService')
  })
})

describe('toDeployment', () => {
  const code = toDeployment(a)
  it('يضع المكوّنات داخل العقد مع نوع العقدة', () => {
    expect(code).toContain('subgraph n_AppServer["خادم التطبيق «خادم»"]')
    expect(code).toContain('d_AppServer_LoanService["خدمة الإعارة"]')
  })
  it('يرسم العقدة الفارغة صندوقاً، والروابط ببروتوكولها', () => {
    expect(code).toContain('n_Cloud[["خدمات سحابية «سحابة»"]]')
    expect(code).toContain('n_Browser <-->|"HTTPS"| n_AppServer')
  })
})

describe('المخططات المعتمدة على التصميم بلا بيانات', () => {
  it('تعيد null', () => {
    const e = emptyAnalysis()
    expect([toState, toPackage, toObject, toComponent, toDeployment].map((f) => f(e))).toEqual([
      null,
      null,
      null,
      null,
      null,
    ])
  })
})
