import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { runAnalysis } from './analysisService.js'
import { useQuota } from './useAnalysis.js'
import AnalysisProgress from './AnalysisProgress.jsx'

const MIN_LENGTH = 40

export default function AnalyzeButton({ project, onDone, variant = 'primary', label }) {
  const { t } = useTranslation('analysis')
  const { user } = useAuth()
  const { remaining, limit } = useQuota()
  const [stage, setStage] = useState(null)
  const tooShort = (project.description?.trim().length ?? 0) < MIN_LENGTH
  const exhausted = remaining === 0

  async function onClick() {
    setStage('thinking')
    try {
      await runAnalysis({ project, uid: user.uid, onStage: setStage })
      toast.success(t('analyze.done'))
      onDone?.()
    } catch (e) {
      toast.error(e.message, { duration: 8000 })
    } finally {
      setStage(null)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        variant={variant}
        onClick={onClick}
        disabled={tooShort || exhausted || !!stage}
        title={tooShort ? t('analyze.tooShortTitle', { min: MIN_LENGTH }) : undefined}
      >
        <Sparkles className="size-5" />
        {label ?? t(project.currentAnalysisId ? 'analyze.again' : 'analyze.start')}
      </Button>
      <p className="text-xs text-slate-500">
        {tooShort
          ? t('analyze.tooShort', { min: MIN_LENGTH })
          : exhausted
            ? t('analyze.exhausted', { limit })
            : remaining != null && t('analyze.remaining', { remaining, limit })}
      </p>
      <AnalysisProgress stage={stage} />
    </div>
  )
}
