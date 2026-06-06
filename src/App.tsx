import { useState } from 'react'
import { Layout }          from '@/components/features/layout/Layout'
import { Dashboard }         from '@/components/features/dashboard/Dashboard'
import { HistoryView }       from '@/components/features/history/HistoryView'
import { DailyClosingView }  from '@/components/features/cuadre/DailyClosingView'
import { TransactionView }   from '@/components/features/transaction/TransactionView'
import { CreditsView }       from '@/components/features/credits/CreditsView'
import { ReconciliationView } from '@/components/features/reconciliation/ReconciliationView'
import { SuppliersView }     from '@/components/features/suppliers/SuppliersView'
import { InventoryView }     from '@/components/features/inventory/InventoryView'
import { RecipesView }       from '@/components/features/recipes/RecipesView'
import { ReportsView }       from '@/components/features/reports/ReportsView'
import { SettingsView }      from '@/components/features/settings/SettingsView'
import { PlaceholderView }   from '@/components/features/placeholder/PlaceholderView'
import { ConfirmModal }    from '@/components/ui/ConfirmModal'
import type { View }       from '@/components/features/layout/Layout'

export default function App() {
  const [view, setView] = useState<View>('dashboard')

  const renderView = () => {
    switch (view) {
      case 'dashboard':    return <Dashboard onNavigate={setView} />
      case 'history':      return <HistoryView />
      case 'transaction':  return <TransactionView />
      case 'dailyClosing': return <DailyClosingView />
      case 'credits':      return <CreditsView />
      case 'reconciliation': return <ReconciliationView />
      case 'suppliers':    return <SuppliersView />
      case 'inventory':    return <InventoryView />
      case 'recipes':      return <RecipesView />
      case 'reports':      return <ReportsView />
      case 'settings':     return <SettingsView />
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
