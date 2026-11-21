// جولة مصوّرة في مشروع بتحليل جاهز، بلغة الواجهة المختارة: node scripts/ui-tour.mjs <outDir> <ar|en> [baseUrl]
import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const [out = 'tour', lang = 'en', B = 'http://localhost:5199'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const apiKey = readFileSync('.env.local', 'utf8')
  .match(/VITE_FIREBASE_API_KEY=(.*)/)[1]
  .trim()
const email = `tour.${Date.now()}@bunyan-test.dev`
const password = 'Test12345!'
const L = {
  en: {
    tabs: ['Analysis', 'Diagrams', 'Database'],
    name: 'Name',
    email: 'Email',
    pass: 'Password',
    confirm: 'Confirm password',
    submit: 'Create account',
  },
  ar: {
    tabs: ['التحليل', 'المخططات', 'قاعدة البيانات'],
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    pass: 'كلمة المرور',
    confirm: 'تأكيد كلمة المرور',
    submit: 'إنشاء الحساب',
  },
}[lang]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.addInitScript((l) => localStorage.setItem('lang', l), lang)
page.on('pageerror', (e) => console.log('pageerror:', e.message))
let projectId
const shot = async (name) => {
  await page.waitForTimeout(900)
  await page.screenshot({ path: join(out, `${lang}-${name}.png`), fullPage: true })
  console.log('✓', name)
}
try {
  await page.goto(B + '/')
  await shot('landing')
  await page.goto(B + '/register')
  await page.getByLabel(L.name).fill('Tour')
  await page.getByLabel(L.email).fill(email)
  await page.getByLabel(L.pass, { exact: true }).fill(password)
  await page.getByLabel(L.confirm).fill(password)
  await page.getByRole('button', { name: L.submit }).click()
  await page.waitForURL('**/dashboard', { timeout: 30000 })
  projectId = await page.evaluate(async (lang) => {
    const { auth } = await import('/src/lib/firebase.js')
    const { createProject } = await import('/src/features/projects/projectsService.js')
    const { saveEditedAnalysis } = await import('/src/features/analysis/analysisService.js')
    const { librarySamples } = await import('/src/features/projects/sampleProject.js')
    const { libraryAnalysis } = await import('/tests/fixtures/libraryAnalysis.js')
    const id = await createProject(auth.currentUser.uid, {
      ...librarySamples[lang],
      language: lang,
    })
    await saveEditedAnalysis({ id, currentVersion: 0 }, libraryAnalysis)
    return id
  }, lang)
  await page.goto(B + '/dashboard')
  await shot('dashboard')
  await page.goto(`${B}/projects/${projectId}`)
  for (const [i, tab] of L.tabs.entries()) {
    await page.getByRole('tab', { name: tab, exact: true }).click()
    if (i === 1) await page.locator('.mermaid-host svg').waitFor({ timeout: 20000 })
    await shot(['analysis', 'diagrams', 'database'][i])
  }
} catch (e) {
  console.log('✗', e.message.split('\n')[0])
  await page.screenshot({ path: join(out, `${lang}-fail.png`) })
} finally {
  if (projectId)
    await page
      .evaluate(
        async (id) => (await import('/src/features/projects/projectsService.js')).deleteProject(id),
        projectId,
      )
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
