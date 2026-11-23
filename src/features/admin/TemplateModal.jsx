import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button, Input, Modal, Textarea } from '@/components/ui/index.js'
import { Field, fieldClass } from '@/components/ui/Input.jsx'
import { MAX_DESCRIPTION } from '@/features/projects/projectsService.js'
import { createTemplate, saveTemplate } from './adminService.js'

const schema = z.object({
  title: z.string().trim().min(3, 'templates.titleMin').max(120, 'templates.titleMax'),
  language: z.enum(['ar', 'en']),
  description: z
    .string()
    .trim()
    .min(20, 'templates.descriptionMin')
    .max(MAX_DESCRIPTION, 'templates.descriptionMax'),
  published: z.boolean(),
})

const EMPTY = { title: '', language: 'ar', description: '', published: false }

// إضافة قالب أو تعديله (T8.4). template = null لقالب جديد
export default function TemplateModal({ open, template, onClose }) {
  const { t } = useTranslation('admin')
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY })
  const length = useWatch({ control, name: 'description' })?.length ?? 0
  const err = (e) => (e?.message ? t(e.message, { max: MAX_DESCRIPTION }) : undefined)

  useEffect(() => {
    if (open) reset(template ? { ...EMPTY, ...template } : EMPTY)
  }, [open, template, reset])

  const onSubmit = async (values) => {
    try {
      if (template?.id) await saveTemplate(template.id, values)
      else await createTemplate(values)
      toast.success(t('templates.saved'))
      onClose()
    } catch (e) {
      console.error('saveTemplate:', e.code, e.message)
      toast.error(t('templates.saveFailed'))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(template?.id ? 'templates.edit' : 'templates.add')}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('templates.cancel')}
          </Button>
          <Button type="submit" form="template-form" loading={isSubmitting}>
            {t('templates.save')}
          </Button>
        </>
      }
    >
      <form
        id="template-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input label={t('templates.titleLabel')} error={err(errors.title)} {...register('title')} />
        <Field label={t('templates.languageLabel')} id="tpl-lang">
          <select id="tpl-lang" className={`${fieldClass} h-10`} {...register('language')}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Textarea
          label={t('templates.descriptionLabel')}
          rows={9}
          error={err(errors.description)}
          hint={`${length} / ${MAX_DESCRIPTION}`}
          {...register('description')}
        />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="size-4 accent-teal" {...register('published')} />
          {t('templates.publishLabel')}
        </label>
      </form>
    </Modal>
  )
}
