// اختبار قواعد الأمان على Firestore الحقيقي عبر REST (T10.2 مبكراً).
// ينشئ حسابين تجريبيين، يجرّب العمليات المسموحة والممنوعة، ثم يحذف كل شيء.
// الاستعمال: node scripts/rules-check.mjs
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
  await expect(
    'أ يكتب عدّاد استخدامه بنفسه',
    'deny',
    call(A, 'PATCH', `/usage/${A.uid}`, { count: { integerValue: 0 } }),
  )
} finally {
  await call(A, 'DELETE', `/projects/${pid}`)
  for (const u of [A, B]) {
    await call(u, 'DELETE', `/users/${u.uid}`)
    await fetch(`${ID}:delete?key=${key}`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ idToken: u.tok }),
    })
  }
  console.log(failed ? `\n${failed} اختبار فشل` : '\nنجحت كل الاختبارات، وحُذفت البيانات التجريبية')
  process.exitCode = failed ? 1 : 0
}
