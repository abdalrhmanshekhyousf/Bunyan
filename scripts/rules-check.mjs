// اختبار قواعد الأمان على Firestore الحقيقي عبر REST (T10.2 مبكراً).
// ينشئ حسابين تجريبيين، يجرّب العمليات المسموحة والممنوعة، ثم يحذف كل شيء.
// الاستعمال: node scripts/rules-check.mjs
// لاختبار صلاحيات المدير (T8.5) مرّر حساب مدير موجود:
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/rules-check.mjs
import { readFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/VITE_FIREBASE_API_KEY=(.*)/)[1].trim()
const projectId = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/)[1].trim()
const H = { 'Content-Type': 'application/json', Referer: 'http://localhost:5199' }
const FS = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
const ID = 'https://identitytoolkit.googleapis.com/v1/accounts'
const s = (v) => ({ stringValue: v })
const b = (v) => ({ booleanValue: v })

async function makeUser(tag) {
  const email = `rules.${tag}.${Date.now()}@bunyan-test.dev`
  const r = await fetch(`${ID}:signUp?key=${key}`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ email, password: 'Test12345!', returnSecureToken: true }),
  }).then((x) => x.json())
  return { uid: r.localId, tok: r.idToken }
}

async function signIn(email, password) {
  const r = await fetch(`${ID}:signInWithPassword?key=${key}`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  }).then((x) => x.json())
  if (!r.idToken) throw new Error('تعذّر دخول المدير: ' + (r.error?.message ?? ''))
  return { uid: r.localId, tok: r.idToken }
}

// عدّ عبر runAggregationQuery؛ parent فارغ للجذر، وallDescendants لـ collectionGroup
const count = (u, collectionId, allDescendants = false) =>
  fetch(`${FS}:runAggregationQuery`, {
    method: 'POST',
    headers: { ...H, Authorization: 'Bearer ' + u.tok },
    body: JSON.stringify({
      structuredAggregationQuery: {
        structuredQuery: { from: [{ collectionId, allDescendants }] },
        aggregations: [{ alias: 'n', count: {} }],
      },
    }),
  }).then((r) => r.status)

const call = (u, method, path, fields) =>
  fetch(FS + path, {
    method,
    headers: { ...H, Authorization: 'Bearer ' + u.tok },
    body: fields && JSON.stringify({ fields }),
  }).then((r) => r.status)

