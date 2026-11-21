import { Link } from 'react-router'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  BrainCircuit,
  Database,
  FileText,
  Lightbulb,
  Network,
  Share2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar.jsx'
import { Badge, Button, Card } from '@/components/ui/index.js'
import { LogoMark } from '@/components/ui/Logo.jsx'
import { librarySample } from '@/features/projects/sampleProject.js'

const YEAR = new Date().getFullYear()

const steps = [
  { icon: Lightbulb, title: 'الوصف', text: 'اكتب فكرة نظامك بلغتك كما تشرحها لزميل.' },
  {
    icon: BrainCircuit,
    title: 'التحليل',
    text: 'يستخرج الذكاء الاصطناعي المتطلبات والفاعلين والكيانات والقواعد.',
  },
  {
    icon: Network,
    title: 'المخططات',
    text: 'خمسة مخططات UML جاهزة: الاستخدام والأصناف والتتابع والنشاط وER.',
  },
  {
    icon: Database,
    title: 'قاعدة البيانات',
    text: 'جداول ومفاتيح وكود SQL جاهز للنسخ إلى MySQL أو PostgreSQL أو SQLite.',
  },
  { icon: FileText, title: 'التقرير', text: 'تقرير عربي مرتّب يُصدَّر PDF بكل المخططات.' },
]

const features = [
  {
    icon: Sparkles,
    title: 'تحليل قابل للتعديل',
    text: 'كل عنصر في النتيجة تستطيع تعديله أو حذفه أو إضافة غيره.',
  },
  {
    icon: Share2,
    title: 'مشاركة بنقرة',
    text: 'شارك مشروعك برابط للقراءة فقط مع المشرف أو الفريق.',
  },
  { icon: ShieldCheck, title: 'آمن وخاص', text: 'مشاريعك لك وحدك، ولا يقرؤها أحد دون إذنك.' },
]

const sampleResults = [
  ['الفاعلون', ['الطالب', 'أمين المكتبة', 'مدير المكتبة']],
  [
    'الكيانات',
    [
      'Student · طالب',
      'Book · كتاب',
      'Author · مؤلف',
      'Loan · استعارة',
      'Reservation · حجز',
      'Fine · غرامة',
    ],
  ],
  [
    'قواعد العمل',
    ['3 كتب كحدّ أقصى للطالب', 'مدة الاستعارة 14 يوماً', 'غرامة 500 ليرة عن كل يوم تأخير'],
  ],
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar>
        <Button as={Link} to="/login" variant="ghost" size="sm">
          تسجيل الدخول
        </Button>
        <span className="hidden sm:contents">
          <Button as={Link} to="/register" size="sm">
            ابدأ مجاناً
          </Button>
        </span>
      </Navbar>

      {/* العنوان */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
        <div className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-96 max-w-3xl rounded-full bg-teal/20 blur-3xl dark:bg-teal/10" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LogoMark className="size-20 sm:size-24" />
          </motion.div>
          <motion.h1
            className="mt-6 text-4xl leading-tight font-bold text-balance sm:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            من الفكرة إلى <span className="text-navy dark:text-teal">نظام متكامل</span>
          </motion.h1>
          <motion.p
            className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-slate-600 dark:text-slate-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            صِف نظامك بالعربية، ويحوّله بُنيان إلى متطلبات ومخططات UML وقاعدة بيانات وتقرير جاهز
            للتسليم، في دقائق بدل أيام.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button as={Link} to="/register" size="lg">
              ابدأ مشروعك الأول
              <ArrowLeft className="size-5" />
            </Button>
            <Button as="a" href="#example" variant="secondary" size="lg">
              شاهد مثالاً
            </Button>
          </motion.div>
        </div>
      </section>

      {/* المراحل الخمس */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2 {...fadeUp} className="text-center text-3xl font-bold">
            خمس مراحل، خطوة واحدة منك
          </motion.h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <motion.li key={title} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.08 }}>
                <Card className="h-full">
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-white dark:bg-teal/15 dark:text-teal">
                      <Icon className="size-6" />
                    </span>
                    <span className="text-3xl font-bold text-slate-200 dark:text-slate-800">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {text}
                  </p>
                </Card>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* مثال المكتبة */}
      <section id="example" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <Badge tone="teal">مثال</Badge>
            <h2 className="mt-3 text-3xl font-bold">{librarySample.title}</h2>
            <Card className="mt-5 bg-slate-50 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-500">الوصف الذي كتبه الطالب:</p>
              <p className="mt-2 leading-loose whitespace-pre-line">{librarySample.description}</p>
            </Card>
          </motion.div>
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="h-full border-navy/20 dark:border-teal/20">
              <p className="flex items-center gap-2 font-semibold text-navy dark:text-teal">
                <BrainCircuit className="size-5" />
                ما استخرجه بُنيان:
              </p>
              <dl className="mt-4 flex flex-col gap-5">
                {sampleResults.map(([label, items]) => (
                  <div key={label}>
                    <dt className="text-sm font-semibold text-slate-500">{label}</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {items.map((x) => (
                        <Badge key={x} tone="navy" className="px-3 py-1 text-sm">
                          {x}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm text-slate-500">
                ثم تُبنى منها خمسة مخططات، وستة جداول مع مفاتيحها، وتقرير كامل.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* المميزات */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }, i) => (
            <motion.div key={title} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.08 }}>
              <Card className="h-full">
                <Icon className="size-7 text-teal" />
                <h3 className="mt-3 text-lg font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {text}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* دعوة أخيرة */}
      <section className="px-4 pt-8 pb-20 sm:px-6">
        <motion.div
          {...fadeUp}
          className="mx-auto flex max-w-4xl flex-col items-center gap-5 rounded-3xl bg-navy px-6 py-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold">هل أنت مستعد لبناء مشروعك؟</h2>
          <p className="text-indigo-100">أنشئ حساباً مجانياً وابدأ أول تحليل الآن.</p>
          <Button as={Link} to="/register" variant="accent" size="lg">
            ابدأ مجاناً
            <ArrowLeft className="size-5" />
          </Button>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800">
        بُنيان © {YEAR}
      </footer>
    </div>
  )
}
