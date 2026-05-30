import { Construction } from 'lucide-react'

interface Props { title: string }

export function PlaceholderView({ title }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-20">
      <div className="p-5 bg-amber/10 rounded-3xl">
        <Construction size={40} className="text-amber" />
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-[#9ca3af] text-sm max-w-xs">
        Este módulo se construye en la siguiente fase del plan de trabajo.
      </p>
    </div>
  )
}
