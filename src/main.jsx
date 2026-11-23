import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/readex-pro/400.css'
import '@fontsource/readex-pro/600.css'
import '@fontsource/readex-pro/700.css'
import '@/index.css'
import '@/lib/i18n.js'
import '@/lib/pwa.js'
import App from '@/app/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
