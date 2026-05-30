interface Props {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  children: React.ReactNode
  className?: string
}

const variants = {
  success: 'bg-positive/10 text-positive border-positive/20',
  danger:  'bg-negative/10 text-negative border-negative/20',
  warning: 'bg-amber/10 text-amber border-amber/20',
  info:    'bg-teal/10 text-teal border-teal/20',
  neutral: 'bg-white/5 text-[#9ca3af] border-white/10',
}

export function Badge({ variant = 'neutral', children, className = '' }: Props) {
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full
      text-xs font-semibold border ${variants[variant]} ${className}
    `}>
      {children}
    </span>
  )
}
