import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme.js'
import Button from '@/components/ui/Button.jsx'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}
