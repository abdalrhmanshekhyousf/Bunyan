import { use } from 'react'
import { AuthContext } from '@/features/auth/authContext.js'

export function useAuth() {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth يجب أن يُستعمل داخل AuthProvider')
  return ctx
}
