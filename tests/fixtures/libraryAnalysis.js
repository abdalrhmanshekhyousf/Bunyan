import { analysisSchema } from '@/features/analysis/schema.js'

// تحليل مثال المكتبة كما أعاده Gemini (مختصر)، لاختبار المحوّلات دون استدعاء الشبكة
export const libraryAnalysis = analysisSchema.parse({
  summary: 'نظام لإدارة مكتبة الجامعة.',
  requirements: [{ id: 'FR1', type: 'functional', text: 'يبحث الطالب عن الكتب.' }],
  actors: [
    { id: 'Student', label: 'طالب', description: '' },
    { id: 'Librarian', label: 'أمين المكتبة', description: '' },
    { id: 'LibraryManager', label: 'مدير المكتبة', description: '' },
  ],
  entities: [
    {
      name: 'Student',
      label: 'طالب',
      attributes: [
        { name: 'id', label: 'الرقم', type: 'int', isPrimaryKey: true },
        { name: 'name', label: 'الاسم', type: 'string', isPrimaryKey: false },
      ],
      methods: [{ name: 'borrowBook', label: 'استعارة كتاب' }],
    },
    {
      name: 'Book',
      label: 'كتاب',
      attributes: [
        { name: 'id', label: 'الرقم', type: 'int', isPrimaryKey: true },
        { name: 'title', label: 'العنوان "الكامل"', type: 'string', isPrimaryKey: false },
      ],
      methods: [],
    },
    {
      name: 'Author',
      label: 'مؤلف',
      attributes: [{ name: 'id', label: 'الرقم', type: 'int', isPrimaryKey: true }],
      methods: [],
    },
    {
      name: 'Borrowing',
      label: 'إعارة',
      attributes: [
        { name: 'id', label: 'الرقم', type: 'int', isPrimaryKey: true },
        { name: 'dueDate', label: 'تاريخ الاستحقاق', type: 'date', isPrimaryKey: false },
      ],
      methods: [],
    },
  ],
  functions: [
    { id: 'SearchBooks', label: 'البحث عن كتاب', actorIds: ['Student'] },
    { id: 'BorrowBook', label: 'استعارة كتاب', actorIds: ['Student'] },
    { id: 'RecordReturn', label: 'تسجيل إرجاع', actorIds: ['Librarian'] },
    { id: 'end', label: 'عرض التقارير', actorIds: ['LibraryManager'] },
  ],
  relationships: [
    { from: 'Student', to: 'Borrowing', cardinality: '1:N', label: 'يجري' },
    { from: 'Borrowing', to: 'Book', cardinality: 'N:1', label: 'تخص' },
    { from: 'Book', to: 'Author', cardinality: 'M:N', label: 'كتبه' },
  ],
  rules: [{ id: 'BR1', text: '3 كتب كحدّ أقصى' }],
  design: {
    stateMachines: [
      {
        entity: 'Borrowing',
        states: [
          { id: 'Requested', label: 'مطلوبة' },
          { id: 'Active', label: 'نشطة' },
          { id: 'Overdue', label: 'متأخرة' },
          { id: 'Returned', label: 'مُرجعة' },
        ],
        initial: 'Requested',
        finals: ['Returned', 'Ghost'],
        transitions: [
          { from: 'Requested', to: 'Active', event: 'إقرار الإعارة' },
          { from: 'Active', to: 'Overdue', event: 'تجاوز: تاريخ الاستحقاق' },
          { from: 'Active', to: 'Returned', event: 'إرجاع الكتاب' },
          { from: 'Overdue', to: 'Returned', event: 'سداد الغرامة (500)' },
          { from: 'Active', to: 'Nowhere', event: 'x' },
        ],
      },
      {
        entity: 'Unknown',
        states: [
          { id: 'A', label: 'أ' },
          { id: 'B', label: 'ب' },
        ],
        initial: 'A',
        finals: [],
        transitions: [],
      },
    ],
    packages: [
      { id: 'UserManagement', label: 'إدارة المستخدمين', entities: ['Student'] },
      { id: 'Catalog', label: 'الفهرس', entities: ['Book', 'Author'] },
      { id: 'Loans', label: 'الإعارة', entities: ['Borrowing', 'Missing'] },
    ],
    objects: [
      { id: 'student1', entity: 'Student', values: [{ attribute: 'name', value: 'أحمد (طالب)' }] },
      { id: 'book1', entity: 'Book', values: [{ attribute: 'title', value: 'خوارزميات' }] },
      {
        id: 'borrowing1',
        entity: 'Borrowing',
        values: [{ attribute: 'dueDate', value: '2026-12-01' }],
      },
    ],
    objectLinks: [
      { from: 'student1', to: 'borrowing1', label: 'يستعير' },
      { from: 'borrowing1', to: 'book1', label: 'تتضمن' },
      { from: 'book1', to: 'ghost1', label: 'x' },
    ],
    components: [
      { id: 'WebApp', label: 'تطبيق الويب', kind: 'ui', dependsOn: ['LoanService', 'Nope'] },
      { id: 'LoanService', label: 'خدمة الإعارة', kind: 'service', dependsOn: ['Database'] },
      { id: 'Database', label: 'قاعدة البيانات', kind: 'database', dependsOn: [] },
      { id: 'Mailer', label: 'خدمة البريد', kind: 'external', dependsOn: [] },
    ],
    deploymentNodes: [
      { id: 'Browser', label: 'متصفح المستخدم', kind: 'device', components: ['WebApp'] },
      { id: 'AppServer', label: 'خادم التطبيق', kind: 'server', components: ['LoanService'] },
      { id: 'DbServer', label: 'خادم البيانات', kind: 'database', components: ['Database'] },
      { id: 'Cloud', label: 'خدمات سحابية', kind: 'cloud', components: [] },
    ],
    deploymentLinks: [
      { from: 'Browser', to: 'AppServer', protocol: 'HTTPS' },
      { from: 'AppServer', to: 'DbServer', protocol: 'SQL/TCP' },
    ],
  },
  scenario: {
    label: 'استعارة كتاب',
    steps: [
      { from: 'Student', to: 'System', message: 'يطلب استعارة كتاب', condition: '' },
      { from: 'System', to: 'Book', message: 'يتحقق من توفر نسخة', condition: '' },
      { from: 'Book', to: 'System', message: 'النسخة متاحة', condition: 'الكتاب متاح؟' },
      { from: 'System', to: 'Borrowing', message: 'إنشاء إعارة; لمدة 14 يوماً', condition: '' },
      { from: 'System', to: 'Student', message: 'تأكيد <الاستعارة>', condition: '' },
    ],
  },
})
