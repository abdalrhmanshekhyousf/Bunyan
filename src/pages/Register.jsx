import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/ui/index.js'
import AuthLayout, { OrDivider } from '@/features/auth/AuthLayout.jsx'
import GoogleButton from '@/features/auth/GoogleButton.jsx'
import { registerSchema } from '@/features/auth/schemas.js'
import { register as registerUser } from '@/features/auth/authService.js'
import { authErrorMessage } from '@/features/auth/authErrors.js'

export default function Register() {
  const { t } = useTranslation('auth')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) })
  const err = (e) => (e?.message ? t(e.message) : undefined)

  const onSubmit = async (values) => {
    try {
      await registerUser(values)
      toast.success(t('register.success'))
    } catch (e) {
      toast.error(authErrorMessage(e))
    }
  }

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <>
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-navy hover:underline dark:text-teal">
            {t('register.login')}
          </Link>
        </>
      }
    >
      <GoogleButton />
      <OrDivider />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label={t('fields.name')}
          autoComplete="name"
          error={err(errors.name)}
          {...register('name')}
        />
        <Input
          label={t('fields.email')}
          type="email"
          dir="ltr"
          autoComplete="email"
          error={err(errors.email)}
          {...register('email')}
        />
        <Input
          label={t('fields.password')}
          type="password"
          dir="ltr"
          autoComplete="new-password"
          error={err(errors.password)}
          {...register('password')}
        />
        <Input
          label={t('fields.confirm')}
          type="password"
          dir="ltr"
          autoComplete="new-password"
          error={err(errors.confirm)}
          {...register('confirm')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          {t('register.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
