import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth.js'
import { getDailyLimit, watchAnalyses, watchUsage } from './analysisService.js'

// كل إصدارات التحليل، والإصدار الحالي منها
export function useAnalyses(project) {
  const [state, setState] = useState({ versions: [], loading: true })
  const id = project?.id

  useEffect(() => {
    if (!id) return
    return watchAnalyses(
      id,
      (versions) => setState({ versions, loading: false }),
      () => setState({ versions: [], loading: false }),
    )
  }, [id])

  const current =
    state.versions.find((v) => v.id === project?.currentAnalysisId) ?? state.versions[0] ?? null
  return { ...state, current }
}

// الرصيد المتبقي اليوم (T4.13)
export function useQuota() {
  const { user } = useAuth()
  const [used, setUsed] = useState(0)
  const [limit, setLimit] = useState(null)

  useEffect(() => {
    getDailyLimit().then(setLimit)
    if (!user) return
    return watchUsage(user.uid, setUsed)
  }, [user])

  return { used, limit, remaining: limit == null ? null : Math.max(0, limit - used) }
}
