import { createBrowserRouter } from 'react-router'
import AppLayout from '@/components/layout/AppLayout.jsx'
import { GuestRoute, ProtectedRoute } from '@/components/layout/ProtectedRoute.jsx'
import Landing from '@/pages/Landing.jsx'
import Login from '@/pages/Login.jsx'
import Register from '@/pages/Register.jsx'
import ForgotPassword from '@/pages/ForgotPassword.jsx'
import NotFound from '@/pages/NotFound.jsx'
import Placeholder from '@/pages/Placeholder.jsx'

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Placeholder title="مشاريعي" /> },
          { path: '/projects/:projectId', element: <Placeholder title="مساحة عمل المشروع" /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])
