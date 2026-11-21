import { useSyncExternalStore } from 'react'

// يتابع صنف .dark على <html> (يغيّره زر الوضع من أي مكان)
function subscribe(cb) {
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => obs.disconnect()
}
const get = () => document.documentElement.classList.contains('dark')

export function useIsDark() {
  return useSyncExternalStore(subscribe, get, () => false)
}
