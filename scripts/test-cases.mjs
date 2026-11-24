// تنفيذ حالات الاختبار TC-01 إلى TC-05 (T10.4) على Firebase الحقيقي. التعريف في docs/test-cases.md
// الاستعمال (السيرفر يعمل على 5199):
//   node scripts/test-cases.mjs [outDir]
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/test-cases.mjs   (لتنفيذ شق المدير في TC-05)
// ينشئ مستخدمَين تجريبيين (أ وب) في متصفحين منفصلين، ثم يحذف كل ما أنشأه.
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const out = process.argv[2] ?? 'tc-out'
const B = 'http://localhost:5199'
// الشبكة البطيئة تؤخّر حدث load (الخطوط والموارد الخارجية)، فننتظر جاهزية المستند فقط
const NAV = { waitUntil: 'domcontentloaded', timeout: 90000 }
mkdirSync(out, { recursive: true })
const apiKey = readFileSync('.env.local', 'utf8')
  .match(/VITE_FIREBASE_API_KEY=(.*)/)[1]
  .trim()
const password = 'Test12345!'
const stamp = Date.now()
const users = {
  A: { name: 'مختبر أ', email: `tc.a.${stamp}@bunyan-test.dev` },
  B: { name: 'مختبر ب', email: `tc.b.${stamp}@bunyan-test.dev` },
}
const SAMPLE = readFileSync('src/features/projects/sampleProject.js', 'utf8').match(
  /description: `([\s\S]*?)`/,
)[1]

const results = []
// خطوة واحدة داخل حالة: تُسجَّل نجاحاً أو فشلاً ولا توقف بقية الحالات
async function check(tc, label, fn) {
  try {
    const note = await fn()
    results.push({ tc, label, ok: true, note: note ?? '' })
    console.log(`  ✓ ${label}${note ? ' — ' + note : ''}`)
  } catch (e) {
    results.push({ tc, label, ok: false, note: e.message.split('\n')[0] })
    console.log(`  ✗ ${label} — ${e.message.split('\n')[0]}`)
  }
}

const browser = await chromium.launch()
async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await ctx.addInitScript(() => localStorage.setItem('lang', 'ar'))
  return ctx.newPage()
}
const pa = await newPage()
const pb = await newPage()
const shot = (p, name) => p.screenshot({ path: join(out, `${name}.png`) })

async function register(page, u) {
  await page.goto(B + '/register', NAV)
  await page.getByLabel('الاسم').fill(u.name)
  await page.getByLabel('البريد الإلكتروني').fill(u.email)
  await page.getByLabel('كلمة المرور', { exact: true }).fill(password)
  await page.getByLabel('تأكيد كلمة المرور').fill(password)
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click()
  await page.waitForURL('**/dashboard', { timeout: 60000 })
}

async function login(page, email, pass) {
  await page.goto(B + '/login', NAV)
  await page.getByLabel('البريد الإلكتروني').fill(email)
  await page.getByLabel('كلمة المرور', { exact: true }).fill(pass)
  await page.getByRole('button', { name: 'دخول', exact: true }).click()
}

