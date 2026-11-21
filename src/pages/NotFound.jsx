import { Link } from 'react-router'
import { LogoMark } from '@/components/ui/Logo.jsx'
import Button from '@/components/ui/Button.jsx'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <LogoMark className="size-20 opacity-60" />
      <p className="text-6xl font-bold text-navy dark:text-teal">404</p>
      <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>
      <p className="text-slate-600 dark:text-slate-400">ربما حُذفت هذه الصفحة أو تغيّر رابطها.</p>
      <Button as={Link} to="/">
        العودة إلى الرئيسية
      </Button>
    </main>
  )
}
