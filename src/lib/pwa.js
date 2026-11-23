// التثبيت من المتصفح (PWA): تسجيل عامل الخدمة، والتقاط عرض التثبيت.
// يُستورد في main.jsx قبل رسم الواجهة، لأن المتصفح قد يطلق beforeinstallprompt مبكراً

let deferred = null // حدث beforeinstallprompt المؤجَّل
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // نعرض زرنا بدل الشريط التلقائي
    deferred = e
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })

  // في الإنتاج فقط: عامل الخدمة في التطوير يخبّئ ملفات Vite ويربك التحديث الفوري
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('sw:', e.message))
    })
  }
}

export const canInstall = () => deferred !== null

export function subscribeInstall(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// يفتح نافذة التثبيت الأصلية في المتصفح؛ يعيد true إن وافق المستخدم
export async function promptInstall() {
  if (!deferred) return false
  const e = deferred
  deferred = null
  emit()
  await e.prompt()
  const { outcome } = await e.userChoice
  return outcome === 'accepted'
}
