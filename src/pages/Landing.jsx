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
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth.js'
import Navbar from '@/components/layout/Navbar.jsx'
import { Badge, Button, Card } from '@/components/ui/index.js'
import { LogoMark } from '@/components/ui/Logo.jsx'
import { librarySamples } from '@/features/projects/sampleProject.js'

const YEAR = new Date().getFullYear()

// النصوص في locales/*/landing.json
const steps = [
  { icon: Lightbulb, key: 'describe' },
  { icon: BrainCircuit, key: 'analyze' },
  { icon: Network, key: 'diagrams' },
  { icon: Database, key: 'database' },
  { icon: FileText, key: 'report' },
]

const features = [
  { icon: Sparkles, key: 'editable' },
  { icon: Share2, key: 'share' },
  { icon: ShieldCheck, key: 'secure' },
]

const sampleGroups = ['actors', 'entities', 'rules']

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
}

export default function Landing() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation('landing')
  const start = user ? '/dashboard' : '/register'
  return (
    <div className="min-h-screen">
      <Navbar>
        {user ? (
          <Button as={Link} to="/dashboard" size="sm">
            {t('nav.projects')}
          </Button>
        ) : (
          <>
            <Button as={Link} to="/login" variant="ghost" size="sm">
              {t('nav.login')}
            </Button>
            <span className="hidden sm:contents">
              <Button as={Link} to="/register" size="sm">
                {t('nav.signup')}
              </Button>
            </span>
          </>
        )}
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
            {t('hero.titleStart')}{' '}
            <span className="text-navy dark:text-teal">{t('hero.titleHighlight')}</span>
          </motion.h1>
          <motion.p
            className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-slate-600 dark:text-slate-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button as={Link} to={start} size="lg">
              {t('hero.cta')}
              <ArrowLeft className="size-5 ltr:rotate-180" />
            </Button>
            <Button as="a" href="#example" variant="secondary" size="lg">
              {t('hero.example')}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* المراحل الخمس */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2 {...fadeUp} className="text-center text-3xl font-bold">
            {t('steps.title')}
          </motion.h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map(({ icon: Icon, key }, i) => (
              <motion.li key={key} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.08 }}>
                <Card className="h-full">
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-white dark:bg-teal/15 dark:text-teal">
                      <Icon className="size-6" />
                    </span>
                    <span className="text-3xl font-bold text-slate-200 dark:text-slate-800">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{t(`steps.${key}.title`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {t(`steps.${key}.text`)}
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
            <Badge tone="teal">{t('example.badge')}</Badge>
            <h2 className="mt-3 text-3xl font-bold">
              {(librarySamples[i18n.language] ?? librarySamples.ar).title}
            </h2>
            <Card className="mt-5 bg-slate-50 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-500">
                {t('example.descriptionLabel')}
              </p>
              <p className="mt-2 leading-loose whitespace-pre-line">
                {(librarySamples[i18n.language] ?? librarySamples.ar).description}
              </p>
            </Card>
          </motion.div>
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="h-full border-navy/20 dark:border-teal/20">
              <p className="flex items-center gap-2 font-semibold text-navy dark:text-teal">
                <BrainCircuit className="size-5" />
                {t('example.extracted')}
              </p>
              <dl className="mt-4 flex flex-col gap-5">
                {sampleGroups.map((group) => (
                  <div key={group}>
                    <dt className="text-sm font-semibold text-slate-500">
                      {t(`example.groups.${group}.label`)}
                    </dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {t(`example.groups.${group}.items`, { returnObjects: true }).map((x) => (
                        <Badge key={x} tone="navy" className="px-3 py-1 text-sm">
                          {x}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm text-slate-500">{t('example.then')}</p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* المميزات */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, key }, i) => (
            <motion.div key={key} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.08 }}>
              <Card className="h-full">
                <Icon className="size-7 text-teal" />
                <h3 className="mt-3 text-lg font-bold">{t(`features.${key}.title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t(`features.${key}.text`)}
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
          <h2 className="text-3xl font-bold">{t('cta.title')}</h2>
          <p className="text-indigo-100">{t('cta.text')}</p>
          <Button as={Link} to={start} variant="accent" size="lg">
            {t('cta.button')}
            <ArrowLeft className="size-5 ltr:rotate-180" />
          </Button>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800">
        {t('footer', { year: YEAR })}
      </footer>
    </div>
  )
}
