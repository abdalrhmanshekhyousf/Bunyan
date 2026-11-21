import { MotionConfig } from 'motion/react'
import { Toaster } from 'sonner'

// المزوّدات العامة. AuthProvider يُضاف في المرحلة 2
export default function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster position="top-center" dir="rtl" richColors closeButton />
    </MotionConfig>
  )
}
