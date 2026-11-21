import { createBrowserRouter } from 'react-router'
import AppLayout from '@/components/layout/AppLayout.jsx'
import Landing from '@/pages/Landing.jsx'
import NotFound from '@/pages/NotFound.jsx'
import Placeholder from '@/pages/Placeholder.jsx'

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Placeholder title="تسجيل الدخول" /> },
  { path: '/register', element: <Placeholder title="إنشاء حساب" /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <Placeholder title="مشاريعي" /> },
      { path: '/projects/:projectId', element: <Placeholder title="مساحة عمل المشروع" /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
