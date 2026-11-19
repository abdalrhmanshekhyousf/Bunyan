// T0.8 — عينات المخططات الخمسة على مثال المكتبة
// A: معرّفات عربية مباشرة   B: معرّفات إنجليزية + تسميات عربية

export const samples = [
  {
    key: 'useCase',
    title: 'حالات الاستخدام (Use Case)',
    A: `flowchart RL
  طالب(("الطالب"))
  أمين(("أمين المكتبة"))
  subgraph نظام["نظام المكتبة"]
    بحث(["البحث عن كتاب"])
    استعارة(["استعارة كتاب"])
    إرجاع(["إرجاع كتاب"])
    إدارة(["إدارة الكتب"])
  end
  طالب --- بحث & استعارة & إرجاع
  أمين --- إدارة & إرجاع`,
    B: `flowchart RL
  Student(("الطالب"))
  Librarian(("أمين المكتبة"))
  subgraph System["نظام المكتبة"]
    UC1(["البحث عن كتاب"])
    UC2(["استعارة كتاب"])
    UC3(["إرجاع كتاب"])
    UC4(["إدارة الكتب"])
  end
  Student --- UC1 & UC2 & UC3
  Librarian --- UC4 & UC3`,
  },
  {
    key: 'class',
    title: 'الأصناف (Class)',
    A: `classDiagram
  class طالب {
    +الرقم: عدد
    +الاسم: نص
    +استعارة()
  }
  class كتاب {
    +العنوان: نص
    +المؤلف: نص
  }
  class استعارة {
    +تاريخ_الاستعارة: تاريخ
  }
  طالب "1" --> "*" استعارة : يقوم
  كتاب "1" --> "*" استعارة : يُستعار`,
    B: `classDiagram
  class Student["طالب"] {
    +id: int
    +name: string
    +borrow()
  }
  class Book["كتاب"] {
    +title: string
    +author: string
  }
  class Borrow["استعارة"] {
    +borrowDate: date
  }
  Student "1" --> "*" Borrow : يقوم بـ
  Book "1" --> "*" Borrow : يُستعار في`,
  },
  {
    key: 'sequence',
    title: 'التسلسل (Sequence)',
    A: `sequenceDiagram
  actor طالب
  participant النظام
  participant قاعدة_البيانات
  طالب->>النظام: طلب استعارة كتاب
  النظام->>قاعدة_البيانات: التحقق من توفر النسخة
  قاعدة_البيانات-->>النظام: النسخة متوفرة
  النظام-->>طالب: تمت الاستعارة بنجاح`,
    B: `sequenceDiagram
  actor S as الطالب
  participant SYS as النظام
  participant DB as قاعدة البيانات
  S->>SYS: طلب استعارة كتاب
  SYS->>DB: التحقق من توفر النسخة
  DB-->>SYS: النسخة متوفرة
  SYS-->>S: تمت الاستعارة بنجاح`,
  },
  {
    key: 'activity',
    title: 'النشاطات (Activity)',
    A: `flowchart TD
  بداية(["بداية"]) --> طلب["الطالب يطلب كتاباً"]
  طلب --> متوفر{"هل النسخة متوفرة؟"}
  متوفر -- نعم --> تسجيل["تسجيل الاستعارة"]
  متوفر -- لا --> اعتذار["إظهار رسالة: غير متوفر"]
  تسجيل --> نهاية(["نهاية"])
  اعتذار --> نهاية`,
    B: `flowchart TD
  A(["بداية"]) --> B["الطالب يطلب كتاباً"]
  B --> C{"هل النسخة متوفرة؟"}
  C -- نعم --> D["تسجيل الاستعارة"]
  C -- لا --> E["إظهار رسالة: غير متوفر"]
  D --> F(["نهاية"])
  E --> F`,
  },
  {
    key: 'er',
    title: 'الكيانات والعلاقات (ER)',
    A: `erDiagram
  طالب ||--o{ استعارة : يقوم
  كتاب ||--o{ استعارة : يُستعار
  استعارة ||--o| غرامة : تنتج
  طالب {
    int الرقم PK
    string الاسم
  }
  استعارة {
    int الرقم PK
    int رقم_الطالب FK
    date تاريخ_الإرجاع
  }`,
    B: `erDiagram
  STUDENT ||--o{ BORROW : "يقوم بـ"
  BOOK ||--o{ BORROW : "يُستعار في"
  BORROW ||--o| FINE : "تنتج"
  STUDENT["طالب"] {
    int id PK "الرقم"
    string name "الاسم"
  }
  BOOK["كتاب"] {
    int id PK "الرقم"
    string title "العنوان"
  }
  FINE["غرامة"] {
    decimal amount "المبلغ"
  }
  BORROW["استعارة"] {
    int id PK "الرقم"
    int student_id FK "رقم الطالب"
    date returnDate "تاريخ الإرجاع"
  }`,
  },
]
