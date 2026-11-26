import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { toast } from 'sonner'
import i18n from '@/lib/i18n.js'
import { auth, db } from '@/lib/firebase.js'
import { ensureUserDoc } from './authService.js'
import { AuthContext } from './authContext.js'

// يتابع حالة الدخول (T2.5) ومستند المستخدم (لمعرفة الدور)
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubProfile = () => {}
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      unsubProfile()
      setUser(u)
      if (!u) {
        setProfile(null)
        setLoading(false)
        return
      }
      // للحسابات القديمة أو التي فشل إنشاء مستندها عند التسجيل
      ensureUserDoc(u).catch(() => {})
      unsubProfile = onSnapshot(
        doc(db, 'users', u.uid),
        (snap) => {
          const data = snap.exists() ? snap.data() : null
          // المحظور أو المحذوف يُسجَّل خروجه فوراً، ولو حُظر وهو داخل التطبيق
          if (data?.banned) {
            toast.error(i18n.t(data.deleted ? 'auth:account.deleted' : 'auth:account.banned'), {
              id: 'account-blocked',
              duration: 10000,
            })
            signOut(auth)
            return
          }
          setProfile(data)
          setLoading(false)
        },
        () => setLoading(false),
      )
    })
    return () => {
      unsubProfile()
      unsubAuth()
    }
  }, [])

  const value = useMemo(
    () => ({ user, profile, loading, isAdmin: profile?.role === 'admin' }),
    [user, profile, loading],
  )
  return <AuthContext value={value}>{children}</AuthContext>
}
