// عامل الخدمة لبُنيان: يجعل التطبيق قابلاً للتثبيت ويفتح واجهته دون اتصال.
// - التنقل بين الصفحات: الشبكة أولاً، والنسخة المحفوظة احتياطياً (فلا تبقى نسخة قديمة بعد النشر)
// - ملفات /assets/: أسماؤها تتغير مع كل بناء، فتُحفظ وتُقرأ من الذاكرة
// - طلبات Firebase وGemini وغيرها من نطاقات أخرى: لا تُمسّ
const CACHE = 'bunyan-v3'
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png']

// الملفات التي تحمّلها الصفحة الرئيسية تُحمَّل قبل أن يعمل عامل الخدمة، فنحفظها عند تثبيته
// كي تُفتح الواجهة دون اتصال من الزيارة الأولى. الصفحات الكسولة تُحفظ عند فتحها
async function precache() {
  const cache = await caches.open(CACHE)
  await cache.addAll(SHELL)
  const html = await (await cache.match('/')).text()
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
  await cache.addAll(assets)
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copy))
          return res
        })
        .catch(() => caches.match('/', { ignoreVary: true })),
    )
    return
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      // ignoreVary: طلبات الوحدات تحمل Origin، والخادم قد يرسل Vary فلا تتطابق النسخة المحفوظة
      caches.match(request, { ignoreVary: true }).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(request, copy))
            }
            return res
          }),
      ),
    )
  }
})
