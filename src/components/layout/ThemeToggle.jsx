import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks/useTheme.js'
import Button from '@/components/ui/Button.jsx'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  const { t } = useTranslation()
  const label = t(dark ? 'theme.light' : 'theme.dark')
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={label} title={label}>
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}
