import { motion } from 'motion/react'
import { NAME } from '@/components/ui/Logo.jsx'

// شعار Data Analytics يُبنى من الأساس إلى الأعلى (T9.3):
// الأساس يمتد، ثم تنمو الأعمدة الثلاثة، ثم يُرسم خط الاتجاه وتظهر عُقده.
// يطابق رسم LogoMark في components/ui/Logo.jsx
const BARS = [
  [6, 36, 18],
  [26, 26, 28],
  [46, 16, 38],
]
const NODES = [
  [12, 26],
  [32, 16],
  [52, 6],
]

export default function AnimatedLogoMark({ className = 'size-20', title = NAME }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <motion.rect
        x="4"
        y="57"
        width="56"
        height="3.5"
        rx="1.75"
        className="fill-navy dark:fill-white"
        style={{ originX: 0.5 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      {BARS.map(([x, y, h], i) => (
        <motion.rect
          key={x}
          x={x}
          y={y}
          width="12"
          height={h}
          rx="3"
          className="fill-navy dark:fill-white"
          style={{ originY: 1 }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.35 + i * 0.15, type: 'spring', stiffness: 220, damping: 20 }}
        />
      ))}
      <motion.path
        d="M12 26 32 16 52 6"
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-teal"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5, ease: 'easeInOut' }}
      />
      {NODES.map(([cx, cy], i) => (
        <motion.circle
          key={cx}
          cx={cx}
          cy={cy}
          r="4.5"
          className="fill-teal"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.95 + i * 0.17, type: 'spring', stiffness: 320, damping: 16 }}
        />
      ))}
    </svg>
  )
}
