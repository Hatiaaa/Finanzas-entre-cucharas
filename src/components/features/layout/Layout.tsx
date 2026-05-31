import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

export type View =
  | 'dashboard'
  | 'transaction'
  | 'history'
  | 'dailyClosing'
  | 'credits'
  | 'suppliers'
  | 'inventory'
  | 'recipes'
  | 'reports'
  | 'settings'

const titles: Record<View, string> = {
  dashboard:    'Dashboard',
  transaction:  'Nueva Transacción',
  history:      'Historial',
  dailyClosing: 'Cuadre de Caja',
  credits:      'Créditos',
  suppliers:    'Proveedores',
  inventory:    'Inventario',
  recipes:      'Recetas',
  reports:      'Reportes',
  settings:     'Configuración',
}

interface Props {
  current:  View
  onNav:    (v: View) => void
  children: React.ReactNode
}

export function Layout({ current, onNav, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#0E1420] overflow-hidden">
      <Sidebar
        current={current}
        onNav={onNav}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2F42] lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-[#9ca3af] hover:text-white rounded-xl"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-white font-bold">{titles[current]}</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
