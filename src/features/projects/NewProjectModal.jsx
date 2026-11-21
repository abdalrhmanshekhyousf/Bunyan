import { useNavigate } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input, Modal, Textarea } from '@/components/ui/index.js'
import { fieldClass, Field } from '@/components/ui/Input.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { createProject, MAX_DESCRIPTION } from './projectsService.js'
import { librarySample } from './sampleProject.js'

const schema = z.object({
  title: z.string().trim().min(3, 'العنوان 3 أحرف على الأقل').max(120, 'العنوان طويل جداً'),
  language: z.enum(['ar', 'en']),
  description: z.string().max(MAX_DESCRIPTION, `الوصف ${MAX_DESCRIPTION} حرف كحدّ أقصى`),
})

// نافذة «مشروع جديد» (T3.4) مع زر «جرّب مثال المكتبة» (T3.9)
export default function NewProjectModal({ open, onClose }) {
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
    defaultValues: { title: '', language: 'ar', description: '' },
  })
  const length = useWatch({ control, name: 'description' })?.length ?? 0

  function close() {
    reset()
    onClose()
  }

  function fillSample() {
    setValue('title', librarySample.title, { shouldValidate: true })
    setValue('description', librarySample.description, { shouldValidate: true })
    setValue('language', 'ar')
  }

  const onSubmit = async (values) => {
    try {
      const id = await createProject(user.uid, values)
      toast.success('أُنشئ المشروع.')
      close()
      navigate(`/projects/${id}`)
    } catch {
      toast.error('تعذّر إنشاء المشروع. أعد المحاولة.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="مشروع جديد"
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            إلغاء
          </Button>
          <Button type="submit" form="new-project" loading={isSubmitting}>
            إنشاء المشروع
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
        <Button variant="secondary" size="sm" onClick={fillSample} className="self-start">
          <BookOpen className="size-4" />
          جرّب مثال المكتبة
        </Button>
        <Input
          label="عنوان المشروع"
          placeholder="مثال: نظام حجز مواعيد عيادة"
          error={errors.title?.message}
          {...register('title')}
        />
        <Field label="لغة المخرجات" id="np-lang">
          <select id="np-lang" className={`${fieldClass} h-10`} {...register('language')}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Textarea
          label="وصف النظام"
          rows={8}
          placeholder="صِف النظام: من يستخدمه؟ ماذا يفعل كل مستخدم؟ ما البيانات التي تُحفظ؟ ما القواعد والقيود؟"
          error={errors.description?.message}
          hint={`${length} / ${MAX_DESCRIPTION} حرف. يمكنك كتابته لاحقاً.`}
          {...register('description')}
        />
      </form>
    </Modal>
  )
}
