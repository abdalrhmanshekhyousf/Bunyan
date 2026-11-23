import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, Skeleton } from '@/components/ui/index.js'
import { fieldClass } from '@/components/ui/Input.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { formatDate } from '@/features/projects/status.js'
import { setUserRole, watchUsers } from './adminService.js'

// جدول المستخدمين مع البحث وتغيير الدور (T8.2)
export default function UsersTable() {
  const { t } = useTranslation('admin')
  const { user: me } = useAuth()
  const [state, setState] = useState({ users: [], loading: true, error: null })
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(null)

  useEffect(
    () =>
      watchUsers(
        (users) => setState({ users, loading: false, error: null }),
        (error) => {
          console.error('watchUsers:', error.code, error.message)
          setState((s) => ({ ...s, loading: false, error }))
        },
      ),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return state.users
    return state.users.filter(
      (u) => u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    )
  }, [state.users, search])

  async function toggleRole(u) {
    const name = u.displayName || u.email
    const role = u.role === 'admin' ? 'user' : 'admin'
    if (role === 'admin' && !confirm(t('users.confirmAdmin', { name }))) return
    setBusy(u.id)
    try {
      await setUserRole(u.id, role)
      toast.success(t('users.roleChanged', { name }))
    } catch {
      toast.error(t('users.roleFailed'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('users.searchPlaceholder')}
            aria-label={t('users.search')}
            className={`${fieldClass} h-10 ps-9`}
          />
        </div>
        {!state.loading && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('users.count', { count: filtered.length })}
          </p>
        )}
      </div>

      {state.error ? (
        <Card className="border-red-200 text-red-700 dark:border-red-900 dark:text-red-300">
          {t('users.loadFailed')}
        </Card>
      ) : state.loading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-slate-500">{t('users.noMatches')}</p>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-slate-50 text-start text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{t('users.name')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('users.email')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('users.role')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('users.joined')}</th>
                <th className="px-4 py-3 text-end font-semibold">{t('users.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((u) => {
                const isMe = u.id === me?.uid
                const isAdmin = u.role === 'admin'
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-semibold">
                      {u.displayName || (
                        <span className="font-normal text-slate-400">{t('users.noName')}</span>
                      )}
                      {isMe && (
                        <Badge tone="navy" className="ms-2">
                          {t('users.you')}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400" dir="ltr">
                      <span className="block text-start">{u.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={isAdmin ? 'teal' : 'slate'}>
                        {t(isAdmin ? 'users.roleAdmin' : 'users.roleUser')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      {!isMe && (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={busy === u.id}
                          onClick={() => toggleRole(u)}
                        >
                          {isAdmin ? (
                            <ShieldOff className="size-4" />
                          ) : (
                            <ShieldCheck className="size-4" />
                          )}
                          {t(isAdmin ? 'users.makeUser' : 'users.makeAdmin')}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
