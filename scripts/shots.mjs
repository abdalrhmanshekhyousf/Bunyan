// تصوير صفحات للمراجعة: node scripts/shots.mjs <outDir> <baseUrl> path1 path2 ...
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
const [outDir, base, ...paths] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
for (const [name, vp, scheme] of [['desk', { width: 1280, height: 800 }, 'light'], ['mob-dark', { width: 390, height: 844 }, 'dark']]) {
  const page = await browser.newPage({ viewport: vp, colorScheme: scheme })
  page.on('pageerror', (e) => console.log('pageerror:', e.message))
  page.on('console', (m) => m.type() === 'error' && console.log('console:', m.text()))
  for (const p of paths) {
    await page.goto(base + '/' + p, { waitUntil: 'networkidle' })
    for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += 300) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120) }; await page.waitForTimeout(600); await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300)
    const f = join(outDir, `${name}_${p.replace(/\W+/g, '_')}.png`)
    await page.screenshot({ path: f, fullPage: true })
    console.log(f, await page.evaluate(() => document.documentElement.scrollWidth > innerWidth ? 'H-SCROLL!' : 'ok'))
  }
  await page.close()
}
await browser.close()
