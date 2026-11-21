import { NavLink } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { FolderKanban, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn.js'

const links = [{ to: '/dashboard', label: 'nav.projects', icon: FolderKanban }]

function NavItems({ onNavigate }) {
  const { t } = useTranslation()
  return (
    <nav className="flex flex-col gap-1 p-3">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition-colors',
              isActive
                ? 'bg-navy text-white dark:bg-teal/15 dark:text-teal'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
            )
          }
        >
          <Icon className="size-5" />
          {t(label)}
        </NavLink>
      ))}
    </nav>
  )
}

// قائمة ثابتة على الشاشات الكبيرة، ودرج منزلق من جهة البداية على الجوال
export default function Sidebar({ open, onClose }) {
  const { t, i18n } = useTranslation()
  // جهة البداية: اليمين في العربية، واليسار في الإنجليزية
  const offscreen = i18n.dir() === 'rtl' ? '100%' : '-100%'
  return (
    <>
      <aside className="no-print hidden w-60 shrink-0 border-e border-slate-200 lg:block dark:border-slate-800">
        <div className="sticky top-16">
          <NavItems />
        </div>
      </aside>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-ink/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="absolute inset-y-0 start-0 w-72 bg-white shadow-xl dark:bg-slate-900"
              initial={{ x: offscreen }}
              animate={{ x: 0 }}
              exit={{ x: offscreen }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              <div className="flex justify-end p-3">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t('nav.closeMenu')}
                  className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="size-5" />
                </button>
              </div>
              <NavItems onNavigate={onClose} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
