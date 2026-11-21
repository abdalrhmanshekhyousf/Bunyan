import i18n from '@/lib/i18n.js'

// حالات المشروع وألوان شاراتها؛ label مفتاح ترجمة
export const STATUSES = {
  draft: { label: 'projects:status.draft', tone: 'slate' },
  analyzing: { label: 'projects:status.analyzing', tone: 'amber' },
  analyzed: { label: 'projects:status.analyzed', tone: 'teal' },
  error: { label: 'projects:status.error', tone: 'red' },
}

export const statusOf = (s) => STATUSES[s] ?? STATUSES.draft

// التاريخ بلغة الواجهة الحالية
export function formatDate(ts) {
  const d = ts?.toDate?.()
  if (!d) return i18n.t('projects:now')
  return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(d)
}
