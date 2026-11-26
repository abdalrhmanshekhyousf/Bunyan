// شعار Data Analytics: ثلاثة أعمدة صاعدة (البيانات) يعلوها خط اتجاه بعُقد فيروزية (التحليل والمخططات).
// الرسم نفسه في public/favicon.svg وscripts/make-icons.mjs وAnimatedLogoMark
export const NAME = 'Data Analytics'

export function LogoMark({ className = 'size-10', title = NAME }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <rect x="6" y="36" width="12" height="18" rx="3" className="fill-navy dark:fill-white" />
      <rect x="26" y="26" width="12" height="28" rx="3" className="fill-navy dark:fill-white" />
      <rect x="46" y="16" width="12" height="38" rx="3" className="fill-navy dark:fill-white" />
      <rect x="4" y="57" width="56" height="3.5" rx="1.75" className="fill-navy dark:fill-white" />
      <path
        d="M12 26 32 16 52 6"
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-teal"
      />
      <circle cx="12" cy="26" r="4.5" className="fill-teal" />
      <circle cx="32" cy="16" r="4.5" className="fill-teal" />
      <circle cx="52" cy="6" r="4.5" className="fill-teal" />
    </svg>
  )
}

// أيقونة التطبيق: نفس الشعار على خلفية كحلية مدوّرة (مطابقة لـ public/favicon.svg)
export function AppIcon({ className = 'size-12', title = NAME }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <rect width="64" height="64" rx="15" className="fill-navy" />
      <g transform="translate(12.8 12.8) scale(0.6)">
        <rect x="6" y="36" width="12" height="18" rx="3" fill="#fff" />
        <rect x="26" y="26" width="12" height="28" rx="3" fill="#fff" />
        <rect x="46" y="16" width="12" height="38" rx="3" fill="#fff" />
        <rect x="4" y="57" width="56" height="3.5" rx="1.75" fill="#fff" />
        <path
          d="M12 26 32 16 52 6"
          fill="none"
          stroke="#2DD4BF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="26" r="4.5" fill="#2DD4BF" />
        <circle cx="32" cy="16" r="4.5" fill="#2DD4BF" />
        <circle cx="52" cy="6" r="4.5" fill="#2DD4BF" />
      </g>
    </svg>
  )
}

// الشعار الكامل: الرمز + «Data» بالكحلي و«Analytics» بالفيروزي، والشعار اللفظي لاتيني في الواجهتين
export default function Logo({ size = 'md', className = '' }) {
  const s = {
    sm: { mark: 'size-8', text: 'text-lg' },
    md: { mark: 'size-11', text: 'text-2xl' },
    lg: { mark: 'size-20', text: 'text-5xl' },
  }[size]

  return (
    <div dir="ltr" className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={s.mark} />
      <span className={`${s.text} leading-none font-bold tracking-tight whitespace-nowrap`}>
        <span className="text-navy dark:text-white">Data</span>{' '}
        <span className="text-teal">Analytics</span>
      </span>
    </div>
  )
}
