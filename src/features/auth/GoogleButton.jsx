import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button.jsx'
import { GoogleIcon } from './AuthLayout.jsx'
import { loginWithGoogle } from './authService.js'
import { authErrorMessage, isSilentAuthError } from './authErrors.js'

export default function GoogleButton() {
  const [busy, setBusy] = useState(false)
  const { t } = useTranslation('auth')
  async function onClick() {
    setBusy(true)
    try {
      await loginWithGoogle()
    } catch (e) {
      if (!isSilentAuthError(e)) toast.error(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button variant="secondary" className="w-full" onClick={onClick} loading={busy}>
      {!busy && <GoogleIcon />}
      {t('google')}
    </Button>
  )
}
