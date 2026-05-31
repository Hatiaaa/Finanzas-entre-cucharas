import { useState } from 'react'
import { Plus, Pencil, Trash2, Truck, Save, X } from 'lucide-react'
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '@/hooks/queries/useSuppliers'
import { useModalStore } from '@/store/useModalStore'
import { Card }    from '@/components/ui/Card'
import { Button }  from '@/components/ui/Button'
import { Input }   from '@/components/ui/Input'
import { Modal }   from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { Supplier } from '@/types'

// ── Modal add / edit ──────────────────────────────────────────────────────────

interface FormModalProps {
  initial?: Supplier
  onSave:  (name: string) => void
  onClose: () => void
  loading: boolean
}

function FormModal({ initial, onSave, onClose, loading }: FormModalProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const err = name.trim().length === 0 ? 'El nombre es obligatorio' : ''

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'Editar proveedor' : 'Nuevo proveedor'}
      size="sm"
    >
      <div className="p-6 space-y-4">
        <Input
          label="Nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Distribuidora La Merced"
          error={undefined}
          autoFocus
        />
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            <X size={14} /> Cancelar
          </Button>
          <Button
            className="flex-1"
            loading={loading}
            disabled={!name.trim()}
            onClick={() => name.trim() && onSave(name.trim())}
          >
            <Save size={14} /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────

export function SuppliersView() {
  const { data: suppliers = [], isLoading } = useSuppliers()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()
  const openConfirm    = useModalStore(s => s.openConfirm)

  const [editing, setEditing] = useState<Supplier | null>(null)
  const [adding,  setAdding]  = useState(false)

  const handleSave = async (name: string) => {
    if (editing) {
      await updateSupplier.mutateAsync({ ...editing, name })
    } else {
      await createSupplier.mutateAsync({ name })
    }
    setEditing(null)
    setAdding(false)
  }

  if (isLoading) return (
    <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
  )

  const isMutating = createSupplier.isPending || updateSupplier.isPending

  return (
    <>
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Proveedores</h2>
          <p className="text-[#9ca3af] text-sm mt-0.5">{suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} registrado{suppliers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus size={15} /> Nuevo proveedor
        </Button>
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold rounded-l-none">Nombre</th>
                <th className="px-5 py-3 text-center w-24 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2F42]">
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-12 text-center text-[#4b5563] italic">
                    No hay proveedores aún. Agrega el primero.
                  </td>
                </tr>
              )}
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-white/3 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal/10 rounded-xl">
                        <Truck size={14} className="text-teal" />
                      </div>
                      <span className="text-white font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditing(s)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[#4b5563] hover:text-teal hover:bg-teal/10 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => openConfirm(
                          'Eliminar proveedor',
                          `¿Eliminar "${s.name}"? Se perderá la referencia en ingredientes.`,
                          () => deleteSupplier.mutate(s.id),
                        )}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[#4b5563] hover:text-negative hover:bg-negative/10 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>

    {(adding || editing) && (
      <FormModal
        initial={editing ?? undefined}
        onSave={handleSave}
        onClose={() => { setAdding(false); setEditing(null) }}
        loading={isMutating}
      />
    )}
    </>
  )
}
