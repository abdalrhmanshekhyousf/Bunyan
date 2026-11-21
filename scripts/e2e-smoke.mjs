// اختبار دخاني على Firebase الحقيقي: تسجيل ← مشروع ← حفظ تلقائي ← مشاركة ← حذف، ثم حذف الحساب التجريبي.
// الاستعمال: node scripts/e2e-smoke.mjs <outDir> [baseUrl]   (السيرفر يعمل، و.env.local موجود)
import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const out = process.argv[2] ?? 'e2e-out'
const B = process.argv[3] ?? 'http://localhost:5199'
mkdirSync(out, { recursive: true })
const apiKey = readFileSync('.env.local', 'utf8')
  .match(/VITE_FIREBASE_API_KEY=(.*)/)[1]
  .trim()
const email = `e2e.${Date.now()}@bunyan-test.dev`
const password = 'Test12345!'
const step = (m) => console.log('•', m)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.on('pageerror', (e) => console.log('pageerror:', e.message))
page.on('console', (m) => m.type() === 'error' && console.log('console:', m.text().slice(0, 300)))
const toasts = async () => (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' | ')

try {
  await page.goto(B + '/register')
  await page.getByLabel('الاسم').fill('مختبر آلي')
  await page.getByLabel('البريد الإلكتروني').fill(email)
  await page.getByLabel('كلمة المرور', { exact: true }).fill(password)
  await page.getByLabel('تأكيد كلمة المرور').fill(password)
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click()
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  step('التسجيل والانتقال إلى اللوحة: ' + (await toasts()))
  await page.getByRole('heading', { name: 'لا توجد مشاريع بعد' }).waitFor({ timeout: 10000 })
  step('الحالة الفارغة ظاهرة')
  await page.screenshot({ path: join(out, 'e2e-1-empty.png') })

  await page.getByRole('button', { name: 'مشروع جديد' }).first().click()
  await page.getByRole('button', { name: 'جرّب مثال المكتبة' }).click()
  await page.getByRole('button', { name: 'إنشاء المشروع' }).click()
  await page.waitForURL('**/projects/**', { timeout: 15000 })
  step('أُنشئ المشروع: ' + page.url())

  const ta = page.locator('main textarea')
  await page.waitForFunction(() => {
    const t = document.querySelectorAll('main textarea')
    return t.length === 1 && t[0].value.length > 100
  })
  await ta.fill((await ta.inputValue()) + '\nسطر مضاف للاختبار.')
  await page.getByText('تم الحفظ').waitFor({ timeout: 10000 })
  await page.reload()
  await page.waitForTimeout(1500)
  const v = await ta.inputValue()
  step(
    'الحفظ التلقائي بعد إعادة التحميل: ' +
      (v.includes('سطر مضاف للاختبار') && v.includes('مكتبة الجامعة')),
  )

  await page.getByRole('button', { name: 'حلّل الوصف' }).click()
  const t0 = Date.now()
  await page.getByText('اكتمل التحليل.').waitFor({ timeout: 150000 })
  step(`التحليل الذكي: ${((Date.now() - t0) / 1000).toFixed(0)} ثانية`)
  await page.getByRole('heading', { name: /الكيانات/ }).waitFor()
  await page.waitForTimeout(800)
  await page.screenshot({ path: join(out, 'e2e-analysis.png'), fullPage: true })
  await page.getByRole('tab', { name: 'المخططات' }).click()
  await page.getByRole('tab', { name: 'الحالة', exact: true }).click()
  const t1 = Date.now()
  await page.locator('.mermaid-host svg').waitFor({ timeout: 180000 })
  step(`المخططات الإضافية ظهرت في الخلفية بعد ${((Date.now() - t1) / 1000).toFixed(0)} ثانية`)
  await page.waitForTimeout(800)
  await page.screenshot({ path: join(out, 'e2e-state.png') })
  await page.getByRole('tab', { name: 'التحليل' }).click()
  await page.getByRole('button', { name: 'تعديل' }).click()
  await page.getByRole('button', { name: 'إضافة قاعدة' }).click()
  await page.getByLabel('القاعدة').last().fill('قاعدة مضافة في الاختبار')
  await page.getByRole('button', { name: 'حفظ التعديلات' }).click()
  await page.getByText('الإصدار 2').waitFor({ timeout: 45000 })
  step('التعديل اليدوي حُفظ كإصدار 2')
  await page.getByRole('tab', { name: 'الوصف' }).click()
  await page.getByRole('button', { name: 'مشاركة' }).click()
  await page.getByRole('button', { name: 'تفعيل رابط المشاركة' }).click()
  await page.getByLabel('رابط المشاركة').waitFor({ timeout: 10000 })
  step('رابط المشاركة: ' + (await page.getByLabel('رابط المشاركة').inputValue()))
  await page.keyboard.press('Escape')
  await page.screenshot({ path: join(out, 'e2e-2-workspace.png') })

  await page.goto(B + '/dashboard')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: join(out, 'e2e-3-dashboard.png') })
  await page.getByRole('link', { name: /نظام إدارة مكتبة/ }).click()
  await page.getByRole('button', { name: 'حذف المشروع' }).click()
  await page.getByRole('button', { name: 'حذف نهائياً' }).click()
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  step('حُذف المشروع: ' + (await toasts()))
} catch (e) {
  console.log('✗ فشل:', e.message.split('\n')[0], '| url:', page.url(), '| toasts:', await toasts())
  await page.screenshot({ path: join(out, 'e2e-fail.png') })
} finally {
  await browser.close()
  // حذف الحساب التجريبي عبر REST
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: B },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  ).then((x) => x.json())
  if (r.idToken) {
    await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: B },
      body: JSON.stringify({ idToken: r.idToken }),
    })
    step('حُذف الحساب التجريبي ' + email)
  } else console.log('لم يُحذف الحساب التجريبي:', r.error?.message)
}
