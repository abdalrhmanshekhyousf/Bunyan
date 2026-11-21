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
