import { useState } from 'react'
import { FileStack, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Tabs } from '@/components/ui/index.js'
import StatsCards from '@/features/admin/StatsCards.jsx'
import UsersTable from '@/features/admin/UsersTable.jsx'
import TemplatesManager from '@/features/admin/TemplatesManager.jsx'

// لوحة المدير (المرحلة 8): إحصاءات، ثم تبويبا المستخدمين والقوالب
export default function AdminDashboard() {
  const { t } = useTranslation('admin')
  const [tab, setTab] = useState('users')

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{t('subtitle')}</p>
      </div>

      <StatsCards />

      <Tabs
        items={[
          { id: 'users', label: t('tabs.users'), icon: Users },
          { id: 'templates', label: t('tabs.templates'), icon: FileStack },
        ]}
        value={tab}
        onChange={setTab}
        className="self-start"
      />

      {tab === 'users' ? <UsersTable /> : <TemplatesManager />}
    </div>
  )
}
