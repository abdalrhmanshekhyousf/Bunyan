import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// الترجمة (T1.10): ملف JSON لكل مساحة أسماء ولغة في src/locales/{lang}/{ns}.json
const files = import.meta.glob('../locales/*/*.json', { eager: true, import: 'default' })
const resources = {}
for (const [path, data] of Object.entries(files)) {
  const [, lang, ns] = path.match(/locales\/(\w+)\/(\w+)\.json$/)
  ;(resources[lang] ??= {})[ns] = data
}

export const LANGUAGES = {
  ar: { dir: 'rtl', label: 'العربية' },
  en: { dir: 'ltr', label: 'English' },
}

function initialLanguage() {
  try {
    const saved = localStorage.getItem('lang')
    if (saved in LANGUAGES) return saved
  } catch {
    /* التخزين غير متاح */
  }
  return 'ar'
}

// تغيير اللغة يغيّر lang وdir على <html> ويُحفظ الاختيار (T1.11)
function applyToDocument(lng) {
  const html = document.documentElement
  html.lang = lng
  html.dir = LANGUAGES[lng]?.dir ?? 'rtl'
  try {
    localStorage.setItem('lang', lng)
  } catch {
    /* التخزين غير متاح */
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage(),
  fallbackLng: 'ar',
  defaultNS: 'common',
  ns: Object.keys(resources.ar ?? {}),
  interpolation: { escapeValue: false }, // React يهرّب النصوص بنفسه
  returnNull: false,
})

applyToDocument(i18n.language)
i18n.on('languageChanged', applyToDocument)

export default i18n
