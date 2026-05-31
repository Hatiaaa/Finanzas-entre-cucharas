import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Package, AlertTriangle, Save, X, Search } from 'lucide-react'
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
} from '@/hooks/queries/useIngredients'
import { useSuppliers } from '@/hooks/queries/useSuppliers'
import { useModalStore } from '@/store/useModalStore'
import { formatMoney }  from '@/utils/formatters'
import { Card }    from '@/components/ui/Card'
import { Button }  from '@/components/ui/Button'
import { Input }   from '@/components/ui/Input'
import { Select }  from '@/components/ui/Select'
import { Modal }   from '@/components/ui/Modal'
import { Badge }   from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import type { Ingredient, UnitType } from '@/types'

// ── Constantes ─────────────────────────────────────────────────────────────────

const UNITS: UnitType[] = ['kg', 'g', 'l', 'ml', 'unidad', 'docena']

const UNIT_LABELS: Record<UnitType, string> = {
  kg: 'Kilogramo', g: 'Gramo', l: 'Litro', ml: 'Mililitro',
  unidad: 'Unidad', docena: 'Docena',
}

// ── Formulario add / edit ─────────────────────────────────────────────────────

interface IngForm {
  name:         string
  unit:         UnitType
  cost:         string
  currentStock: string
  minStock:     string
  supplierId:   string
}

const EMPTY_FORM: IngForm = {
  name: '', unit: 'unidad', cost: '', currentStock: '', minStock: '', supplierId: '',
}

function toForm(ing: Ingredient): IngForm {
  return {
    name:         ing.name,
    unit:         ing.unit,
    cost:         String(ing.cost),
    currentStock: String(ing.currentStock),
    minStock:     String(ing.minStock),
    supplierId:   ing.supplierId ?? '',
  }
}

interface FormModalProps {
  initial?:  Ingredient
  suppliers: { id: string; name: string }[]
  onSave:    (data: Omit<Ingredient, 'id'>) => void
  onClose:   () => void
  loading:   boolean
}

