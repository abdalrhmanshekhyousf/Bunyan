import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { runAnalysis } from './analysisService.js'
import { useQuota } from './useAnalysis.js'
import AnalysisProgress from './AnalysisProgress.jsx'

const MIN_LENGTH = 40

export default function AnalyzeButton({ project, onDone, variant = 'primary', label }) {
  const { user } = useAuth()
  const { remaining, limit } = useQuota()
  const [stage, setStage] = useState(null)
  const tooShort = (project.description?.trim().length ?? 0) < MIN_LENGTH
  const exhausted = remaining === 0

  async function onClick() {
    setStage('thinking')
    try {
      await runAnalysis({ project, uid: user.uid, onStage: setStage })
      toast.success('اكتمل التحليل.')
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
        title={tooShort ? `اكتب وصفاً لا يقل عن ${MIN_LENGTH} حرفاً` : undefined}
      >
        <Sparkles className="size-5" />
        {label ?? (project.currentAnalysisId ? 'أعد التحليل' : 'حلّل الوصف')}
      </Button>
      <p className="text-xs text-slate-500">
        {tooShort
          ? `اكتب وصفاً لا يقل عن ${MIN_LENGTH} حرفاً لتبدأ التحليل.`
          : exhausted
            ? `استنفدت تحليلاتك اليوم (${limit}). يتجدد الرصيد غداً.`
            : remaining != null && `متبقٍّ لك اليوم: ${remaining} من ${limit} تحليلات`}
      </p>
      <AnalysisProgress stage={stage} />
    </div>
  )
}