let failed = 0
async function expect(label, want, got) {
  const status = await got
  const ok = want === 'allow' ? status === 200 : status === 403
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${label} → ${status}`)
}

const A = await makeUser('a')
const B = await makeUser('b')
const pid = `rules-${A.uid}`
let M // حساب المدير إن مُرِّر، ويُستعمل أيضاً لحذف مستندات المستخدمين التجريبيين

try {
  await expect(
    'أ ينشئ مستنده بدور user',
    'allow',
    call(A, 'PATCH', `/users/${A.uid}`, { role: s('user') }),
  )
  await expect(
    'أ يرقّي نفسه مديراً',
    'deny',
    call(A, 'PATCH', `/users/${A.uid}`, { role: s('admin') }),
  )
  await expect('أ يكتب مستند ب', 'deny', call(A, 'PATCH', `/users/${B.uid}`, { role: s('user') }))
  await expect('ب يقرأ مستند أ', 'deny', call(B, 'GET', `/users/${A.uid}`))
  await expect(
    'أ ينشئ مشروعاً باسمه',
    'allow',
    call(A, 'PATCH', `/projects/${pid}`, {
      ownerId: s(A.uid),
      title: s('اختبار'),
      description: s(''),
      isShared: b(false),
    }),
  )
  await expect(
    'ب ينشئ مشروعاً باسم أ',
    'deny',
    call(B, 'PATCH', `/projects/fake-${B.uid}`, {
      ownerId: s(A.uid),
      title: s('x'),
    }),
  )
  await expect('ب يقرأ مشروع أ الخاص', 'deny', call(B, 'GET', `/projects/${pid}`))
  await expect(
    'أ يشارك مشروعه',
    'allow',
    call(A, 'PATCH', `/projects/${pid}?updateMask.fieldPaths=isShared`, { isShared: b(true) }),
  )
  await expect('ب يقرأ المشروع المشترَك', 'allow', call(B, 'GET', `/projects/${pid}`))
  await expect(
    'ب يعدّل المشروع المشترَك',
    'deny',
    call(B, 'PATCH', `/projects/${pid}?updateMask.fieldPaths=title`, { title: s('مخترق') }),
  )
  await expect(
    'ب يكتب تحليلاً في المشروع المشترَك',
    'deny',
    call(B, 'PATCH', `/projects/${pid}/analyses/x`, { v: s('x') }),
  )
  await expect(
    'أ ينقل ملكية مشروعه إلى ب',
    'deny',
    call(A, 'PATCH', `/projects/${pid}?updateMask.fieldPaths=ownerId`, { ownerId: s(B.uid) }),
  )
  const d = new Date()
  const today = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
  const usage = (day, count) => ({ day: { integerValue: day }, count: { integerValue: count } })
  await expect('أ يبدأ عدّاده من 5', 'deny', call(A, 'PATCH', `/usage/${A.uid}`, usage(today, 5)))
  await expect('أ يبدأ عدّاده من 1', 'allow', call(A, 'PATCH', `/usage/${A.uid}`, usage(today, 1)))
  await expect('أ يزيد عدّاده 1', 'allow', call(A, 'PATCH', `/usage/${A.uid}`, usage(today, 2)))
  await expect('أ يُنقص عدّاده', 'deny', call(A, 'PATCH', `/usage/${A.uid}`, usage(today, 1)))
  await expect(
    'أ يزوّر يوماً جديداً ليصفّر العدّاد',
    'deny',
    call(A, 'PATCH', `/usage/${A.uid}`, usage(today + 1, 1)),
  )
  await expect('ب يكتب عدّاد أ', 'deny', call(B, 'PATCH', `/usage/${A.uid}`, usage(today, 3)))

  // المرحلة 8: غير المدير
  const tpl = (published) => ({
    title: s('قالب اختبار'),
    description: s('وصف'),
    language: s('ar'),
    published: b(published),
  })
  await expect('أ يعدّ المستخدمين', 'deny', count(A, 'users'))
  await expect('أ يعدّ كل التحليلات', 'deny', count(A, 'analyses', true))
  await expect('أ ينشئ قالباً', 'deny', call(A, 'PATCH', `/templates/t-${A.uid}`, tpl(true)))

  if (process.env.ADMIN_EMAIL) {
    M = await signIn(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD)
    const tid = `rules-tpl-${A.uid}`
    await expect('المدير يعدّ المستخدمين', 'allow', count(M, 'users'))
    await expect('المدير يعدّ المشاريع', 'allow', count(M, 'projects'))
    await expect('المدير يعدّ كل التحليلات', 'allow', count(M, 'analyses', true))
    await expect('المدير يقرأ مستند أ', 'allow', call(M, 'GET', `/users/${A.uid}`))
    await expect(
      'المدير يرقّي أ',
      'allow',
      call(M, 'PATCH', `/users/${A.uid}?updateMask.fieldPaths=role`, { role: s('admin') }),
    )
    await expect(
      'المدير يغيّر اسم أ',
      'deny',
      call(M, 'PATCH', `/users/${A.uid}?updateMask.fieldPaths=displayName`, {
        displayName: s('x'),
      }),
    )
    await call(M, 'PATCH', `/users/${A.uid}?updateMask.fieldPaths=role`, { role: s('user') })
    await expect(
      'المدير ينزع دوره هو',
      'deny',
      call(M, 'PATCH', `/users/${M.uid}?updateMask.fieldPaths=role`, { role: s('user') }),
    )
    // المشروع مشترَك من اختبار سابق؛ نعيده خاصاً ليكون الاختبار صادقاً
    await call(A, 'PATCH', `/projects/${pid}?updateMask.fieldPaths=isShared`, {
      isShared: b(false),
    })
    await expect(
      'المدير يقرأ مخططات مشروع خاص',
      'deny',
      call(M, 'GET', `/projects/${pid}/diagrams/x`),
    )
    await expect(
      'المدير ينشئ قالب مسودة',
      'allow',
      call(M, 'PATCH', `/templates/${tid}`, tpl(false)),
    )
    await expect('ب يقرأ قالب المسودة', 'deny', call(B, 'GET', `/templates/${tid}`))
    await expect(
      'المدير ينشر القالب',
      'allow',
      call(M, 'PATCH', `/templates/${tid}?updateMask.fieldPaths=published`, { published: b(true) }),
    )
    await expect('ب يقرأ القالب المنشور', 'allow', call(B, 'GET', `/templates/${tid}`))
    await expect('ب يحذف القالب', 'deny', call(B, 'DELETE', `/templates/${tid}`))
    await expect('المدير يحذف القالب', 'allow', call(M, 'DELETE', `/templates/${tid}`))
  } else {
    console.log('… تُركت اختبارات المدير: لم يُمرَّر ADMIN_EMAIL')
  }
} finally {
  await call(A, 'DELETE', `/projects/${pid}`)
  // عدّاد الاستخدام ومستند المستخدم لا يحذفهما إلا المدير
  if (M) await call(M, 'DELETE', `/usage/${A.uid}`)
  for (const u of [A, B]) {
    // حذف مستند المستخدم للمدير وحده؛ دون حساب مدير يبقى مستند يتيم
    if (M) await call(M, 'DELETE', `/users/${u.uid}`)
    await fetch(`${ID}:delete?key=${key}`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ idToken: u.tok }),
    })
  }
  console.log(failed ? `\n${failed} اختبار فشل` : '\nنجحت كل الاختبارات، وحُذفت البيانات التجريبية')
  process.exitCode = failed ? 1 : 0
}
