import { useEffect, useMemo, useState } from 'react'
import { Ban, Search, ShieldCheck, ShieldOff, Trash2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, Modal, Skeleton } from '@/components/ui/index.js'
import { fieldClass } from '@/components/ui/Input.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { formatDate } from '@/features/projects/status.js'
import { deleteUserData, setUserBanned, setUserRole, watchUsers } from './adminService.js'

// جدول المستخدمين مع البحث وتغيير الدور (T8.2)، وحظر المستخدم وحذفه
export default function UsersTable() {
  const { t } = useTranslation('admin')
  const { user: me } = useAuth()
  const [state, setState] = useState({ users: [], loading: true, error: null })
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(null)
  const [toDelete, setToDelete] = useState(null)

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

  async function toggleBan(u) {
    const name = u.displayName || u.email
    const banned = !u.banned
    if (banned && !confirm(t('users.confirmBan', { name }))) return
    setBusy(u.id)
    try {
      await setUserBanned(u.id, banned)
      toast.success(t(banned ? 'users.banned' : 'users.unbanned', { name }))
    } catch (e) {
      console.error('setUserBanned:', e.code, e.message)
      toast.error(t('users.actionFailed'))
    } finally {
      setBusy(null)
    }
  }

  async function onDelete() {
    const u = toDelete
    const name = u.displayName || u.email
    setToDelete(null)
    setBusy(u.id)
    try {
      const count = await deleteUserData(u.id, { banned: !!u.banned })
      toast.success(t('users.deletedDone', { name, count }))
    } catch (e) {
      console.error('deleteUserData:', e.code, e.message)
      toast.error(t('users.deleteFailed'))
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
          <table className="w-full min-w-[52rem] text-sm">
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
                  <tr key={u.id} className={u.deleted ? 'opacity-60' : undefined}>
                    <td className="px-4 py-3 font-semibold">
                      {u.displayName || (
                        <span className="font-normal text-slate-400">
                          {t(u.deleted ? 'users.deletedName' : 'users.noName')}
                        </span>
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
                      {u.deleted ? (
                        <Badge tone="red">{t('users.statusDeleted')}</Badge>
                      ) : u.banned ? (
                        <Badge tone="amber">{t('users.statusBanned')}</Badge>
                      ) : (
                        <Badge tone={isAdmin ? 'teal' : 'slate'}>
                          {t(isAdmin ? 'users.roleAdmin' : 'users.roleUser')}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {!isMe && !u.deleted && (
                        <div className="flex flex-wrap justify-end gap-1">
                          {!u.banned && (
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
                          {/* المدير لا يُحظر ولا يُحذف؛ يُعاد مستخدماً أولاً */}
                          {!isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={busy === u.id}
                                onClick={() => toggleBan(u)}
                              >
                                {u.banned ? (
                                  <UserCheck className="size-4" />
                                ) : (
                                  <Ban className="size-4" />
                                )}
                                {t(u.banned ? 'users.unban' : 'users.ban')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={busy === u.id}
                                onClick={() => setToDelete(u)}
                                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                              >
                                <Trash2 className="size-4" />
                                {t('users.delete')}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t('users.deleteTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              {t('users.cancel')}
            </Button>
            <Button variant="danger" onClick={onDelete}>
              <Trash2 className="size-4" />
              {t('users.deleteConfirm')}
            </Button>
          </>
        }
      >
        <p className="leading-relaxed">
          {t('users.deleteBody', { name: toDelete?.displayName || toDelete?.email })}
        </p>
      </Modal>
    </div>
  )
}
