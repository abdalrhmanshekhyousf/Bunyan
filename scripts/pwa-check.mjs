// فحص قابلية التثبيت (PWA): node scripts/pwa-check.mjs [baseUrl]
// يتحقق من manifest وعامل الخدمة وأخطاء التثبيت كما يراها Chromium
import { chromium } from 'playwright'

const B = process.argv[2] ?? 'http://localhost:5200'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(B + '/', { waitUntil: 'load' })
const sw = await page.evaluate(async () => {
  const reg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((r) => setTimeout(() => r(null), 10000)),
  ])
  return reg ? reg.active?.scriptURL : null
})
const cdp = await page.context().newCDPSession(page)
const { url, errors } = await cdp.send('Page.getAppManifest')
const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors')
console.log('manifest:', url, errors.length ? errors : '✓ بلا أخطاء')
console.log('عامل الخدمة:', sw ?? '✗ لم يُسجَّل')
console.log(
  'قابلية التثبيت:',
  installabilityErrors.length ? installabilityErrors.map((e) => e.errorId) : '✓ قابل للتثبيت',
)
// العمل دون اتصال: الواجهة تُفتح من الذاكرة
await page.context().setOffline(true)
await page.reload({ waitUntil: 'load' }).catch(() => {})
const offline = await page.locator('#root *').count()
console.log('دون اتصال:', offline ? '✓ الواجهة تُفتح' : '✗ لا تُفتح')
await browser.close()
process.exitCode = errors.length || installabilityErrors.length || !sw ? 1 : 0
