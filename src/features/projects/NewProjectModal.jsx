import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpen, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button, Input, Modal, Textarea } from '@/components/ui/index.js'
import { fieldClass, Field } from '@/components/ui/Input.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { createProject, MAX_DESCRIPTION } from './projectsService.js'
import { librarySamples } from './sampleProject.js'
import { watchPublishedTemplates } from '@/features/admin/adminService.js'

const schema = z.object({
  title: z.string().trim().min(3, 'newProjectForm.titleMin').max(120, 'newProjectForm.titleMax'),
  language: z.enum(['ar', 'en']),
  description: z.string().max(MAX_DESCRIPTION, 'newProjectForm.descriptionMax'),
})

// نافذة «مشروع جديد» (T3.4) مع زر «جرّب مثال المكتبة» (T3.9)
// والقوالب التي نشرها المدير بلغة المخرجات المختارة (T8.4)
export default function NewProjectModal({ open, onClose }) {
  const { t, i18n } = useTranslation('projects')
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', language: i18n.language === 'en' ? 'en' : 'ar', description: '' },
  })
  const length = useWatch({ control, name: 'description' })?.length ?? 0
  const language = useWatch({ control, name: 'language' })
  const err = (e) => (e?.message ? t(e.message, { max: MAX_DESCRIPTION }) : undefined)
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    if (!open) return
    // القوالب إضافة اختيارية: إن تعذّر تحميلها يبقى مثال المكتبة
    return watchPublishedTemplates(setTemplates, () => setTemplates([]))
  }, [open])
  const shown = templates.filter((tpl) => tpl.language === language)

  function fillTemplate(tpl) {
    setValue('title', tpl.title, { shouldValidate: true })
    setValue('description', tpl.description, { shouldValidate: true })
  }

  function close() {
    reset()
    onClose()
  }

  function fillSample() {
    // المثال بلغة المخرجات المختارة
    const sample = librarySamples[language] ?? librarySamples.ar
    setValue('title', sample.title, { shouldValidate: true })
    setValue('description', sample.description, { shouldValidate: true })
  }

  const onSubmit = async (values) => {
    try {
      const id = await createProject(user.uid, values)
      toast.success(t('newProjectForm.created'))
      close()
      navigate(`/projects/${id}`)
    } catch {
      toast.error(t('newProjectForm.createFailed'))
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('newProject')}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="new-project" loading={isSubmitting}>
            {t('newProjectForm.submit')}
          </Button>
        </>
      }
    >
      <form
        id="new-project"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        {shown.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {t('newProjectForm.templates')}
            </span>
            {shown.map((tpl) => (
              <Button key={tpl.id} variant="secondary" size="sm" onClick={() => fillTemplate(tpl)}>
                <FileText className="size-4" />
                {tpl.title}
              </Button>
            ))}
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={fillSample} className="self-start">
            <BookOpen className="size-4" />
            {t('newProjectForm.trySample')}
          </Button>
        )}
        <Input
          label={t('newProjectForm.title')}
          placeholder={t('newProjectForm.titlePlaceholder')}
          error={err(errors.title)}
          {...register('title')}
        />
        <Field
          label={t('newProjectForm.language')}
          hint={t('newProjectForm.languageHint')}
          id="np-lang"
        >
          <select id="np-lang" className={`${fieldClass} h-10`} {...register('language')}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Textarea
          label={t('description.label')}
          rows={8}
          placeholder={t('description.placeholder')}
          error={err(errors.description)}
          hint={t('newProjectForm.descriptionHint', { length, max: MAX_DESCRIPTION })}
          {...register('description')}
        />
      </form>
    </Modal>
  )
}
