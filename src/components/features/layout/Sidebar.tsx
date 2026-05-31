import {
  LayoutDashboard, PlusCircle, List, Bot, Users,
  Truck, Package, ChefHat, BarChart2, Settings, X,
} from 'lucide-react'
import type { View } from './Layout'

interface NavItem {
  id:    View
  label: string
  icon:  React.ElementType
}

const NAV: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'transaction',  label: 'Nueva Transacción', icon: PlusCircle      },
  { id: 'history',      label: 'Historial',         icon: List            },
  { id: 'dailyClosing', label: 'Cuadre de Caja',    icon: Bot             },
  { id: 'credits',      label: 'Créditos',          icon: Users           },
  { id: 'suppliers',    label: 'Proveedores',       icon: Truck           },
  { id: 'inventory',    label: 'Inventario',        icon: Package         },
  { id: 'recipes',      label: 'Recetas',           icon: ChefHat         },
  { id: 'reports',      label: 'Reportes',          icon: BarChart2       },
  { id: 'settings',     label: 'Configuración',     icon: Settings        },
]

interface Props {
  current:  View
  onNav:    (v: View) => void
  open:     boolean
  onClose:  () => void
}

export function Sidebar({ current, onNav, open, onClose }: Props) {
  const handle = (v: View) => { onNav(v); onClose() }

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-40 w-60 flex flex-col
        bg-[#1A1D2E] border-r border-[#2A2F42]
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-[#2A2F42]">
          <div className="flex items-center gap-3">
            <img src="/logo-64.png" alt="Entre Cucharas" className="w-9 h-9 rounded-xl" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">Entre Cucharas</p>
              <p className="text-[#5CB8B2] text-[10px] font-medium">Finanzas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-[#9ca3af] hover:text-white rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = current === id
            return (
              <button
                key={id}
                onClick={() => handle(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-sm font-medium transition-all duration-150
                  ${active
                    ? 'bg-teal/10 text-teal border border-teal/20'
                    : 'text-[#9ca3af] hover:text-white hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <Icon size={17} className={active ? 'text-teal' : ''} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#2A2F42]">
          <p className="text-[#4b5563] text-[10px] text-center">v2.0 · Entre Cucharas</p>
        </div>
      </aside>
    </>
  )
}
