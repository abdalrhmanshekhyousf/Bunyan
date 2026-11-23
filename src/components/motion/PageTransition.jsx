import { useState } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'

// يثبّت محتوى الصفحة الخارجة حتى ينتهي خروجها، وإلا ظهرت الصفحة الجديدة داخلها
function FrozenOutlet() {
  const outlet = useOutlet()
  const [frozen] = useState(outlet)
  return frozen
}

// انتقال بين الصفحات (T9.2): تلاشٍ قصير مع انزلاق خفيف عند تغيّر المسار
export default function PageTransition() {
  const { pathname } = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <FrozenOutlet />
      </motion.div>
    </AnimatePresence>
  )
}
