// مُشغّل vite وvitest بمسار موحّد الحالة على ويندوز.
// طرفية VS Code تفتح المجلد بحرف قرص صغير (c:\...)، فتصل الوحدة نفسها بمسارين
// (c:\ و C:\) وتُحمَّل مرتين: نسختان من React ⇐ «Invalid hook call» في vite،
// ونسختان من vitest ⇐ «Cannot read properties of undefined (reading 'config')».
// الاستعمال: node scripts/run.mjs <vite|vitest> [وسائط...]
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const bins = {
  vite: 'node_modules/vite/bin/vite.js',
  vitest: 'node_modules/vitest/vitest.mjs',
}
const [name, ...args] = process.argv.slice(2)
if (!bins[name]) {
  console.error(`أداة غير معروفة: ${name}. المتاح: ${Object.keys(bins).join('، ')}`)
  process.exit(1)
}
const cwd =
  process.platform === 'win32'
    ? process.cwd().replace(/^[a-z]:/, (d) => d.toUpperCase())
    : process.cwd()
const r = spawnSync(process.execPath, [join(cwd, bins[name]), ...args], { cwd, stdio: 'inherit' })
process.exit(r.status ?? 1)
