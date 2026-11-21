import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth.js'
import { logout } from '@/features/auth/authService.js'
import Button from '@/components/ui/Button.jsx'

export default function UserMenu() {
  const { user } = useAuth()
  const { t } = useTranslation()
  if (!user) return null
  const name = user.displayName || user.email

  async function onLogout() {
    await logout()
    toast.success(t('user.loggedOut'))
  }

  return (
    <div className="flex items-center gap-2">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          className="size-8 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex size-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white dark:bg-teal dark:text-ink">
          {name?.[0]?.toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-40 truncate text-sm font-semibold md:inline">{name}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onLogout}
        aria-label={t('user.logout')}
        title={t('user.logout')}
      >
        <LogOut className="size-5 rtl:-scale-x-100" />
      </Button>
    </div>
  )
}
