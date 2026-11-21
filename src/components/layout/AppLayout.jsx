import { useState } from 'react'
import { Outlet } from 'react-router'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'

// تخطيط الصفحات الداخلية: شريط علوي + قائمة جانبية + المحتوى
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="min-h-screen">
      <Navbar onMenu={() => setMenuOpen(true)} />
      <div className="flex">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
