import { useState } from 'react'
import { Plus, Pencil, Trash2, Save, X, Wallet, Tag } from 'lucide-react'
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '@/hooks/queries/useAccounts'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/queries/useCategories'
import { useModalStore } from '@/store/useModalStore'
import { formatMoney }  from '@/utils/formatters'
import { Card }    from '@/components/ui/Card'
import { Button }  from '@/components/ui/Button'
import { Input }   from '@/components/ui/Input'
import { Select }  from '@/components/ui/Select'
import { Modal }   from '@/components/ui/Modal'
import { Badge }   from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import type { Account, AccountType, Category } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN CUENTAS
// ═══════════════════════════════════════════════════════════════════════════════

interface AccFormProps {
  initial?: Account
  onSave:   (data: Omit<Account, 'id'>) => void
  onClose:  () => void
  loading:  boolean
}

function AccountFormModal({ initial, onSave, onClose, loading }: AccFormProps) {
  const [name,    setName]    = useState(initial?.name ?? '')
  const [type,    setType]    = useState<AccountType>(initial?.type ?? 'Efectivo')
  const [balance, setBalance] = useState(String(initial?.initialBalance ?? '0'))

  const isValid = name.trim().length > 0 && isFinite(Number(balance))

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'Editar cuenta' : 'Nueva cuenta'}
      size="sm"
    >
      <div className="p-6 space-y-4">
        <Input
          label="Nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Caja principal"
          autoFocus
        />
        <Select
          label="Tipo de cuenta"
          value={type}
          onChange={e => setType(e.target.value as AccountType)}
          options={[
            { value: 'Efectivo', label: 'Efectivo — dinero en caja' },
            { value: 'Banco',    label: 'Banco — transferencias'    },
            { value: 'Crédito',  label: 'Crédito — cuentas por cobrar' },
          ]}
        />
        <Input
          label="Saldo inicial ($)"
          type="number" step="0.01"
          value={balance}
          onChange={e => setBalance(e.target.value)}
          hint="Saldo con el que arranca esta cuenta"
        />
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            <X size={14} /> Cancelar
          </Button>
          <Button
            className="flex-1"
            loading={loading}
            disabled={!isValid}
            onClick={() => isValid && onSave({ name: name.trim(), type, initialBalance: Number(balance) || 0 })}
          >
            <Save size={14} /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function AccountsSection() {
  const { data: accounts = [], isLoading } = useAccounts()
  const createAcc  = useCreateAccount()
  const updateAcc  = useUpdateAccount()
  const deleteAcc  = useDeleteAccount()
  const openConfirm = useModalStore(s => s.openConfirm)

  const [editing, setEditing] = useState<Account | null>(null)
  const [adding,  setAdding]  = useState(false)

  const handleSave = async (data: Omit<Account, 'id'>) => {
    if (editing) await updateAcc.mutateAsync({ ...data, id: editing.id })
    else         await createAcc.mutateAsync(data)
    setEditing(null); setAdding(false)
  }

  const typeColors: Record<AccountType, string> = {
    Efectivo: 'text-positive bg-positive/10',
    Banco:    'text-teal bg-teal/10',
    Crédito:  'text-amber bg-amber/10',
  }

  if (isLoading) return <div className="py-8 flex justify-center"><Spinner /></div>

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal/10 rounded-xl"><Wallet size={16} className="text-teal" /></div>
          <div>
            <p className="text-white font-bold">Cuentas</p>
            <p className="text-[#9ca3af] text-xs">{accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus size={13} /> Nueva
        </Button>
      </div>

      <div className="space-y-2">
        {accounts.length === 0 && (
          <p className="text-[#4b5563] text-sm italic text-center py-6">Sin cuentas configuradas.</p>
        )}
        {accounts.map(acc => (
          <div
            key={acc.id}
            className="flex items-center gap-3 p-3.5 bg-[#0E1420] rounded-xl border border-[#2A2F42] group hover:border-[#3A3F52] transition-colors"
          >
            <div className={`p-1.5 rounded-lg text-xs font-bold ${typeColors[acc.type]}`}>
              <Wallet size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{acc.name}</p>
              <p className="text-[#4b5563] text-xs">{acc.type} · Inicial: {formatMoney(acc.initialBalance)}</p>
            </div>
            <Badge variant={acc.type === 'Efectivo' ? 'success' : acc.type === 'Banco' ? 'info' : 'warning'}>
              {acc.type}
            </Badge>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(acc)}
                className="p-1.5 text-[#4b5563] hover:text-teal hover:bg-teal/10 rounded-lg transition-all"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => openConfirm(
                  'Eliminar cuenta',
                  `¿Eliminar "${acc.name}"? Se perderán todas sus transacciones.`,
                  () => deleteAcc.mutate(acc.id),
                )}
                className="p-1.5 text-[#4b5563] hover:text-negative hover:bg-negative/10 rounded-lg transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(adding || editing) && (
        <AccountFormModal
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setAdding(false); setEditing(null) }}
          loading={createAcc.isPending || updateAcc.isPending}
        />
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN CATEGORÍAS
// ═══════════════════════════════════════════════════════════════════════════════

interface CatFormProps {
  initial?: Category
  onSave:   (data: Omit<Category, 'id'>) => void
  onClose:  () => void
  loading:  boolean
}

function CategoryFormModal({ initial, onSave, onClose, loading }: CatFormProps) {
  const [name,    setName]    = useState(initial?.name ?? '')
  const [type,    setType]    = useState(initial?.type ?? 'Egreso')
  const [subcats, setSubcats] = useState<string[]>(initial?.subcategories ?? [])
  const [newSub,  setNewSub]  = useState('')

  const addSubcat = () => {
    const v = newSub.trim()
    if (v && !subcats.includes(v)) {
      setSubcats(p => [...p, v])
      setNewSub('')
    }
  }

  const removeSubcat = (s: string) => setSubcats(p => p.filter(x => x !== s))

  const isValid = name.trim().length > 0

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'Editar categoría' : 'Nueva categoría'}
      size="md"
    >
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Almuerzos"
            autoFocus
          />
          <Select
            label="Tipo"
            value={type}
            onChange={e => setType(e.target.value)}
            options={[
              { value: 'Ingreso',       label: 'Ingreso'       },
              { value: 'Egreso',        label: 'Egreso'        },
              { value: 'Transferencia', label: 'Transferencia' },
            ]}
          />
        </div>

        {/* Subcategorías */}
        <div>
          <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2 px-1">
            Subcategorías
          </p>
          <div className="flex gap-2 mb-2">
            <input
              value={newSub}
              onChange={e => setNewSub(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubcat())}
              placeholder="Escribe y presiona Enter…"
              className="flex-1 bg-[#0E1420] text-white px-3 py-2 rounded-xl border border-[#2A2F42] focus:outline-none focus:border-teal text-sm placeholder:text-[#4b5563]"
            />
            <Button size="sm" variant="secondary" onClick={addSubcat} disabled={!newSub.trim()}>
              <Plus size={13} />
            </Button>
          </div>
          {subcats.length === 0 ? (
            <p className="text-[#4b5563] text-xs italic px-1">Sin subcategorías</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subcats.map(s => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 bg-teal/10 text-teal border border-teal/20 rounded-full px-3 py-1 text-xs font-semibold"
                >
                  {s}
                  <button onClick={() => removeSubcat(s)} className="hover:text-white transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            <X size={14} /> Cancelar
          </Button>
          <Button
            className="flex-1"
            loading={loading}
            disabled={!isValid}
            onClick={() => isValid && onSave({ name: name.trim(), type, subcategories: subcats })}
          >
            <Save size={14} /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function CategoriesSection() {
  const { data: categories = [], isLoading } = useCategories()
  const createCat  = useCreateCategory()
  const updateCat  = useUpdateCategory()
  const deleteCat  = useDeleteCategory()
  const openConfirm = useModalStore(s => s.openConfirm)

  const [editing,    setEditing]    = useState<Category | null>(null)
  const [adding,     setAdding]     = useState(false)
  const [filterType, setFilterType] = useState('')

  const filtered = filterType
    ? categories.filter(c => c.type === filterType)
    : categories

  const handleSave = async (data: Omit<Category, 'id'>) => {
    if (editing) await updateCat.mutateAsync({ ...data, id: editing.id })
    else         await createCat.mutateAsync(data)
    setEditing(null); setAdding(false)
  }

  const typeColor: Record<string, string> = {
    Ingreso:       'success',
    Egreso:        'danger',
    Transferencia: 'info',
  }

  if (isLoading) return <div className="py-8 flex justify-center"><Spinner /></div>

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber/10 rounded-xl"><Tag size={16} className="text-amber" /></div>
          <div>
            <p className="text-white font-bold">Categorías</p>
            <p className="text-[#9ca3af] text-xs">{categories.length} categoría{categories.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-[#0E1420] text-white px-3 py-1.5 rounded-xl border border-[#2A2F42] focus:outline-none focus:border-teal text-xs appearance-none"
          >
            <option value="">Todos los tipos</option>
            <option value="Ingreso">Ingresos</option>
            <option value="Egreso">Egresos</option>
            <option value="Transferencia">Transferencias</option>
          </select>
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus size={13} /> Nueva
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-[#4b5563] text-sm italic text-center py-6">
            {filterType ? `Sin categorías de tipo ${filterType}` : 'Sin categorías configuradas.'}
          </p>
        )}
        {filtered.map(cat => (
          <div
            key={cat.id}
            className="p-3.5 bg-[#0E1420] rounded-xl border border-[#2A2F42] group hover:border-[#3A3F52] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm">{cat.name}</p>
                  <Badge variant={(typeColor[cat.type] as any) ?? 'neutral'}>
                    {cat.type}
                  </Badge>
                </div>
                {cat.subcategories.length > 0 && (
                  <p className="text-[#4b5563] text-xs mt-0.5 truncate">
                    {cat.subcategories.join(' · ')}
                  </p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => setEditing(cat)}
                  className="p-1.5 text-[#4b5563] hover:text-teal hover:bg-teal/10 rounded-lg transition-all"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => openConfirm(
                    'Eliminar categoría',
                    `¿Eliminar "${cat.name}"? Las transacciones existentes la conservarán.`,
                    () => deleteCat.mutate(cat.id),
                  )}
                  className="p-1.5 text-[#4b5563] hover:text-negative hover:bg-negative/10 rounded-lg transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(adding || editing) && (
        <CategoryFormModal
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setAdding(false); setEditing(null) }}
          loading={createCat.isPending || updateCat.isPending}
        />
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISTA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function SettingsView() {
  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Configuración</h2>
        <p className="text-[#9ca3af] text-sm mt-0.5">Gestión de cuentas y categorías</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-5"><AccountsSection /></Card>
        <Card className="p-5"><CategoriesSection /></Card>
      </div>
    </div>
  )
}
