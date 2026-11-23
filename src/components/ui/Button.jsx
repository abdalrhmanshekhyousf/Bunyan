import { Link } from 'react-router'
import { motion } from 'motion/react'
import { cn } from '@/utils/cn.js'
import Spinner from './Spinner.jsx'

const variants = {
  primary: 'bg-navy text-white hover:bg-navy-600 dark:bg-teal dark:text-ink dark:hover:bg-teal-600',
  secondary:
    'bg-white text-ink ring-1 ring-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700',
  accent: 'bg-teal text-ink hover:bg-teal-600 hover:text-white',
  ghost: 'text-slate-700 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}
const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 gap-2',
  lg: 'h-12 px-6 text-lg gap-2',
  icon: 'size-10',
}

// نسخ motion للعناصر التي تُمرَّر في as، تُنشأ مرة واحدة خارج العرض
const MotionLink = motion.create(Link)
const MOTION = { button: motion.button, a: motion.a }

// تفاعل صغير عند الضغط (T9.5)؛ يتعطّل تلقائياً مع تفضيل تقليل الحركة
const tap = { scale: 0.97 }

export default function Button({
  as: Comp = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}) {
  const isButton = Comp === 'button'
  const inactive = disabled || loading
  // عنصر غير معروف (نادر) يُعرض دون حركة
  const Tag = Comp === Link ? MotionLink : (MOTION[Comp] ?? Comp)
  const animated = Tag !== Comp
  return (
    <Tag
      {...(animated && !inactive ? { whileTap: tap } : {})}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...(isButton ? { type: 'button', disabled: disabled || loading } : {})}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </Tag>
  )
}
