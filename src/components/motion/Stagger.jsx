import { motion } from 'motion/react'

// قائمة يظهر عناصرها واحداً بعد الآخر (T9.1). العناصر تُلفّ بـ StaggerItem
const container = (gap, delay) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
})

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export function Stagger({ as = 'div', gap = 0.05, delay = 0, inView = false, children, ...props }) {
  const Comp = motion[as] ?? motion.div
  return (
    <Comp
      variants={container(gap, delay)}
      initial="hidden"
      {...(inView
        ? { whileInView: 'show', viewport: { once: true, margin: '-60px' } }
        : { animate: 'show' })}
      {...props}
    >
      {children}
    </Comp>
  )
}

export function StaggerItem({ as = 'div', children, ...props }) {
  const Comp = motion[as] ?? motion.div
  return (
    <Comp variants={item} {...props}>
      {children}
    </Comp>
  )
}
