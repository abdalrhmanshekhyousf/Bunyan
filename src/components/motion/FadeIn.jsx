import { motion } from 'motion/react'

// ظهور تدريجي مع انزلاق خفيف (T9.1). inView: يبدأ عند ظهور العنصر في الشاشة
export default function FadeIn({
  as = 'div',
  delay = 0,
  y = 16,
  duration = 0.4,
  inView = false,
  children,
  ...props
}) {
  const Comp = motion[as] ?? motion.div
  const target = { opacity: 1, y: 0, transition: { duration, delay } }
  return (
    <Comp
      initial={{ opacity: 0, y }}
      {...(inView
        ? { whileInView: target, viewport: { once: true, margin: '-60px' } }
        : { animate: target })}
      {...props}
    >
      {children}
    </Comp>
  )
}
