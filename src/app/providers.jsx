import { MotionConfig } from 'motion/react'
import { Toaster } from 'sonner'
import { useTranslation } from 'react-i18next'
import AuthProvider from '@/features/auth/AuthProvider.jsx'

// الإشعارات تتبع اتجاه اللغة الحالية (T9.8)
function Toasts() {
  const { i18n } = useTranslation()
  return <Toaster position="top-center" dir={i18n.dir()} richColors closeButton />
}

export default function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        {children}
        <Toasts />
      </AuthProvider>
    </MotionConfig>
  )
}
