import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QK } from '@/lib/queryClient'
import type { Ingredient, UnitType } from '@/types'

function fromDB(row: Record<string, unknown>): Ingredient {
  return {
    id:           String(row.id),
    name:         String(row.name),
    unit:         row.unit as UnitType,
    cost:         Number(row.cost),
    supplierId:   row.supplier_id != null ? String(row.supplier_id) : undefined,
    minStock:     Number(row.min_stock),
    currentStock: Number(row.current_stock),
  }
}

export function useIngredients() {
  return useQuery({
    queryKey: QK.ingredients,
    queryFn:  async () => {
      const { data, error } = await supabase.from('ingredients').select('*').order('name')
      if (error) throw error
      return (data as Record<string, unknown>[]).map(fromDB)
    },
  })
}

export function useCreateIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ing: Omit<Ingredient, 'id'>) => {
      const { error } = await supabase.from('ingredients').insert([{
        name:          ing.name,
        unit:          ing.unit,
        cost:          ing.cost,
        supplier_id:   ing.supplierId ?? null,
        min_stock:     ing.minStock,
        current_stock: ing.currentStock,
      }])
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.ingredients }),
  })
}

export function useUpdateIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ing: Ingredient) => {
      const { error } = await supabase.from('ingredients').update({
        name:          ing.name,
        unit:          ing.unit,
        cost:          ing.cost,
        supplier_id:   ing.supplierId ?? null,
        min_stock:     ing.minStock,
        current_stock: ing.currentStock,
      }).eq('id', ing.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.ingredients }),
  })
}

export function useDeleteIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ingredients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.ingredients }),
  })
}