function FormModal({ initial, suppliers, onSave, onClose, loading }: FormModalProps) {
  const [f, setF] = useState<IngForm>(initial ? toForm(initial) : EMPTY_FORM)
  const set = (k: keyof IngForm, v: string) => setF(prev => ({ ...prev, [k]: v }))

  const errors = {
    name:  f.name.trim() === '' ? 'Obligatorio' : '',
    cost:  isNaN(Number(f.cost)) || Number(f.cost) < 0 ? 'Inválido' : '',
    stock: isNaN(Number(f.currentStock)) ? 'Inválido' : '',
    min:   isNaN(Number(f.minStock)) ? 'Inválido' : '',
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const handleSave = () => {
    if (hasErrors) return
    onSave({
      name:         f.name.trim(),
      unit:         f.unit,
      cost:         Number(f.cost) || 0,
      currentStock: Number(f.currentStock) || 0,
      minStock:     Number(f.minStock) || 0,
      supplierId:   f.supplierId || undefined,
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'Editar ingrediente' : 'Nuevo ingrediente'}
      size="md"
    >
      <div className="p-6 space-y-4">
        <Input
          label="Nombre"
          value={f.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Ej: Harina de trigo"
          error={f.name && errors.name ? errors.name : ''}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Unidad de medida"
            value={f.unit}
            onChange={e => set('unit', e.target.value as UnitType)}
            options={UNITS.map(u => ({ value: u, label: `${u} — ${UNIT_LABELS[u]}` }))}
          />
          <Input
            label="Costo por unidad ($)"
            type="number" min="0" step="0.01"
            value={f.cost}
            onChange={e => set('cost', e.target.value)}
            placeholder="0.00"
            error={f.cost && errors.cost ? errors.cost : ''}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={`Stock actual (${f.unit})`}
            type="number" min="0" step="0.01"
            value={f.currentStock}
            onChange={e => set('currentStock', e.target.value)}
            placeholder="0"
            error={f.currentStock && errors.stock ? errors.stock : ''}
          />
          <Input
            label={`Stock mínimo (${f.unit})`}
            type="number" min="0" step="0.01"
            value={f.minStock}
            onChange={e => set('minStock', e.target.value)}
            placeholder="0"
            error={f.minStock && errors.min ? errors.min : ''}
          />
        </div>

        <Select
          label="Proveedor (opcional)"
          placeholder="Sin proveedor"
          value={f.supplierId}
          onChange={e => set('supplierId', e.target.value)}
          options={suppliers.map(s => ({ value: s.id, label: s.name }))}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            <X size={14} /> Cancelar
          </Button>
          <Button className="flex-1" loading={loading} disabled={hasErrors || !f.name.trim()} onClick={handleSave}>
            <Save size={14} /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────

export function InventoryView() {
  const { data: ingredients = [], isLoading: ingLoading } = useIngredients()
  const { data: suppliers   = [], isLoading: supLoading } = useSuppliers()
  const createIng  = useCreateIngredient()
  const updateIng  = useUpdateIngredient()
  const deleteIng  = useDeleteIngredient()
  const openConfirm = useModalStore(s => s.openConfirm)

  const [editing, setEditing]   = useState<Ingredient | null>(null)
  const [adding,  setAdding]    = useState(false)
  const [search,  setSearch]    = useState('')
  const [filterSup, setFilterSup] = useState('')

  const lowStock = useMemo(
    () => ingredients.filter(i => i.currentStock < i.minStock),
    [ingredients],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return ingredients.filter(i => {
      if (filterSup && i.supplierId !== filterSup) return false
      if (q && !i.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [ingredients, search, filterSup])

  const totalValue = useMemo(
    () => ingredients.reduce((s, i) => s + i.cost * i.currentStock, 0),
    [ingredients],
  )

  const handleSave = async (data: Omit<Ingredient, 'id'>) => {
    if (editing) {
      await updateIng.mutateAsync({ ...data, id: editing.id })
    } else {
      await createIng.mutateAsync(data)
    }
    setEditing(null)
    setAdding(false)
  }

  const stockBadge = (ing: Ingredient) => {
    if (ing.currentStock === 0)             return <Badge variant="danger">Sin stock</Badge>
    if (ing.currentStock < ing.minStock)    return <Badge variant="warning">Stock bajo</Badge>
    return <Badge variant="success">OK</Badge>
  }

  if (ingLoading || supLoading) return (
    <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
  )

  const isMutating = createIng.isPending || updateIng.isPending

  return (
    <>
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Inventario</h2>
          <p className="text-[#9ca3af] text-sm mt-0.5">{ingredients.length} ingredientes registrados</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus size={15} /> Nuevo ingrediente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">Total ingredientes</p>
          <p className="text-3xl font-extrabold text-white">{ingredients.length}</p>
        </Card>
        <Card className={`p-5 ${lowStock.length > 0 ? 'border-amber/30 bg-amber/5' : ''}`}>
          <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">Stock bajo / agotado</p>
          <div className="flex items-center gap-2">
            <p className={`text-3xl font-extrabold ${lowStock.length > 0 ? 'text-amber' : 'text-positive'}`}>
              {lowStock.length}
            </p>
            {lowStock.length > 0 && <AlertTriangle size={20} className="text-amber" />}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-widest mb-1">Valor del inventario</p>
          <p className="text-3xl font-extrabold text-teal">{formatMoney(totalValue)}</p>
        </Card>
      </div>

      {/* Alerta stock bajo */}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 bg-amber/5 border border-amber/30 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber mt-0.5 shrink-0" />
          <div>
            <p className="text-amber font-semibold text-sm">Ingredientes con stock bajo</p>
            <p className="text-[#9ca3af] text-xs mt-0.5">
              {lowStock.map(i => i.name).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ingrediente…"
            className="w-full bg-[#1A1D2E] text-white pl-8 pr-4 py-2.5 rounded-xl border border-[#2A2F42] focus:outline-none focus:border-teal text-sm placeholder:text-[#4b5563]"
          />
        </div>
        <Select
          value={filterSup}
          onChange={e => setFilterSup(e.target.value)}
          placeholder="Todos los proveedores"
          options={suppliers.map(s => ({ value: s.id, label: s.name }))}
          className="sm:w-56"
        />
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold">Ingrediente</th>
                <th className="px-5 py-3 text-left font-semibold hidden sm:table-cell">Proveedor</th>
                <th className="px-5 py-3 text-center font-semibold">Estado</th>
                <th className="px-5 py-3 text-right font-semibold hidden md:table-cell">Stock actual</th>
                <th className="px-5 py-3 text-right font-semibold hidden md:table-cell">Stock mín.</th>
                <th className="px-5 py-3 text-right font-semibold">Costo/u.</th>
                <th className="px-5 py-3 text-center w-20 font-semibold">Acc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2F42]">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#4b5563] italic">
                    {search || filterSup ? 'Sin resultados para este filtro' : 'No hay ingredientes aún'}
                  </td>
                </tr>
              )}
              {filtered.map(ing => {
                const supName = suppliers.find(s => s.id === ing.supplierId)?.name
                return (
                  <tr key={ing.id} className="hover:bg-white/3 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          ing.currentStock === 0 ? 'bg-negative/10' :
                          ing.currentStock < ing.minStock ? 'bg-amber/10' : 'bg-teal/10'
                        }`}>
                          <Package size={14} className={
                            ing.currentStock === 0 ? 'text-negative' :
                            ing.currentStock < ing.minStock ? 'text-amber' : 'text-teal'
                          } />
                        </div>
                        <div>
                          <p className="text-white font-medium">{ing.name}</p>
                          <p className="text-[#4b5563] text-xs">{ing.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-[#9ca3af] text-xs">
                        {supName ?? <span className="text-[#4b5563] italic">—</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {stockBadge(ing)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono hidden md:table-cell">
                      <span className={ing.currentStock < ing.minStock ? 'text-amber font-bold' : 'text-[#9ca3af]'}>
                        {ing.currentStock} {ing.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[#4b5563] hidden md:table-cell">
                      {ing.minStock} {ing.unit}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-white">
                      {formatMoney(ing.cost)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditing(ing)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-[#4b5563] hover:text-teal hover:bg-teal/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => openConfirm(
                            'Eliminar ingrediente',
                            `¿Eliminar "${ing.name}"? Se perderá la referencia en recetas.`,
                            () => deleteIng.mutate(ing.id),
                          )}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-[#4b5563] hover:text-negative hover:bg-negative/10 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>

    {(adding || editing) && (
      <FormModal
        initial={editing ?? undefined}
        suppliers={suppliers}
        onSave={handleSave}
        onClose={() => { setAdding(false); setEditing(null) }}
        loading={isMutating}
      />
    )}
    </>
  )
}
