// تنزيل المخطط SVG أو PNG (T5.8)

function save(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// SVG مستقل: نضيف الخلفية واتجاه النص
function standaloneSvg(svgEl, background) {
  const clone = svgEl.cloneNode(true)
  const { width, height } = svgEl.viewBox.baseVal
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', width)
  clone.setAttribute('height', height)
  clone.style.maxWidth = 'none'
  clone.style.background = background
  return { text: new XMLSerializer().serializeToString(clone), width, height }
}

export function downloadSvg(svgEl, name, background = '#ffffff') {
  const { text } = standaloneSvg(svgEl, background)
  save(new Blob([text], { type: 'image/svg+xml;charset=utf-8' }), `${name}.svg`)
}

export async function downloadPng(svgEl, name, background = '#ffffff', scale = 2) {
  const { text, width, height } = standaloneSvg(svgEl, background)
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text)
  await img.decode()
  const canvas = Object.assign(document.createElement('canvas'), {
    width: Math.ceil(width * scale),
    height: Math.ceil(height * scale),
  })
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
  if (!blob) throw new Error('png')
  save(blob, `${name}.png`)
}
