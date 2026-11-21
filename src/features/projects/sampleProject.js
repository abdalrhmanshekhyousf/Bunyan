// مثال المكتبة: يُعرض في الصفحة الرئيسية ويُستعمل في زر «جرّب مثال المكتبة» (T3.9)
export const librarySamples = {
  ar: {
    title: 'نظام إدارة مكتبة الجامعة',
    description: `نريد نظاماً لإدارة مكتبة الجامعة. يستطيع الطالب البحث عن الكتب حسب العنوان أو المؤلف أو التصنيف، واستعارة كتاب متاح لمدة أقصاها 14 يوماً، ولا يجوز له أن يستعير أكثر من 3 كتب في الوقت نفسه.
يسجّل أمين المكتبة الكتب الجديدة، ولكل كتاب رقم ISBN وعنوان ومؤلف أو أكثر وتصنيف وعدد نسخ. ويسجّل أمين المكتبة عمليات الإرجاع، وإذا تأخّر الطالب في الإرجاع تُحسب غرامة قدرها 500 ليرة عن كل يوم تأخير.
يمكن للطالب حجز كتاب غير متاح، فيُبلَّغ عندما تعود نسخة منه. ويطّلع مدير المكتبة على تقارير شهرية بأكثر الكتب استعارة وبالغرامات المستحقة.`,
  },
  en: {
    title: 'University Library Management System',
    description: `We need a system to manage the university library. A student can search for books by title, author or category, and borrow an available book for at most 14 days; a student may not have more than 3 books borrowed at the same time.
The librarian registers new books; each book has an ISBN, a title, one or more authors, a category and a number of copies. The librarian also records returns, and if a student returns a book late, a fine of 500 per day of delay is charged.
A student can reserve a book that is not available and is notified when a copy comes back. The library manager views monthly reports of the most borrowed books and the outstanding fines.`,
  },
}

// للتوافق: المثال العربي
export const librarySample = librarySamples.ar
