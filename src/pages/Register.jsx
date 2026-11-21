import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button, Input } from '@/components/ui/index.js'
import AuthLayout, { OrDivider } from '@/features/auth/AuthLayout.jsx'
import GoogleButton from '@/features/auth/GoogleButton.jsx'
import { registerSchema } from '@/features/auth/schemas.js'
import { register as registerUser } from '@/features/auth/authService.js'
import { authErrorMessage } from '@/features/auth/authErrors.js'

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values) => {
    try {
      await registerUser(values)
      toast.success('أُنشئ حسابك بنجاح. أهلاً بك!')
    } catch (e) {
      toast.error(authErrorMessage(e))
    }
  }

  return (
    <AuthLayout
      title="إنشاء حساب"
      subtitle="ابدأ تحويل أفكارك إلى أنظمة متكاملة."
      footer={
        <>
          لديك حساب؟{' '}
          <Link to="/login" className="font-semibold text-navy hover:underline dark:text-teal">
            سجّل الدخول
          </Link>
        </>
      }
    >
      <GoogleButton />
      <OrDivider />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="الاسم"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="تأكيد كلمة المرور"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          إنشاء الحساب
        </Button>
      </form>
    </AuthLayout>
  )
}
