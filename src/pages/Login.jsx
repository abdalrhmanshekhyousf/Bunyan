import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button, Input } from '@/components/ui/index.js'
import AuthLayout, { OrDivider } from '@/features/auth/AuthLayout.jsx'
import GoogleButton from '@/features/auth/GoogleButton.jsx'
import { loginSchema } from '@/features/auth/schemas.js'
import { login } from '@/features/auth/authService.js'
import { authErrorMessage } from '@/features/auth/authErrors.js'

// بعد نجاح الدخول ينقل GuestRoute المستخدم تلقائياً إلى وجهته
export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values) => {
    try {
      await login(values)
    } catch (e) {
      toast.error(authErrorMessage(e))
    }
  }

  return (
    <AuthLayout
      title="تسجيل الدخول"
      subtitle="أهلاً بعودتك إلى بُنيان."
      footer={
        <>
          ليس لديك حساب؟{' '}
          <Link to="/register" className="font-semibold text-navy hover:underline dark:text-teal">
            أنشئ حساباً
          </Link>
        </>
      }
    >
      <GoogleButton />
      <OrDivider />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="البريد الإلكتروني"
          type="email"
          dir="ltr"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="كلمة المرور"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Link
          to="/forgot-password"
          className="-mt-1 self-start text-sm text-slate-600 hover:underline dark:text-slate-400"
        >
          نسيت كلمة المرور؟
        </Link>
        <Button type="submit" loading={isSubmitting} className="w-full">
          دخول
        </Button>
      </form>
    </AuthLayout>
  )
}
