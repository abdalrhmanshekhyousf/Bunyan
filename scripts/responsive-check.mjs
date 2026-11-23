// فحص التجاوب وإمكانية الوصول (T9.9 + T9.10):
// يمرّ على الصفحات بعرض الجوال والتابلت والحاسوب، ويبحث عن:
//  - تمرير أفقي (عنصر أعرض من الشاشة)
//  - أزرار وروابط بلا اسم مقروء (أيقونة دون aria-label)
//  - أخطاء JavaScript
// ويحفظ لقطة لكل صفحة. الاستعمال (السيرفر يعمل على 5199):
//   node scripts/responsive-check.mjs <outDir> [ar|en] [baseUrl]
import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const [out = 'responsive-out', lang = 'ar', B = 'http://localhost:5199'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const apiKey = readFileSync('.env.local', 'utf8')
  .match(/VITE_FIREBASE_API_KEY=(.*)/)[1]
  .trim()
const email = `resp.${Date.now()}@bunyan-test.dev`
const password = 'Test12345!'
const L = {
  ar: {
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    pass: 'كلمة المرور',
    confirm: 'تأكيد كلمة المرور',
    submit: 'إنشاء الحساب',
    newProject: 'مشروع جديد',
    sample: 'جرّب مثال المكتبة',
    create: 'إنشاء المشروع',
    menu: 'فتح القائمة',
  },
  en: {
    name: 'Name',
    email: 'Email',
    pass: 'Password',
    confirm: 'Confirm password',
    submit: 'Create account',
    newProject: 'New project',
    sample: 'Try the library example',
    create: 'Create project',
    menu: 'Open menu',
  },
}[lang]

const WIDTHS = [
  ['phone', 390, 844],
  ['tablet', 768, 1024],
  ['desktop', 1280, 900],
]

const browser = await chromium.launch()
const ctx = await browser.newContext()
await ctx.addInitScript((l) => localStorage.setItem('lang', l), lang)
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
let problems = 0
let projectId

// يعيد العناصر الأعرض من الشاشة، والأزرار والروابط بلا اسم
const audit = () =>
  page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const overflow = document.documentElement.scrollWidth > vw
    const wide = []
    if (overflow) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.width && (r.right > vw + 1 || r.left < -1)) {
          // داخل حاوية تمرير مقصودة (جدول مثلاً) لا يُعدّ خطأ
          let p = el.parentElement
          let scrolls = false
          while (p && p !== document.body) {
            const ox = getComputedStyle(p).overflowX
            if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') {
              scrolls = true
              break
            }
            p = p.parentElement
          }
          if (!scrolls)
            wide.push(`${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join('.')}`)
        }
      }
    }
    const unnamed = [...document.querySelectorAll('button, a[href], [role="tab"]')]
      .filter((el) => el.offsetParent !== null)
      .filter((el) => {
        const name =
          el.getAttribute('aria-label') ||
          el.getAttribute('title') ||
          el.textContent.trim() ||
          el.querySelector('[aria-label]')?.getAttribute('aria-label') ||
          el.querySelector('img[alt]')?.getAttribute('alt')
        return !name
      })
      .map((el) => el.outerHTML.slice(0, 90))
    return { overflow, wide: wide.slice(0, 5), unnamed }
  })

async function check(label) {
  for (const [dev, w, h] of WIDTHS) {
    await page.setViewportSize({ width: w, height: h })
    await page.waitForTimeout(600)
    const r = await audit()
    const bad = (r.overflow && r.wide.length) || r.unnamed.length
    if (bad) problems++
    console.log(
      `${bad ? '✗' : '✓'} ${label} @${dev}` +
        (r.overflow && r.wide.length ? `\n    تمرير أفقي: ${r.wide.join(' | ')}` : '') +
        (r.unnamed.length ? `\n    بلا اسم: ${r.unnamed.join('\n             ')}` : ''),
    )
    await page.screenshot({ path: join(out, `${lang}-${label}-${dev}.png`), fullPage: false })
  }
}

try {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1600) // انتهاء حركة الشعار
  await check('landing')

  await page.goto(B + '/login', { waitUntil: 'networkidle' })
  await check('login')

  await page.goto(B + '/register', { waitUntil: 'networkidle' })
  await page.getByLabel(L.name).fill('Responsive')
  await page.getByLabel(L.email).fill(email)
  await page.getByLabel(L.pass, { exact: true }).fill(password)
  await page.getByLabel(L.confirm).fill(password)
  await page.getByRole('button', { name: L.submit }).click()
  await page.waitForURL('**/dashboard', { timeout: 20000 })
  await check('dashboard-empty')

  await page.getByRole('button', { name: L.newProject }).first().click()
  await page.getByRole('button', { name: L.sample }).click()
  await check('new-project-modal')
  await page.getByRole('button', { name: L.create }).click()
  await page.waitForURL('**/projects/**', { timeout: 20000 })
  projectId = page.url().split('/projects/')[1]
  await page.waitForTimeout(800)
  await check('workspace')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: L.menu }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(out, `${lang}-menu-phone.png`) })
  await page.keyboard.press('Escape')

  await page.goto(B + '/dashboard', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  await check('dashboard')
} catch (e) {
  problems++
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
  if (errors.length) console.log('أخطاء JavaScript:\n  ' + [...new Set(errors)].join('\n  '))
  console.log(problems || errors.length ? `\n${problems} مشكلة` : '\nلا مشاكل')
  process.exitCode = problems || errors.length ? 1 : 0
}
