import { Loader2 } from 'lucide-react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 16, md: 24, lg: 36 }

export function Spinner({ size = 'md', className = '' }: Props) {
  return (
    <Loader2
      size={sizes[size]}
      className={`animate-spin text-teal ${className}`}
    />
  )
}
