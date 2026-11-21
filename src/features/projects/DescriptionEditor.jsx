import { useEffect, useRef, useState } from 'react'
import { Check, CloudOff, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Textarea from '@/components/ui/Textarea.jsx'
import { useDebounce } from '@/hooks/useDebounce.js'
import { MAX_DESCRIPTION, updateProject } from './projectsService.js'

// حفظ تلقائي للوصف بعد توقف الكتابة (T3.6)
export default function DescriptionEditor({ project, readOnly }) {
  const { t } = useTranslation('projects')
  const [text, setText] = useState(project.description ?? '')
  const [state, setState] = useState('saved') // saved | pending | saving | error
  const debounced = useDebounce(text, 900)
  const lastSaved = useRef(project.description ?? '')

  useEffect(() => {
    if (readOnly || debounced === lastSaved.current || debounced.length > MAX_DESCRIPTION) return
    setState('saving')
    updateProject(project.id, { description: debounced })
      .then(() => {
        lastSaved.current = debounced
        setState('saved')
      })
      .catch(() => setState('error'))
  }, [debounced, project.id, readOnly])

  // تحذير عند المغادرة قبل الحفظ
  useEffect(() => {
    if (text === lastSaved.current) return
    const warn = (e) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [text])

  const tooLong = text.length > MAX_DESCRIPTION

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        label={t('description.label')}
        rows={14}
        value={text}
        readOnly={readOnly}
        onChange={(e) => {
          setText(e.target.value)
          setState('pending')
        }}
        error={tooLong ? t('description.tooLong', { max: MAX_DESCRIPTION }) : undefined}
        placeholder={t('description.placeholder')}
      />
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {text.length} / {MAX_DESCRIPTION}
        </span>
        {!readOnly && <SaveIndicator state={state} />}
      </div>
    </div>
  )
}

function SaveIndicator({ state }) {
  const { t } = useTranslation('projects')
  if (state === 'saving' || state === 'pending')
    return (
      <span className="flex items-center gap-1.5" aria-live="polite">
        <Loader2 className="size-4 animate-spin" />
        {t('description.saving')}
      </span>
    )
  if (state === 'error')
    return (
      <span className="flex items-center gap-1.5 text-red-600" aria-live="polite">
        <CloudOff className="size-4" />
        {t('description.saveFailed')}
      </span>
    )
  return (
    <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal" aria-live="polite">
      <Check className="size-4" />
      {t('description.saved')}
    </span>
  )
}
