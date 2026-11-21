import { Link } from 'react-router'
import { Menu } from 'lucide-react'
import Logo from '@/components/ui/Logo.jsx'
import Button from '@/components/ui/Button.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import LanguageToggle from './LanguageToggle.jsx'

// الشريط العلوي. onMenu: يفتح القائمة الجانبية على الجوال (داخل AppLayout فقط)
export default function Navbar({ onMenu, children }) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-ink/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {onMenu && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenu}
            aria-label="فتح القائمة"
          >
            <Menu className="size-5" />
          </Button>
        )}
        <Link to="/" aria-label="الصفحة الرئيسية" className="rounded-lg">
          <Logo size="sm" />
        </Link>
        <div className="ms-auto flex items-center gap-2">
          {children}
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
