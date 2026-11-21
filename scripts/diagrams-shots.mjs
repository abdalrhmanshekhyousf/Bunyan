// تصوير المخططات الخمسة لمشروع بتحليل جاهز (دون Gemini): node scripts/diagrams-shots.mjs <outDir> [baseUrl] [dark]
import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const [out = 'shots', B = 'http://localhost:5199', scheme = 'light'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const apiKey = readFileSync('.env.local', 'utf8')
  .match(/VITE_FIREBASE_API_KEY=(.*)/)[1]
  .trim()
const email = `diag.${Date.now()}@bunyan-test.dev`
const password = 'Test12345!'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: scheme })
page.on('pageerror', (e) => console.log('pageerror:', e.message))
let projectId
try {
  await page.goto(B + '/register')
  await page.getByLabel('الاسم').fill('مختبر المخططات')
  await page.getByLabel('البريد الإلكتروني').fill(email)
  await page.getByLabel('كلمة المرور', { exact: true }).fill(password)
  await page.getByLabel('تأكيد كلمة المرور').fill(password)
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click()
  await page.waitForURL('**/dashboard', { timeout: 20000 })
  projectId = await page.evaluate(async () => {
    const { auth } = await import('/src/lib/firebase.js')
    const { createProject } = await import('/src/features/projects/projectsService.js')
    const { saveEditedAnalysis } = await import('/src/features/analysis/analysisService.js')
    const { librarySample } = await import('/src/features/projects/sampleProject.js')
    const { libraryAnalysis } = await import('/tests/fixtures/libraryAnalysis.js')
    const id = await createProject(auth.currentUser.uid, librarySample)
    await saveEditedAnalysis({ id, currentVersion: 0 }, libraryAnalysis)
    return id
  })
  await page.goto(`${B}/projects/${projectId}`)
  await page.getByRole('tab', { name: 'المخططات' }).click()
  for (const name of ['حالات الاستخدام', 'الأصناف', 'التتابع', 'النشاط', 'الكيانات والعلاقات']) {
    await page.getByRole('tab', { name }).click()
    await page
      .locator('.mermaid-host svg')
      .waitFor({ timeout: 20000 })
      .catch(() => {})
    await page.waitForTimeout(600)
    const err = await page.getByRole('alert').allInnerTexts()
    const f = join(out, `diagram-${scheme}-${name}.png`)
    await page.locator('main').screenshot({ path: f })
    console.log(err.length ? `✗ ${name}: ${err.join(' ')}` : `✓ ${name}`)
  }
  // تنزيل PNG
  const dl = page.waitForEvent('download', { timeout: 10000 })
  await page.getByRole('button', { name: 'PNG' }).click()
  const file = await dl
  console.log('تنزيل PNG:', file.suggestedFilename())
} catch (e) {
  console.log('✗ فشل:', e.message.split('\n')[0])
  await page.screenshot({ path: join(out, 'diagram-fail.png') })
} finally {
  if (projectId)
    await page
      .evaluate(async (id) => {
        const { deleteProject } = await import('/src/features/projects/projectsService.js')
        await deleteProject(id)
      }, projectId)
      .catch(() => {})
  await browser.close()
  const H = { 'Content-Type': 'application/json', Referer: B }
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  ).then((x) => x.json())
  if (r.idToken)
    await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ idToken: r.idToken }),
    })
}
