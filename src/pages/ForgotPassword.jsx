import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/ui/index.js'
import AuthLayout from '@/features/auth/AuthLayout.jsx'
import { resetSchema } from '@/features/auth/schemas.js'
import { resetPassword } from '@/features/auth/authService.js'
import { authErrorMessage } from '@/features/auth/authErrors.js'

export default function ForgotPassword() {
  const { t } = useTranslation('auth')
  const [sentTo, setSentTo] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetSchema) })

  const onSubmit = async ({ email }) => {
    try {
      await resetPassword(email)
      setSentTo(email)
    } catch (e) {
      // لا نكشف هل البريد مسجّل أم لا
      if (e?.code === 'auth/user-not-found') setSentTo(email)
      else toast.error(authErrorMessage(e))
    }
  }

  const back = (
    <Link to="/login" className="font-semibold text-navy hover:underline dark:text-teal">
      {t('forgot.back')}
    </Link>
  )

  if (sentTo)
    return (
      <AuthLayout title={t('forgot.checkTitle')} footer={back}>
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="size-12 text-teal" />
          <p className="leading-relaxed">
            <Trans
              t={t}
              i18nKey="forgot.checkBody"
              values={{ email: sentTo }}
              components={{ email: <span dir="ltr" className="font-semibold" /> }}
            />
          </p>
        </div>
      </AuthLayout>
    )

  return (
    <AuthLayout title={t('forgot.title')} subtitle={t('forgot.subtitle')} footer={back}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label={t('fields.email')}
          type="email"
          dir="ltr"
          autoComplete="email"
          error={errors.email?.message ? t(errors.email.message) : undefined}
          {...register('email')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          {t('forgot.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