let projectId
try {
  // ── TC-01 ──
  console.log('TC-01: إنشاء حساب وتسجيل الدخول')
  await check('TC-01', 'إنشاء حساب جديد ينقل إلى لوحة المشاريع', async () => {
    await register(pa, users.A)
    await pa.getByRole('heading', { name: 'لا توجد مشاريع بعد' }).waitFor({ timeout: 60000 })
  })
  await check('TC-01', 'تسجيل الخروج يعيد إلى الصفحة العامة', async () => {
    await pa.getByRole('button', { name: 'تسجيل الخروج' }).click()
    await pa.getByText('سُجّل خروجك.').waitFor({ timeout: 60000 })
  })
  await check('TC-01', 'كلمة مرور خاطئة تُرفض برسالة واضحة', async () => {
    await login(pa, users.A.email, 'WrongPass99!')
    await pa
      .getByText('البريد الإلكتروني أو كلمة المرور غير صحيحة.')
      .first()
      .waitFor({ timeout: 60000 })
    if (pa.url().includes('/dashboard')) throw new Error('دخل رغم كلمة المرور الخاطئة')
    await shot(pa, 'TC-01-wrong-password')
  })
  await check('TC-01', 'الدخول بالبيانات الصحيحة', async () => {
    await login(pa, users.A.email, password)
    await pa.waitForURL('**/dashboard', { timeout: 60000 })
  })
  await check('TC-01', 'صفحة محمية دون دخول تحوّل إلى صفحة الدخول', async () => {
    await pb.goto(B + '/dashboard', NAV)
    await pb.waitForURL('**/login', { timeout: 60000 })
  })

  // ── TC-02 ──
  console.log('TC-02: إنشاء مشروع وحفظ الوصف تلقائياً')
  await check('TC-02', 'إنشاء مشروع بعنوان فقط', async () => {
    await pa.getByRole('button', { name: 'مشروع جديد' }).first().click()
    await pa.getByLabel('عنوان المشروع').fill('مشروع حالات الاختبار')
    await pa.getByRole('button', { name: 'إنشاء المشروع' }).click()
    await pa.waitForURL('**/projects/**', { timeout: 60000 })
    projectId = pa.url().split('/projects/')[1]
    return projectId
  })
  await check('TC-02', 'زر التحليل معطّل والوصف قصير', async () => {
    const btn = pa.getByRole('button', { name: /حلّل الوصف|الوصف قصير/ }).first()
    await btn.waitFor({ timeout: 60000 })
    if (!(await btn.isDisabled())) throw new Error('الزر مفعّل مع وصف فارغ')
  })
  await check('TC-02', 'الوصف يُحفظ تلقائياً ويبقى بعد إعادة التحميل', async () => {
    const ta = pa.locator('main textarea')
    await ta.fill(SAMPLE)
    await pa.getByText('تم الحفظ').waitFor({ timeout: 60000 })
    await pa.reload()
    await pa.waitForFunction(
      () => document.querySelector('main textarea')?.value.length > 100,
      null,
      { timeout: 60000 },
    )
    const v = await ta.inputValue()
    if (!v.includes('مكتبة الجامعة')) throw new Error('لم يُحفظ الوصف')
    return `${v.length} حرفاً`
  })
  await check('TC-02', 'زر التحليل يُفعَّل بعد كتابة الوصف', async () => {
    const btn = pa.getByRole('button', { name: 'حلّل الوصف' })
    await btn.waitFor({ timeout: 60000 })
    if (await btn.isDisabled()) throw new Error('الزر ما زال معطّلاً')
    await shot(pa, 'TC-02-workspace')
  })

  // ── TC-03 ──
  console.log('TC-03: خصوصية المشروع والمشاركة للقراءة فقط')
  await check('TC-03', 'مستخدم آخر لا يفتح المشروع الخاص', async () => {
    await register(pb, users.B)
    await pb.goto(`${B}/projects/${projectId}`, NAV)
    await pb.getByText('لا يمكن فتح هذا المشروع').waitFor({ timeout: 60000 })
    await shot(pb, 'TC-03-private')
  })
  let shareUrl
  await check('TC-03', 'المالك يفعّل رابط المشاركة', async () => {
    await pa.getByRole('button', { name: 'مشاركة' }).click()
    await pa.getByRole('button', { name: 'تفعيل رابط المشاركة' }).click()
    const input = pa.getByLabel('رابط المشاركة')
    await input.waitFor({ timeout: 60000 })
    shareUrl = await input.inputValue()
    await pa.keyboard.press('Escape')
    return shareUrl
  })
  await check('TC-03', 'المستخدم الآخر يفتح الرابط للقراءة فقط', async () => {
    await pb.goto(shareUrl, NAV)
    await pb.getByText('قراءة فقط').waitFor({ timeout: 60000 })
    const ta = pb.locator('main textarea')
    if (!((await ta.getAttribute('readonly')) !== null)) throw new Error('الوصف قابل للتعديل')
    if (await pb.getByRole('button', { name: 'حذف المشروع' }).count())
      throw new Error('زر الحذف ظاهر لغير المالك')
    await shot(pb, 'TC-03-shared')
  })

  // ── TC-04 ──
  console.log('TC-04: التحليل الذكي')
  await check('TC-04', 'التحليل ينتهي بنتيجة أو برسالة خطأ واضحة خلال 100 ثانية', async () => {
    await pa.getByRole('button', { name: 'حلّل الوصف' }).click()
    const t0 = Date.now()
    const errorToast = pa.locator('[data-sonner-toast][data-type="error"]')
    await pa.getByText('اكتمل التحليل.').or(errorToast).first().waitFor({ timeout: 100000 })
    const secs = ((Date.now() - t0) / 1000).toFixed(0)
    if (await errorToast.count()) {
      const msg = await errorToast.first().innerText()
      await shot(pa, 'TC-04-error')
      // خطأ مفهوم من الخدمة نجاحٌ لشرط «عدم التعليق»، لكنه لا يثبت صحة التحليل
      return `رسالة خطأ بعد ${secs} ث: «${msg}»`
    }
    return `اكتمل بعد ${secs} ث`
  })
  await check('TC-04', 'نتيجة التحليل تعرض الكيانات والفاعلين والمتطلبات', async () => {
    if (await pa.locator('[data-sonner-toast][data-type="error"]').count())
      throw new Error('لم يُنفَّذ: فشل التحليل في الخطوة السابقة')
    for (const h of [/الكيانات/, /الفاعلون/, /المتطلبات/])
      await pa.getByRole('heading', { name: h }).first().waitFor({ timeout: 60000 })
    await shot(pa, 'TC-04-analysis')
  })

  // ── TC-05 ──
  console.log('TC-05: صلاحيات لوحة المدير')
  await check('TC-05', 'المستخدم العادي لا يرى رابط لوحة المدير', async () => {
    await pb.goto(B + '/dashboard', NAV)
    await pb.getByRole('heading', { name: 'مشاريعي' }).first().waitFor({ timeout: 60000 })
    if (await pb.getByRole('link', { name: 'لوحة المدير' }).count()) throw new Error('الرابط ظاهر')
  })
  await check('TC-05', 'المستخدم العادي يُعاد من /admin إلى لوحته', async () => {
    await pb.goto(B + '/admin', NAV)
    await pb.waitForURL('**/dashboard', { timeout: 60000 })
  })
  if (process.env.ADMIN_EMAIL) {
    const pm = await newPage()
    await check('TC-05', 'المدير يرى الإحصاءات وجدول المستخدمين', async () => {
      await login(pm, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD)
      await pm.waitForURL('**/dashboard', { timeout: 60000 })
      await pm.getByRole('link', { name: 'لوحة المدير' }).first().click()
      await pm.waitForURL('**/admin', { timeout: 60000 })
      await pm.getByText(users.A.email).waitFor({ timeout: 60000 })
      await pm.waitForTimeout(1500)
      if (await pm.getByText('تعذّر العدّ').count()) throw new Error('فشل عدّ إحدى الإحصاءات')
      await shot(pm, 'TC-05-admin')
    })
    await check('TC-05', 'المدير يبحث عن مستخدم بالبريد', async () => {
      await pm.getByLabel('البحث في المستخدمين').fill(users.B.email)
      await pm.getByText(users.B.email).waitFor({ timeout: 60000 })
      if (await pm.getByText(users.A.email).count()) throw new Error('البحث لم يُصفِّ النتائج')
    })
  } else {
    console.log('  … شق المدير لم يُنفَّذ: لم يُمرَّر ADMIN_EMAIL')
  }
} finally {
  if (projectId)
    await pa
      .evaluate(
        async (id) => (await import('/src/features/projects/projectsService.js')).deleteProject(id),
        projectId,
      )
      .catch(() => {})
  await browser.close()
  // النتائج تُحفظ قبل حذف الحسابات، فانقطاع الشبكة أثناء الحذف لا يضيّعها
  writeFileSync(join(out, 'results.json'), JSON.stringify(results, null, 2))
  const failed = results.filter((r) => !r.ok).length
  console.log(`\n${results.length - failed} من ${results.length} خطوة نجحت`)
  process.exitCode = failed ? 1 : 0

  const H = { 'Content-Type': 'application/json', Referer: B }
  const api = (op, body) =>
    fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${op}?key=${apiKey}`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify(body),
    }).then((x) => x.json())
  for (const u of Object.values(users)) {
    let done = false
    for (let i = 0; i < 3 && !done; i++) {
      try {
        const r = await api('signInWithPassword', {
          email: u.email,
          password,
          returnSecureToken: true,
        })
        if (r.idToken) await api('delete', { idToken: r.idToken })
        done = true // حُذف، أو لم يُنشأ أصلاً
      } catch {
        await new Promise((res) => setTimeout(res, 5000))
      }
    }
    if (!done) console.log(`  ⚠ تعذّر حذف الحساب التجريبي ${u.email} (كلمة المرور ${password})`)
  }
}
