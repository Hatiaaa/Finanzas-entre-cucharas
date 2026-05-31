import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, ChefHat, Save, X, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import {
  useRecipes,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
} from '@/hooks/queries/useRecipes'
import { useIngredients } from '@/hooks/queries/useIngredients'
import { useModalStore }  from '@/store/useModalStore'
import { formatMoney }    from '@/utils/formatters'
import { Card }    from '@/components/ui/Card'
import { Button }  from '@/components/ui/Button'
import { Input }   from '@/components/ui/Input'
import { Select }  from '@/components/ui/Select'
import { Modal }   from '@/components/ui/Modal'
import { Badge }   from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import type { Recipe, RecipeIngredient } from '@/types'

// ── Tipos del formulario ───────────────────────────────────────────────────────

interface IngRow { ingredientId: string; amount: string }

interface RecipeForm {
  name:         string
  category:     string
  sellingPrice: string
  ingredients:  IngRow[]
}

const EMPTY_FORM: RecipeForm = {
  name: '', category: '', sellingPrice: '', ingredients: [],
}

function toForm(r: Recipe): RecipeForm {
  return {
    name:         r.name,
    category:     r.category,
    sellingPrice: String(r.sellingPrice),
    ingredients:  r.ingredients.map(i => ({ ingredientId: i.ingredientId, amount: String(i.amount) })),
  }
}

// ── Modal formulario receta ────────────────────────────────────────────────────

interface FormModalProps {
  initial?:    Recipe
  ingredients: { id: string; name: string; unit: string; cost: number }[]
  onSave:      (data: Omit<Recipe, 'id'>) => void
  onClose:     () => void
  loading:     boolean
}

