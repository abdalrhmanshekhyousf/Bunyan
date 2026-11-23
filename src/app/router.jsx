import { createBrowserRouter } from 'react-router'
import AppLayout from '@/components/layout/AppLayout.jsx'
import {
  AdminRoute,
  FullPageSpinner,
  GuestRoute,
  ProtectedRoute,
} from '@/components/layout/ProtectedRoute.jsx'
import Landing from '@/pages/Landing.jsx'

// التحميل الكسول (T10.6): الصفحة الرئيسية وحدها في الحزمة الأولى، وكل صفحة أخرى
// تُنزَّل عند فتحها أول مرة. الموجّه ينتظر تحميلها قبل الانتقال فتبقى الصفحة السابقة ظاهرة
const page = (load, props) => async () => {
  const { default: Page } = await load()
  return { element: <Page {...props} /> }
}

export const router = createBrowserRouter([
  {
    // يظهر عند فتح رابط صفحة كسولة مباشرة، ريثما تُحمَّل
    hydrateFallbackElement: <FullPageSpinner />,
    children: [
      { path: '/', element: <Landing /> },
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', lazy: page(() => import('@/pages/Login.jsx')) },
          { path: '/register', lazy: page(() => import('@/pages/Register.jsx')) },
          { path: '/forgot-password', lazy: page(() => import('@/pages/ForgotPassword.jsx')) },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/dashboard', lazy: page(() => import('@/pages/Dashboard.jsx')) },
              {
                path: '/projects/:projectId',
                lazy: page(() => import('@/pages/ProjectWorkspace.jsx')),
              },
              {
                path: '/share/:projectId',
                lazy: page(() => import('@/pages/ProjectWorkspace.jsx'), { shared: true }),
              },
              {
                element: <AdminRoute />,
                children: [
                  { path: '/admin', lazy: page(() => import('@/pages/AdminDashboard.jsx')) },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', lazy: page(() => import('@/pages/NotFound.jsx')) },
    ],
  },
])
