import { MotionConfig } from 'motion/react'
import { Toaster } from 'sonner'
import AuthProvider from '@/features/auth/AuthProvider.jsx'

export default function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        {children}
        <Toaster position="top-center" dir="rtl" richColors closeButton />
      </AuthProvider>
    </MotionConfig>
  )
}
