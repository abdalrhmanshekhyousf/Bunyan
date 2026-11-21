import { useCallback, useEffect, useState } from 'react'

// الوضع الداكن (T1.4): يُطبَّق على <html> ويُحفظ في localStorage
export function useTheme() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* التخزين غير متاح: نكتفي بالجلسة الحالية */
    }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return { theme, toggle }
}
