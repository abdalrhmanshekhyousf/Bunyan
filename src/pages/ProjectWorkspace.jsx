import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  ArrowRight,
  BrainCircuit,
  Database,
  Eye,
  FileText,
  Lightbulb,
  Network,
  Share2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, Modal, Skeleton, Tabs } from '@/components/ui/index.js'
import { useAuth } from '@/hooks/useAuth.js'
import { useProject } from '@/hooks/useProjects.js'
import DescriptionEditor from '@/features/projects/DescriptionEditor.jsx'
import AnalysisPanel from '@/features/analysis/AnalysisPanel.jsx'
import AnalyzeButton from '@/features/analysis/AnalyzeButton.jsx'
import DiagramsPanel from '@/features/diagrams/DiagramsPanel.jsx'
import DatabasePanel from '@/features/database/DatabasePanel.jsx'
import ShareModal from '@/features/projects/ShareModal.jsx'
import { deleteProject } from '@/features/projects/projectsService.js'
import { formatDate, statusOf } from '@/features/projects/status.js'

const TABS = [
  { id: 'description', label: 'tabs.description', icon: Lightbulb },
  { id: 'analysis', label: 'tabs.analysis', icon: BrainCircuit },
  { id: 'diagrams', label: 'tabs.diagrams', icon: Network },
  { id: 'database', label: 'tabs.database', icon: Database },
  { id: 'report', label: 'tabs.report', icon: FileText },
]

// مساحة عمل المشروع (T3.5). shared: عرض للقراءة فقط عبر رابط المشاركة
export default function ProjectWorkspace({ shared = false }) {
  const { t } = useTranslation('projects')
  const { projectId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { project, loading, error } = useProject(projectId)
  const [tab, setTab] = useState('description')
  const [shareOpen, setShareOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (loading)
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-12" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )

  if (error || !project)
    return (
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">{t('workspace.cantOpen')}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {error?.code === 'permission-denied'
            ? t('workspace.noPermission')
            : t('workspace.notFound')}
        </p>
        <Button as={Link} to="/dashboard" className="mt-5">
          {t('workspace.backToProjects')}
        </Button>
      </Card>
    )

  const readOnly = shared || project.ownerId !== user?.uid
  const st = statusOf(project.status)

  async function onDelete() {
    setDeleting(true)
    try {
      await deleteProject(project.id)
      toast.success(t('workspace.deleted'))
      navigate('/dashboard', { replace: true })
    } catch {
      toast.error(t('workspace.deleteFailed'))
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      {!readOnly && (
        <Link
          to="/dashboard"
          className="no-print mb-3 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-ink dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowRight className="size-4 ltr:rotate-180" />
          {t('workspace.myProjects')}
        </Link>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">{project.title}</h1>
            <Badge tone={st.tone}>{t(st.label)}</Badge>
            {readOnly && (
              <Badge tone="navy">
                <Eye className="size-3.5" />
                {t('workspace.readOnly')}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {t('lastEdited', { date: formatDate(project.updatedAt) })}
          </p>
        </div>
        {!readOnly && (
          <div className="no-print flex gap-2">
            <Button variant="secondary" onClick={() => setShareOpen(true)}>
              <Share2 className="size-4" />
              {t('workspace.share')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmDelete(true)}
              aria-label={t('workspace.delete')}
              title={t('workspace.delete')}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 className="size-5" />
            </Button>
          </div>
        )}
      </div>

      <Tabs
        items={TABS.map((x) => ({ ...x, label: t(x.label) }))}
        value={tab}
        onChange={setTab}
        className="no-print mt-6"
      />

      <div className="mt-6" role="tabpanel">
        {tab === 'description' && (
          <Card className="flex flex-col gap-5">
            <DescriptionEditor key={project.id} project={project} readOnly={readOnly} />
            {!readOnly && <AnalyzeButton project={project} onDone={() => setTab('analysis')} />}
          </Card>
        )}
        {tab === 'analysis' && <AnalysisPanel project={project} readOnly={readOnly} />}
        {tab === 'diagrams' && <DiagramsPanel project={project} readOnly={readOnly} />}
        {tab === 'database' && <DatabasePanel project={project} readOnly={readOnly} />}
        {tab === 'report' && (
          <Card className="py-12 text-center text-slate-500">
            {project.currentAnalysisId
              ? t('workspace.underConstruction')
              : t('workspace.analyzeFirst')}
          </Card>
        )}
      </div>

      {!readOnly && (
        <>
          <ShareModal project={project} open={shareOpen} onClose={() => setShareOpen(false)} />
          <Modal
            open={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            title={t('workspace.delete')}
            footer={
              <>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  {t('cancel')}
                </Button>
                <Button variant="danger" onClick={onDelete} loading={deleting}>
                  {t('workspace.deleteForever')}
                </Button>
              </>
            }
          >
            <p className="leading-relaxed">
              {t('workspace.deleteConfirm', { title: project.title })}
            </p>
          </Modal>
        </>
      )}
    </div>
  )
}
