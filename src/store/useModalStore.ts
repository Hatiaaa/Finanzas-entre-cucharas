import { create } from 'zustand'

interface ConfirmState {
  open:      boolean
  title:     string
  message:   string
  onConfirm: () => void
}

interface ModalStore {
  confirm: ConfirmState | null
  /** Abre el modal de confirmación. Reemplaza window.confirm() en toda la app. */
  openConfirm: (title: string, message: string, onConfirm: () => void) => void
  closeConfirm: () => void
}

export const useModalStore = create<ModalStore>(set => ({
  confirm: null,

  openConfirm: (title, message, onConfirm) =>
    set({ confirm: { open: true, title, message, onConfirm } }),

  closeConfirm: () =>
    set({ confirm: null }),
}))
