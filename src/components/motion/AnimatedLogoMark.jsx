import { motion } from 'motion/react'

// شعار بُنيان يُبنى من الأساس إلى الأعلى (T9.3):
// الأساس يمتد، ثم الكيانان، ثم خط الربط يُرسم، ثم تنزل الفكرة (الصندوق الفيروزي) في القمة.
// يطابق رسم LogoMark في components/ui/Logo.jsx
const drop = (delay, y = -14) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { delay, type: 'spring', stiffness: 260, damping: 18 },
})

export default function AnimatedLogoMark({ className = 'size-20', title = 'بُنيان' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <motion.rect
        x="5"
        y="51"
        width="54"
        height="3.5"
        rx="1.75"
        className="fill-navy dark:fill-white"
        style={{ originX: 0.5 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      <motion.rect
        x="5"
        y="33"
        width="24"
        height="13"
        rx="3.5"
        className="fill-navy dark:fill-white"
        {...drop(0.35)}
      />
      <motion.rect
        x="35"
        y="33"
        width="24"
        height="13"
        rx="3.5"
        className="fill-navy dark:fill-white"
        {...drop(0.5)}
      />
      <motion.path
        d="M17 34v-6h30v6M32 28v-9"
        fill="none"
        strokeWidth="3.5"
        strokeLinejoin="round"
        className="stroke-navy dark:stroke-white"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.45, ease: 'easeInOut' }}
      />
      <motion.rect
        x="21"
        y="6"
        width="22"
        height="13"
        rx="3.5"
        className="fill-teal"
        {...drop(1.15, -22)}
      />
    </svg>
  )
}
