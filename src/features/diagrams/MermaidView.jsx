import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Maximize, Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/index.js'
import { useIsDark } from '@/hooks/useIsDark.js'
import { renderMermaid } from './renderMermaid.js'

const MIN = 0.3
const MAX = 4

// يرسم شيفرة Mermaid (T5.3) مع تكبير وتصغير وسحب (T5.5).
// svgRef يُعطى للأب لاستعماله في التنزيل.
// canvas: يملأ مساحة الأب بخلفية شبكية كلوحة رسم (محرّر المخططات بأسلوب draw.io)
export default function MermaidView({ code, svgRef, label, canvas = false }) {
  const { t } = useTranslation('diagrams')
  const dark = useIsDark()
  const hostRef = useRef(null)
  const [state, setState] = useState({ status: 'loading', error: null })
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 })
  const drag = useRef(null)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', error: null })
    renderMermaid(code, dark ? 'dark' : 'light')
      .then((svg) => {
        if (cancelled || !hostRef.current) return
        // الناتج مُنقّى داخل Mermaid (securityLevel: strict + DOMPurify)
        hostRef.current.innerHTML = svg
        const el = hostRef.current.querySelector('svg')
        if (el) {
          el.setAttribute('role', 'img')
          el.setAttribute('aria-label', label)
        }
        if (svgRef) svgRef.current = el
        setView({ scale: 1, x: 0, y: 0 })
        setState({ status: 'ready', error: null })
      })
      .catch((e) => {
        if (cancelled) return
        if (svgRef) svgRef.current = null
        setState({
          status: 'error',
          error: String(e?.message ?? e)
            .split('\n')
            .slice(0, 3)
            .join('\n'),
        })
      })
    return () => {
      cancelled = true
    }
  }, [code, dark, svgRef, label])

  const zoom = (factor) =>
    setView((v) => ({ ...v, scale: Math.min(MAX, Math.max(MIN, v.scale * factor)) }))

  function onWheel(e) {
    if (!e.ctrlKey && !e.metaKey) return // التمرير العادي يحرّك الصفحة
    e.preventDefault()
    zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15)
  }
  function onPointerDown(e) {
    if (e.button !== 0) return
    drag.current = { x: e.clientX - view.x, y: e.clientY - view.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e) {
    if (!drag.current) return
    setView((v) => ({ ...v, x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }))
  }
  const endDrag = () => (drag.current = null)

  return (
    <div className={canvas ? 'canvas-grid relative h-full' : 'relative'}>
      {state.status === 'error' && (
        <div
          role="alert"
          className={`flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300 ${canvas ? 'm-4' : ''}`}
        >
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-5" />
            {t('view.renderError')}
          </p>
          <pre dir="ltr" className="overflow-x-auto text-start text-xs whitespace-pre-wrap">
            {state.error}
          </pre>
        </div>
      )}
      {state.status === 'loading' && (
        <Skeleton className={canvas ? 'absolute inset-6 rounded-xl' : 'h-80 rounded-xl'} />
      )}

      <div
        className={
          state.status !== 'ready'
            ? 'hidden'
            : canvas
              ? 'relative h-full min-h-[22rem] cursor-grab touch-none overflow-hidden active:cursor-grabbing'
              : 'relative h-[min(70vh,640px)] cursor-grab touch-none overflow-hidden rounded-xl border border-slate-200 bg-white active:cursor-grabbing dark:border-slate-800 dark:bg-ink'
        }
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => setView({ scale: 1, x: 0, y: 0 })}
      >
        <div
          dir="ltr"
          className="mermaid-host flex h-full w-full origin-center items-center justify-center p-4 [&>svg]:h-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:max-w-full"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
          ref={hostRef}
        />
        <div className="no-print absolute start-3 bottom-3 flex items-center gap-1 rounded-xl bg-white/90 p-1 shadow ring-1 ring-slate-200 dark:bg-slate-900/90 dark:ring-slate-700">
          <ZoomBtn label={t('view.zoomIn')} onClick={() => zoom(1.25)}>
            <Plus className="size-4" />
          </ZoomBtn>
          <span className="w-12 text-center text-xs tabular-nums">
            {Math.round(view.scale * 100)}%
          </span>
          <ZoomBtn label={t('view.zoomOut')} onClick={() => zoom(1 / 1.25)}>
            <Minus className="size-4" />
          </ZoomBtn>
          <ZoomBtn label={t('view.fit')} onClick={() => setView({ scale: 1, x: 0, y: 0 })}>
            <Maximize className="size-4" />
          </ZoomBtn>
        </div>
      </div>
    </div>
  )
}

function ZoomBtn({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={label}
      title={label}
      className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  )
}
