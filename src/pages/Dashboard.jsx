import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { FolderPlus, Plus, Search, Share2 } from 'lucide-react'
import { Badge, Button, Card, Skeleton } from '@/components/ui/index.js'
import { fieldClass } from '@/components/ui/Input.jsx'
import { useProjects } from '@/hooks/useProjects.js'
import NewProjectModal from '@/features/projects/NewProjectModal.jsx'
import { STATUSES, formatDate, statusOf } from '@/features/projects/status.js'

// لوحة المشاريع (T3.3): بحث، وتصفية حسب الحالة، وحالة فارغة
export default function Dashboard() {
  const { t } = useTranslation('projects')
  const { projects, loading, error } = useProjects()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return projects.filter(
      (p) =>
        (status === 'all' || p.status === status) &&
        (!q || p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)),
    )
  }, [projects, search, status])

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{t('dashboard.title')}</h1>
          {!loading && (
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              {t('dashboard.count', { count: projects.length })}
            </p>
          )}
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-5" />
          {t('newProject')}
        </Button>
      </div>

      {projects.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('dashboard.searchPlaceholder')}
              aria-label={t('dashboard.search')}
              className={`${fieldClass} h-10 ps-9`}
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label={t('dashboard.filter')}
            className={`${fieldClass} h-10 sm:w-48`}
          >
            <option value="all">{t('dashboard.allStatuses')}</option>
            {Object.keys(STATUSES).map((k) => (
              <option key={k} value={k}>
                {t(`status.${k}`)}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <Card className="mt-6 border-red-200 text-red-700 dark:border-red-900 dark:text-red-300">
          {t('dashboard.loadFailed')}
        </Card>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : projects.length === 0 && !error ? (
        <EmptyState onCreate={() => setModalOpen(true)} />
      ) : error ? null : filtered.length === 0 ? (
        <p className="mt-10 text-center text-slate-500">{t('dashboard.noMatches')}</p>
      ) : (
        <motion.ul layout className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((p, i) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <ProjectCard project={p} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

function ProjectCard({ project: p }) {
  const { t } = useTranslation('projects')
  const st = statusOf(p.status)
  return (
    <Card
      as={Link}
      to={`/projects/${p.id}`}
      className="flex h-full flex-col gap-3 transition hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-md dark:hover:border-teal/30"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="line-clamp-2 text-lg font-bold">{p.title}</h2>
        <Badge tone={st.tone} className="shrink-0">
          {t(st.label)}
        </Badge>
      </div>
      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {p.description || t('dashboard.noDescription')}
      </p>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{t('lastEdited', { date: formatDate(p.updatedAt) })}</span>
        {p.isShared && (
          <span className="flex items-center gap-1">
            <Share2 className="size-3.5" />
            {t('dashboard.shared')}
          </span>
        )}
      </div>
    </Card>
  )
}

function EmptyState({ onCreate }) {
  const { t } = useTranslation('projects')
  return (
    <Card className="mt-8 flex flex-col items-center gap-4 py-14 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-teal/15 text-teal-600 dark:text-teal">
        <FolderPlus className="size-8" />
      </span>
      <h2 className="text-xl font-bold">{t('dashboard.emptyTitle')}</h2>
      <p className="max-w-sm text-slate-600 dark:text-slate-400">{t('dashboard.emptyText')}</p>
      <Button onClick={onCreate}>
        <Plus className="size-5" />
        {t('newProject')}
      </Button>
    </Card>
  )
}
