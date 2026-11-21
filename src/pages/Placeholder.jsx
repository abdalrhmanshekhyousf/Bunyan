import Card from '@/components/ui/Card.jsx'

// صفحة مؤقتة لما لم يُبنَ بعد؛ تُستبدل في المراحل التالية
export default function Placeholder({ title }) {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">هذه الصفحة قيد البناء.</p>
    </Card>
  )
}
