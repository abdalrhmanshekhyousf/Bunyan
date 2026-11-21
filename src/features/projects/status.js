// حالات المشروع وألوان شاراتها
export const STATUSES = {
  draft: { label: 'مسودة', tone: 'slate' },
  analyzing: { label: 'قيد التحليل', tone: 'amber' },
  analyzed: { label: 'محلَّل', tone: 'teal' },
  error: { label: 'فشل التحليل', tone: 'red' },
}

export const statusOf = (s) => STATUSES[s] ?? STATUSES.draft

const fmt = new Intl.DateTimeFormat('ar', { dateStyle: 'medium' })
export function formatDate(ts) {
  const d = ts?.toDate?.()
  return d ? fmt.format(d) : 'الآن'
}
