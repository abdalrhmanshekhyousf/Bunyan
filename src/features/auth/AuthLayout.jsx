import { Link } from 'react-router'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import Logo from '@/components/ui/Logo.jsx'
import Card from '@/components/ui/Card.jsx'
import ThemeToggle from '@/components/layout/ThemeToggle.jsx'
import LanguageToggle from '@/components/layout/LanguageToggle.jsx'

export default function AuthLayout({ title, subtitle, children, footer }) {
  const { t } = useTranslation()
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="absolute end-3 top-3 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-xl rounded-full bg-teal/15 blur-3xl" />
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Link to="/" className="mb-6 flex justify-center" aria-label={t('nav.home')}>
          <Logo />
        </Link>
        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-slate-600 dark:text-slate-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </Card>
        {footer && <p className="mt-5 text-center text-slate-600 dark:text-slate-400">{footer}</p>}
      </motion.div>
    </main>
  )
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
      />
    </svg>
  )
}

export function OrDivider() {
  const { t } = useTranslation('auth')
  return (
    <div className="my-5 flex items-center gap-3 text-sm text-slate-500">
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      {t('or')}
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  )
}
