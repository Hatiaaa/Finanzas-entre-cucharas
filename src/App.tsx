import { useState } from 'react'
import { Layout }          from '@/components/features/layout/Layout'
import { Dashboard }         from '@/components/features/dashboard/Dashboard'
import { HistoryView }       from '@/components/features/history/HistoryView'
import { DailyClosingView }  from '@/components/features/cuadre/DailyClosingView'
import { PlaceholderView }   from '@/components/features/placeholder/PlaceholderView'
import { ConfirmModal }    from '@/components/ui/ConfirmModal'
import type { View }       from '@/components/features/layout/Layout'

export default function App() {
  const [view, setView] = useState<View>('dashboard')

  const renderView = () => {
    switch (view) {
      case 'dashboard':    return <Dashboard onNavigate={setView} />
      case 'history':      return <HistoryView />
      case 'transaction':  return <PlaceholderView title="Nueva Transacción" />
      case 'dailyClosing': return <DailyClosingView />
      case 'credits':      return <PlaceholderView title="Créditos" />
      case 'suppliers':    return <PlaceholderView title="Proveedores" />
      case 'inventory':    return <PlaceholderView title="Inventario" />
      case 'recipes':      return <PlaceholderView title="Recetas" />
      case 'settings':     return <PlaceholderView title="Configuración" />
    }
  }

  return (
    <>
      <Layout current={view} onNav={setView}>
        {renderView()}
      </Layout>
      {/* Modal de confirmación global — reemplaza window.confirm() */}
      <ConfirmModal />
    </>
  )
}
