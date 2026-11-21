import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/ui/index.js'
import AuthLayout, { OrDivider } from '@/features/auth/AuthLayout.jsx'
import GoogleButton from '@/features/auth/GoogleButton.jsx'
import { loginSchema } from '@/features/auth/schemas.js'
import { login } from '@/features/auth/authService.js'
import { authErrorMessage } from '@/features/auth/authErrors.js'

// بعد نجاح الدخول ينقل GuestRoute المستخدم تلقائياً إلى وجهته
export default function Login() {
  const { t } = useTranslation('auth')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })
  // رسائل التحقق مفاتيح ترجمة
  const err = (e) => (e?.message ? t(e.message) : undefined)

  const onSubmit = async (values) => {
    try {
      await login(values)
    } catch (e) {
      toast.error(authErrorMessage(e))
    }
  }

  return (
    <AuthLayout
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-navy hover:underline dark:text-teal">
            {t('login.createAccount')}
          </Link>
        </>
      }
    >
      <GoogleButton />
      <OrDivider />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
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
          autoComplete="current-password"
          error={err(errors.password)}
          {...register('password')}
        />
        <Link
          to="/forgot-password"
          className="-mt-1 self-start text-sm text-slate-600 hover:underline dark:text-slate-400"
        >
          {t('login.forgot')}
        </Link>
        <Button type="submit" loading={isSubmitting} className="w-full">
          {t('login.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