function RecipeFormModal({ initial, ingredients, onSave, onClose, loading }: FormModalProps) {
  const [f, setF] = useState<RecipeForm>(initial ? toForm(initial) : EMPTY_FORM)

  const set = (k: keyof Omit<RecipeForm, 'ingredients'>, v: string) =>
    setF(prev => ({ ...prev, [k]: v }))

  const setIngRow = (idx: number, field: keyof IngRow, value: string) =>
    setF(prev => {
      const rows = [...prev.ingredients]
      rows[idx] = { ...rows[idx], [field]: value }
      return { ...prev, ingredients: rows }
    })

  const addIngRow    = () => setF(p => ({ ...p, ingredients: [...p.ingredients, { ingredientId: '', amount: '' }] }))
  const removeIngRow = (idx: number) => setF(p => ({ ...p, ingredients: p.ingredients.filter((_, i) => i !== idx) }))

  // Costo calculado
  const calculatedCost = useMemo(() => {
    return f.ingredients.reduce((sum, row) => {
      const ing = ingredients.find(i => i.id === row.ingredientId)
      const amt = Number(row.amount)
      if (!ing || !isFinite(amt)) return sum
      return sum + ing.cost * amt
    }, 0)
  }, [f.ingredients, ingredients])

  const price  = Number(f.sellingPrice) || 0
  const margin = price > 0 ? ((price - calculatedCost) / price) * 100 : 0

  const isValid = f.name.trim() !== '' && price > 0

  const handleSave = () => {
    if (!isValid) return
    const validIngredients: RecipeIngredient[] = f.ingredients
      .filter(r => r.ingredientId && Number(r.amount) > 0)
      .map(r => ({ ingredientId: r.ingredientId, amount: Number(r.amount) }))

    onSave({
      name:         f.name.trim(),
      category:     f.category.trim(),
      sellingPrice: price,
      ingredients:  validIngredients,
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'Editar receta' : 'Nueva receta'}
      size="lg"
    >
      <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        {/* Datos básicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre del plato"
            value={f.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ej: Seco de pollo"
            autoFocus
          />
          <Input
            label="Categoría"
            value={f.category}
            onChange={e => set('category', e.target.value)}
            placeholder="Ej: Almuerzos, Desayunos…"
          />
        </div>

        <Input
          label="Precio de venta ($)"
          type="number" min="0" step="0.01"
          value={f.sellingPrice}
          onChange={e => set('sellingPrice', e.target.value)}
          placeholder="0.00"
        />

        {/* Resumen de costos */}
        {price > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0E1420] rounded-xl p-3 text-center">
              <p className="text-[#9ca3af] text-xs">Costo estimado</p>
              <p className="text-white font-bold">{formatMoney(calculatedCost)}</p>
            </div>
            <div className="bg-[#0E1420] rounded-xl p-3 text-center">
              <p className="text-[#9ca3af] text-xs">Precio venta</p>
              <p className="text-positive font-bold">{formatMoney(price)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${margin >= 30 ? 'bg-positive/10' : margin >= 0 ? 'bg-amber/10' : 'bg-negative/10'}`}>
              <p className="text-[#9ca3af] text-xs">Margen</p>
              <p className={`font-bold ${margin >= 30 ? 'text-positive' : margin >= 0 ? 'text-amber' : 'text-negative'}`}>
                {margin.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Ingredientes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest px-1">
              Ingredientes
            </p>
            <button
              type="button"
              onClick={addIngRow}
              className="flex items-center gap-1.5 text-teal text-xs hover:underline"
            >
              <Plus size={12} /> Agregar
            </button>
          </div>

          {f.ingredients.length === 0 && (
            <p className="text-[#4b5563] text-sm italic text-center py-3">
              Sin ingredientes — la receta se guardará sin costos calculados.
            </p>
          )}

          <div className="space-y-2">
            {f.ingredients.map((row, idx) => {
              const ing = ingredients.find(i => i.id === row.ingredientId)
              const rowCost = ing && Number(row.amount) > 0
                ? ing.cost * Number(row.amount) : 0

              return (
                <div key={idx} className="flex items-end gap-2">
                  <div className="flex-1">
                    {idx === 0 && (
                      <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 px-1">
                        Ingrediente
                      </label>
                    )}
                    <select
                      value={row.ingredientId}
                      onChange={e => setIngRow(idx, 'ingredientId', e.target.value)}
                      className="w-full bg-[#0E1420] text-white px-3 py-2.5 rounded-xl border border-[#2A2F42] focus:outline-none focus:border-teal text-sm appearance-none"
                    >
                      <option value="">Selecciona…</option>
                      {ingredients.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    {idx === 0 && (
                      <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 px-1">
                        Cantidad
                      </label>
                    )}
                    <input
                      type="number" min="0" step="0.01"
                      value={row.amount}
                      onChange={e => setIngRow(idx, 'amount', e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#0E1420] text-white px-3 py-2.5 rounded-xl border border-[#2A2F42] focus:outline-none focus:border-teal text-sm text-right"
                    />
                  </div>
                  {/* Costo de esta fila */}
                  <div className="w-20 pb-0.5 text-right">
                    {idx === 0 && (
                      <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 px-1 invisible">
                        Costo
                      </label>
                    )}
                    <p className="text-[#4b5563] text-xs pb-2.5">
                      {rowCost > 0 ? formatMoney(rowCost) : '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngRow(idx)}
                    className="p-2.5 mb-0.5 text-[#4b5563] hover:text-negative hover:bg-negative/10 rounded-xl transition-all shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2 border-t border-[#2A2F42]">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            <X size={14} /> Cancelar
          </Button>
          <Button className="flex-1" loading={loading} disabled={!isValid} onClick={handleSave}>
            <Save size={14} /> Guardar receta
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────

export function RecipesView() {
  const { data: recipes     = [], isLoading: recLoading } = useRecipes()
  const { data: ingredients = [], isLoading: ingLoading } = useIngredients()
  const createRecipe  = useCreateRecipe()
  const updateRecipe  = useUpdateRecipe()
  const deleteRecipe  = useDeleteRecipe()
  const openConfirm   = useModalStore(s => s.openConfirm)

  const [editing,  setEditing]  = useState<Recipe | null>(null)
  const [adding,   setAdding]   = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Calcular costo de cada receta
  const recipeWithCost = useMemo(
    () => recipes.map(r => {
      const cost = r.ingredients.reduce((sum, ri) => {
        const ing = ingredients.find(i => i.id === ri.ingredientId)
        return sum + (ing ? ing.cost * ri.amount : 0)
      }, 0)
      const margin = r.sellingPrice > 0
        ? ((r.sellingPrice - cost) / r.sellingPrice) * 100
        : 0
      return { ...r, cost, margin }
    }),
    [recipes, ingredients],
  )

  const categories = useMemo(
    () => [...new Set(recipes.map(r => r.category).filter(Boolean))].sort(),
    [recipes],
  )

  const handleSave = async (data: Omit<Recipe, 'id'>) => {
    if (editing) {
      await updateRecipe.mutateAsync({ ...data, id: editing.id })
    } else {
      await createRecipe.mutateAsync(data)
    }
    setEditing(null)
    setAdding(false)
  }

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  if (recLoading || ingLoading) return (
    <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
  )

  const isMutating = createRecipe.isPending || updateRecipe.isPending

  return (
    <>
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Recetas</h2>
          <p className="text-[#9ca3af] text-sm mt-0.5">
            {recipes.length} receta{recipes.length !== 1 ? 's' : ''} ·{' '}
            {categories.length} categoría{categories.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus size={15} /> Nueva receta
        </Button>
      </div>

      {/* Sin recetas */}
      {recipes.length === 0 && (
        <Card className="p-10 flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-teal/10 rounded-2xl">
            <ChefHat size={40} className="text-teal" />
          </div>
          <p className="text-white font-bold text-lg">Sin recetas aún</p>
          <p className="text-[#9ca3af] text-sm">Agrega tus platos para calcular costos y márgenes.</p>
          <Button onClick={() => setAdding(true)}>
            <Plus size={15} /> Crear primera receta
          </Button>
        </Card>
      )}

      {/* Lista por categoría */}
      {categories.length > 0 && categories.map(cat => {
        const catRecipes = recipeWithCost.filter(r => r.category === cat)
        return (
          <div key={cat}>
            <p className="text-[#9ca3af] text-xs font-bold uppercase tracking-widest mb-3 px-1">
              {cat || 'Sin categoría'}
            </p>
            <div className="space-y-2">
              {catRecipes.map(r => (
                <Card key={r.id} className="overflow-hidden">
                  {/* Fila principal */}
                  <div className="flex items-center gap-4 p-4">
                    <div className="p-2.5 bg-teal/10 rounded-xl shrink-0">
                      <ChefHat size={18} className="text-teal" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[#4b5563] text-xs">
                          {r.ingredients.length} ingrediente{r.ingredients.length !== 1 ? 's' : ''}
                        </span>
                        {r.ingredients.length > 0 && (
                          <>
                            <span className="text-[#2A2F42]">·</span>
                            <span className="text-[#4b5563] text-xs">
                              Costo: {formatMoney(r.cost)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Margen */}
                      <div className="text-right hidden sm:block">
                        <p className="text-white font-bold">{formatMoney(r.sellingPrice)}</p>
                        <Badge variant={r.margin >= 30 ? 'success' : r.margin >= 0 ? 'warning' : 'danger'}>
                          {r.margin.toFixed(1)}% margen
                        </Badge>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleExpand(r.id)}
                          className="p-2 text-[#4b5563] hover:text-teal hover:bg-teal/10 rounded-xl transition-all"
                          title="Ver ingredientes"
                        >
                          {expanded.has(r.id) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                        <button
                          onClick={() => setEditing(r)}
                          className="p-2 text-[#4b5563] hover:text-teal hover:bg-teal/10 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => openConfirm(
                            'Eliminar receta',
                            `¿Eliminar "${r.name}"? Se perderán todos sus ingredientes.`,
                            () => deleteRecipe.mutate(r.id),
                          )}
                          className="p-2 text-[#4b5563] hover:text-negative hover:bg-negative/10 rounded-xl transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Detalle ingredientes */}
                  {expanded.has(r.id) && (
                    <div className="border-t border-[#2A2F42]">
                      {r.ingredients.length === 0 ? (
                        <p className="px-5 py-3 text-[#4b5563] text-sm italic">Sin ingredientes registrados.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[#0E1420] text-[#9ca3af] text-xs uppercase">
                              <th className="px-5 py-2 text-left font-semibold">Ingrediente</th>
                              <th className="px-5 py-2 text-right font-semibold">Cantidad</th>
                              <th className="px-5 py-2 text-right font-semibold">Costo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2A2F42]">
                            {r.ingredients.map(ri => {
                              const ing = ingredients.find(i => i.id === ri.ingredientId)
                              const rowCost = ing ? ing.cost * ri.amount : 0
                              return (
                                <tr key={ri.ingredientId} className="hover:bg-white/2">
                                  <td className="px-5 py-2.5 text-[#9ca3af]">
                                    {ing?.name ?? <span className="text-[#4b5563] italic">Ingrediente eliminado</span>}
                                  </td>
                                  <td className="px-5 py-2.5 text-right text-white font-mono">
                                    {ri.amount} {ing?.unit ?? ''}
                                  </td>
                                  <td className="px-5 py-2.5 text-right text-teal font-mono">
                                    {formatMoney(rowCost)}
                                  </td>
                                </tr>
                              )
                            })}
                            <tr className="bg-[#0E1420]">
                              <td colSpan={2} className="px-5 py-2 text-[#9ca3af] text-xs font-bold uppercase text-right">
                                Total costo
                              </td>
                              <td className="px-5 py-2 text-right font-extrabold text-white font-mono">
                                {formatMoney(r.cost)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {/* Recetas sin categoría */}
      {recipeWithCost.filter(r => !r.category).length > 0 && (
        <div>
          <p className="text-[#9ca3af] text-xs font-bold uppercase tracking-widest mb-3 px-1">Sin categoría</p>
          <div className="space-y-2">
            {recipeWithCost.filter(r => !r.category).map(r => (
              <Card key={r.id} className="p-4 flex items-center gap-4">
                <div className="p-2.5 bg-teal/10 rounded-xl shrink-0">
                  <ChefHat size={18} className="text-teal" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold">{r.name}</p>
                </div>
                <p className="text-white font-bold">{formatMoney(r.sellingPrice)}</p>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(r)} className="p-2 text-[#4b5563] hover:text-teal hover:bg-teal/10 rounded-xl transition-all">
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => openConfirm('Eliminar receta', `¿Eliminar "${r.name}"?`, () => deleteRecipe.mutate(r.id))}
                    className="p-2 text-[#4b5563] hover:text-negative hover:bg-negative/10 rounded-xl transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>

    {(adding || editing) && (
      <RecipeFormModal
        initial={editing ?? undefined}
        ingredients={ingredients}
        onSave={handleSave}
        onClose={() => { setAdding(false); setEditing(null) }}
        loading={isMutating}
      />
    )}
    </>
  )
}
