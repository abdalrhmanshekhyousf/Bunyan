import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth.js'
import Spinner from '@/components/ui/Spinner.jsx'

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-navy dark:text-teal">
      <Spinner className="size-8" />
    </div>
  )
}

// يمنع غير المسجّلين، ويعيدهم بعد الدخول إلى الصفحة التي طلبوها (T2.9)
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export function AdminRoute() {
  const { isAdmin, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

// صفحات الدخول والتسجيل: من سجّل دخوله يذهب إلى لوحته مباشرة
export function GuestRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageSpinner />
  if (user) return <Navigate to={location.state?.from?.pathname ?? '/dashboard'} replace />
  return <Outlet />
}
