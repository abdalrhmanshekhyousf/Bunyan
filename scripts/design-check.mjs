// فحص استدعاء التصميم على تحليل المثال: node scripts/design-check.mjs [baseUrl]
import { chromium } from 'playwright'
const B = process.argv[2] ?? 'http://localhost:5199'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(B + '/')
const out = await page.evaluate(async () => {
  const { generateDesign } = await import('/src/features/analysis/analysisService.js')
  const { libraryAnalysis } = await import('/tests/fixtures/libraryAnalysis.js')
  const t0 = Date.now()
  try {
    return {
      ms: Date.now() - t0,
      d: await generateDesign(libraryAnalysis, 'ar'),
      t: Date.now() - t0,
    }
  } catch (e) {
    return { err: e.message }
  }
})
console.log(JSON.stringify(out, null, 1).slice(0, 7000))
await browser.close()
