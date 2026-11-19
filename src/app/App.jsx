import Logo, { AppIcon } from '@/components/ui/Logo.jsx'

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 p-6 text-ink">
      <Logo size="lg" />
      <p className="text-lg text-slate-600">من الفكرة إلى نظام متكامل</p>
      <div className="flex items-end gap-4">
        <AppIcon className="size-24" />
        <AppIcon className="size-14" />
        <AppIcon className="size-9" />
      </div>
    </main>
  )
}
