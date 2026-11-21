// تحميل Mermaid عند الحاجة فقط (حجمه كبير) وتهيئته بألوان بُنيان (T5.4) وبأمان صارم (T5.10)

const THEMES = {
  light: {
    background: '#ffffff',
    primaryColor: '#e0f2f1',
    primaryBorderColor: '#14b8a6',
    primaryTextColor: '#0f172a',
    secondaryColor: '#eef0fb',
    tertiaryColor: '#f8fafc',
    lineColor: '#1e2a78',
    textColor: '#0f172a',
    mainBkg: '#e0f2f1',
    clusterBkg: '#f8fafc',
    clusterBorder: '#1e2a78',
    actorBkg: '#e0f2f1',
    actorTextColor: '#0f172a',
    actorBorder: '#14b8a6',
    actorLineColor: '#94a3b8',
    signalColor: '#1e2a78',
    signalTextColor: '#0f172a',
    noteBkgColor: '#fef3c7',
    labelBoxBkgColor: '#e0f2f1',
    attributeBackgroundColorOdd: '#ffffff',
    attributeBackgroundColorEven: '#f1f5f9',
  },
  dark: {
    background: '#0f172a',
    darkMode: true,
    primaryColor: '#134e4a',
    primaryBorderColor: '#2dd4bf',
    primaryTextColor: '#f1f5f9',
    secondaryColor: '#1e293b',
    tertiaryColor: '#1e293b',
    lineColor: '#94a3b8',
    textColor: '#f1f5f9',
    mainBkg: '#134e4a',
    clusterBkg: '#111827',
    clusterBorder: '#2dd4bf',
    actorBkg: '#134e4a',
    actorTextColor: '#f1f5f9',
    actorBorder: '#2dd4bf',
    actorLineColor: '#475569',
    signalColor: '#cbd5e1',
    signalTextColor: '#f1f5f9',
    noteBkgColor: '#422006',
    noteTextColor: '#fef3c7',
    labelBoxBkgColor: '#134e4a',
    attributeBackgroundColorOdd: '#0f172a',
    attributeBackgroundColorEven: '#1e293b',
  },
}

let mermaidPromise
let lastTheme
let counter = 0

async function getMermaid(theme) {
  mermaidPromise ??= import('mermaid').then((m) => m.default)
  const mermaid = await mermaidPromise
  if (lastTheme !== theme) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict', // يمنع click والروابط وHTML داخل العقد
      theme: 'base',
      fontFamily: 'Readex Pro, sans-serif',
      themeVariables: { fontFamily: 'Readex Pro, sans-serif', fontSize: '15px', ...THEMES[theme] },
      flowchart: { curve: 'basis', padding: 12 },
      sequence: { mirrorActors: false, messageAlign: 'center' },
      er: { layoutDirection: 'TB' },
    })
    lastTheme = theme
  }
  return mermaid
}

// يعيد { svg } أو يرمي خطأ صياغة برسالة مفهومة
export async function renderMermaid(code, theme = 'light') {
  // القياس قبل تحميل الخط يقصّ النص العربي (T0.8)
  await document.fonts.load('15px "Readex Pro"').catch(() => {})
  const mermaid = await getMermaid(theme)
  const id = `mmd-${++counter}`
  try {
    await mermaid.parse(code)
    const { svg } = await mermaid.render(id, code)
    return svg
  } finally {
    // Mermaid يترك عنصراً مؤقتاً في الصفحة عند الفشل
    document.getElementById(`d${id}`)?.remove()
  }
}

export async function validateMermaid(code) {
  const mermaid = await getMermaid(lastTheme ?? 'light')
  try {
    await mermaid.parse(code)
    return null
  } catch (e) {
    return String(e?.message ?? e)
      .split('\n')
      .slice(0, 4)
      .join('\n')
  }
}
