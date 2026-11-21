// تصدير تقرير المثال PDF عبر مسار الطباعة نفسه، دون Firebase:
// node scripts/report-check.mjs <outDir> [ar|en] [baseUrl]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const [out = 'report-out', lang = 'ar', B = 'http://localhost:5199'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('pageerror:', e.message))
page.on('console', (m) => m.type() === 'error' && console.log('console:', m.text().slice(0, 200)))
await page.addInitScript((l) => localStorage.setItem('lang', l), lang)
await page.goto(`${B}/report-lab.html?lang=${lang}`, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__ready > 0, null, { timeout: 60000 })
await page.waitForTimeout(800)
console.log('diagrams:', await page.evaluate(() => window.__ready))
await page.emulateMedia({ media: 'print' })
const file = join(out, `report-${lang}.pdf`)
await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true })
console.log('pdf:', file)
await browser.close()
