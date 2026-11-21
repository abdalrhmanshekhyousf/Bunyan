// يفتح صفحة المختبر، يطبع نتيجة كل مخطط، ويصوّرها، ويولّد PDF بالطريقتين.
// الاستعمال: node scripts/lab-check.mjs <outDir> [url]
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const outDir = process.argv[2] ?? 'lab-out'
const url = process.argv[3] ?? 'http://localhost:5199/lab.html'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1300, height: 900 },
  deviceScaleFactor: 1.5,
})
page.on('pageerror', (e) => console.log('pageerror:', e.message))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForFunction(() => Object.keys(window.__results).length >= 11, null, {
  timeout: 30000,
})
await page.evaluate(() => document.fonts.ready)

console.log(JSON.stringify(await page.evaluate(() => window.__results), null, 2))

for (const el of await page.$$('[data-diagram]')) {
  const id = await el.getAttribute('data-diagram')
  const box = await el.boundingBox()
  if (box && box.height > 5) await el.screenshot({ path: join(outDir, `${id}.png`) })
}

const b64 = await page.evaluate(() => window.__canvasPdfBase64())
writeFileSync(join(outDir, 'report-canvas.pdf'), Buffer.from(b64, 'base64'))

await page.emulateMedia({ media: 'print' })
await page.pdf({
  path: join(outDir, 'report-print.pdf'),
  format: 'A4',
  printBackground: true,
  margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
})

await browser.close()
console.log('done')
