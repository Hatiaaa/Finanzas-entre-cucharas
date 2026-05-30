interface Props {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-[#1A1D2E] border border-[#2A2F42] rounded-2xl
        ${onClick ? 'cursor-pointer hover:border-teal/40 transition-colors' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
