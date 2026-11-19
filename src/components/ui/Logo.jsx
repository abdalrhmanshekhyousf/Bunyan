// شعار بُنيان: الفكرة (الصندوق الفيروزي) في الأعلى، والكيانات تُبنى تحتها على أساس واحد.

export function LogoMark({ className = 'size-10', title = 'بُنيان' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <rect x="21" y="6" width="22" height="13" rx="3.5" className="fill-teal" />
      <path
        d="M32 19v9M17 34v-6h30v6"
        fill="none"
        strokeWidth="3.5"
        strokeLinejoin="round"
        className="stroke-navy dark:stroke-white"
      />
      <rect x="5" y="33" width="24" height="13" rx="3.5" className="fill-navy dark:fill-white" />
      <rect x="35" y="33" width="24" height="13" rx="3.5" className="fill-navy dark:fill-white" />
      <rect x="5" y="51" width="54" height="3.5" rx="1.75" className="fill-navy dark:fill-white" />
    </svg>
  )
}

// أيقونة التطبيق: نفس الشعار على خلفية كحلية مدوّرة (مطابقة لـ public/favicon.svg)
export function AppIcon({ className = 'size-12', title = 'بُنيان' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <rect width="64" height="64" rx="15" className="fill-navy" />
      <g transform="translate(12.8 12.8) scale(0.6)">
        <rect x="21" y="6" width="22" height="13" rx="3.5" fill="#2DD4BF" />
        <path
          d="M32 19v9M17 34v-6h30v6"
          fill="none"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <rect x="5" y="33" width="24" height="13" rx="3.5" fill="#fff" />
        <rect x="35" y="33" width="24" height="13" rx="3.5" fill="#fff" />
        <rect x="5" y="51" width="54" height="3.5" rx="1.75" fill="#fff" />
      </g>
    </svg>
  )
}

// الشعار الكامل: الرمز + «بُنيان» + BUNYAN
export default function Logo({ size = 'md', withLatin = true, className = '' }) {
  const s = {
    sm: { mark: 'size-8', ar: 'text-xl', en: 'text-[0.55rem]' },
    md: { mark: 'size-11', ar: 'text-3xl', en: 'text-[0.7rem]' },
    lg: { mark: 'size-20', ar: 'text-6xl', en: 'text-base' },
  }[size]

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark className={s.mark} />
      <div className="flex flex-col items-center leading-none">
        <span className={`${s.ar} font-bold text-navy dark:text-white`}>بُنيان</span>
        {withLatin && (
          <span
            dir="ltr"
            className={`${s.en} mt-1 font-semibold tracking-[0.25em] text-slate-500 dark:text-slate-400`}
          >
            BUNYAN
          </span>
        )}
      </div>
    </div>
  )
}
