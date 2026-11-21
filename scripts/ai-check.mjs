// فحص AI Logic من داخل التطبيق: node scripts/ai-check.mjs <baseUrl> [raw]
import { chromium } from 'playwright'
const [B, mode] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(B + '/')
const out = await page.evaluate(async (mode) => {
  const { analyzeDescription } = await import('/src/features/analysis/analysisService.js')
  const { librarySample } = await import('/src/features/projects/sampleProject.js')
  const { jsonModel, MODEL } = await import('/src/lib/ai.js')
  const { analysisJsonSchema } = await import('/src/features/analysis/schema.js')
  const t0 = Date.now()
  try {
    if (mode === 'raw') {
      const r = await jsonModel({
        systemInstruction: 'Return JSON.',
        schema: analysisJsonSchema,
      }).generateContent('مكتبة فيها كتب وطلاب')
      return { MODEL, ok: r.response.text().slice(0, 300) }
    }
    const a = await analyzeDescription(librarySample.description, 'ar')
    return { MODEL, ms: Date.now() - t0, a }
  } catch (e) {
    return {
      MODEL,
      err: e.message,
      cause: String(e.cause?.message ?? e.customErrorData?.message ?? '').slice(0, 800),
      kind: e.kind,
    }
  }
}, mode)
console.log(JSON.stringify(out, null, 1).slice(0, 8000))
await browser.close()
