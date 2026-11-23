import { useCallback, useEffect, useState } from 'react'
import { FileStack, FolderKanban, RefreshCw, Sparkles, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Card, Skeleton } from '@/components/ui/index.js'
import { getStats } from './adminService.js'

const CARDS = [
  { key: 'users', icon: Users },
  { key: 'projects', icon: FolderKanban },
  { key: 'analyses', icon: Sparkles },
  { key: 'templates', icon: FileStack },
]

// بطاقات الإحصاءات (T8.3)
export default function StatsCards() {
  const { t, i18n } = useTranslation('admin')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const apply = useCallback((s) => {
    setStats(s)
    setLoading(false)
  }, [])

  // التحميل الأول: loading تبدأ true فلا حاجة لضبطها هنا
  useEffect(() => {
    let alive = true
    getStats().then((s) => alive && apply(s))
    return () => {
      alive = false
    }
  }, [apply])

  async function load() {
    setLoading(true)
    apply(await getStats())
  }

  const fmt = new Intl.NumberFormat(i18n.language)

  return (
    <section aria-label={t('title')}>
      <div className="mb-3 flex justify-end">
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
          {t('refresh')}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CARDS.map(({ key, icon: Icon }) => {
          const value = stats?.[key]
          return (
            <Card key={key} className="flex items-center gap-4 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal/15 text-teal-600 dark:text-teal">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                  {t(`stats.${key}`)}
                </p>
                {loading && !stats ? (
                  <Skeleton className="mt-1 h-7 w-12" />
                ) : value == null ? (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {t('stats.unavailable')}
                  </p>
                ) : (
                  <p className="text-2xl font-bold tabular-nums">{fmt.format(value)}</p>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
