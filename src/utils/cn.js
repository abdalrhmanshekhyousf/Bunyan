// دمج أصناف CSS مع تجاهل القيم الفارغة
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
