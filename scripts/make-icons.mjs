// توليد أيقونات PNG للتطبيق القابل للتثبيت (PWA) من شعار Data Analytics: node scripts/make-icons.mjs
import { chromium } from 'playwright'

// الشعار نفسه في public/favicon.svg
const mark = `
  <rect x="6" y="36" width="12" height="18" rx="3" fill="#fff"/>
  <rect x="26" y="26" width="12" height="28" rx="3" fill="#fff"/>
  <rect x="46" y="16" width="12" height="38" rx="3" fill="#fff"/>
  <rect x="4" y="57" width="56" height="3.5" rx="1.75" fill="#fff"/>
  <path d="M12 26 32 16 52 6" fill="none" stroke="#2DD4BF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="26" r="4.5" fill="#2DD4BF"/>
  <circle cx="32" cy="16" r="4.5" fill="#2DD4BF"/>
  <circle cx="52" cy="6" r="4.5" fill="#2DD4BF"/>`
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
