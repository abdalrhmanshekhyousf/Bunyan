import { AnimatePresence, motion } from 'motion/react'
import { BrainCircuit, Check, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn.js'
import { useTranslation } from 'react-i18next'

const STAGES = [
  { id: 'thinking', label: 'progress.thinking' },
  { id: 'validating', label: 'progress.validating' },
  { id: 'saving', label: 'progress.saving' },
]

// شاشة انتظار متحركة تعرض مراحل التحليل (T4.9)
export default function AnalysisProgress({ stage }) {
  const { t } = useTranslation('analysis')
  const idx = Math.max(
    0,
    STAGES.findIndex((s) => s.id === (stage === 'retrying' ? 'thinking' : stage)),
  )
  return (
    <AnimatePresence>
      {stage && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="status"
          aria-live="polite"
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl dark:bg-slate-900"
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
          >
            <div className="flex flex-col items-center text-center">
              <motion.span
                className="flex size-16 items-center justify-center rounded-2xl bg-navy text-white dark:bg-teal/15 dark:text-teal"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              >
                <BrainCircuit className="size-8" />
              </motion.span>
              <h2 className="mt-4 text-xl font-bold">{t('progress.title')}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {stage === 'retrying' ? t('progress.retrying') : t('progress.wait')}
              </p>
            </div>
            <ol className="mt-6 flex flex-col gap-3">
              {STAGES.map((s, i) => {
                const done = i < idx
                const active = i === idx
                return (
                  <li
                    key={s.id}
                    className={cn(
                      'flex items-center gap-3 text-sm',
                      !done && !active && 'text-slate-400',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full',
                        done && 'bg-teal text-white',
                        active && 'bg-navy/10 text-navy dark:bg-teal/15 dark:text-teal',
                        !done && !active && 'bg-slate-100 dark:bg-slate-800',
                      )}
                    >
                      {done ? (
                        <Check className="size-4" />
                      ) : active ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className={cn(active && 'font-semibold')}>{t(s.label)}</span>
                  </li>
                )
              })}
            </ol>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
