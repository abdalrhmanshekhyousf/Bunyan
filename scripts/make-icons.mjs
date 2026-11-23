// توليد أيقونات PNG للتطبيق القابل للتثبيت (PWA) من شعار بُنيان: node scripts/make-icons.mjs
import { chromium } from 'playwright'

// الشعار نفسه في public/favicon.svg
const mark = `
  <rect x="21" y="6" width="22" height="13" rx="3.5" fill="#2DD4BF"/>
  <path d="M32 19v9M17 34v-6h30v6" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/>
  <rect x="5" y="33" width="24" height="13" rx="3.5" fill="#fff"/>
  <rect x="35" y="33" width="24" height="13" rx="3.5" fill="#fff"/>
  <rect x="5" y="51" width="54" height="3.5" rx="1.75" fill="#fff"/>`
// any: مربع بزوايا مدوّرة. maskable وapple: خلفية تملأ المربع والشعار داخل المنطقة الآمنة (60%)
const svg = (rounded) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${rounded ? 15 : 0}" fill="#1E2A78"/>
  <g transform="translate(${rounded ? '12.8 12.8) scale(0.6' : '16 16) scale(0.5'})">${mark}</g></svg>`

const icons = [
  ['icon-192.png', 192, true],
  ['icon-512.png', 512, true],
  ['maskable-512.png', 512, false],
  ['apple-touch-icon.png', 180, false],
]
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, size, rounded] of icons) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>*{margin:0}body{background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg(rounded)}`,
  )
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: true })
  console.log('✓', name)
}
await browser.close()
