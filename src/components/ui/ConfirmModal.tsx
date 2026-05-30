import { AlertTriangle } from 'lucide-react'
import { useModalStore } from '@/store/useModalStore'
import { Modal } from './Modal'
import { Button } from './Button'

/** Componente global — montar una sola vez en App.tsx */
export function ConfirmModal() {
  const { confirm, closeConfirm } = useModalStore()

  if (!confirm) return null

  const handleConfirm = () => {
    confirm.onConfirm()
    closeConfirm()
  }

  return (
    <Modal open={confirm.open} onClose={closeConfirm} size="sm">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="bg-negative/10 p-3 rounded-xl shrink-0">
            <AlertTriangle size={22} className="text-negative" />
          </div>
          <div>
            <p className="text-white font-bold mb-1">{confirm.title}</p>
            <p className="text-[#9ca3af] text-sm leading-relaxed">{confirm.message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={closeConfirm}>
            Cancelar
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleConfirm}>
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
