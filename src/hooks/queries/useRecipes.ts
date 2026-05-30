import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QK } from '@/lib/queryClient'
import type { Recipe } from '@/types'

function fromDB(row: Record<string, unknown>): Recipe {
  const ingredients = Array.isArray(row.recipe_ingredients)
    ? (row.recipe_ingredients as Record<string, unknown>[]).map(ri => ({
        ingredientId: String(ri.ingredient_id),
        amount:       Number(ri.amount),
      }))
    : []

  return {
    id:           String(row.id),
    name:         String(row.name),
    category:     String(row.category ?? ''),
    sellingPrice: Number(row.selling_price),
    ingredients,
  }
}

export function useRecipes() {
  return useQuery({
    queryKey: QK.recipes,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*)')
        .order('name')
      if (error) throw error
      return (data as Record<string, unknown>[]).map(fromDB)
    },
  })
}

export function useCreateRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (recipe: Omit<Recipe, 'id'>) => {
      const { data: newRecipe, error: rErr } = await supabase
        .from('recipes')
        .insert([{ name: recipe.name, selling_price: recipe.sellingPrice, category: recipe.category }])
        .select()
        .single()
      if (rErr) throw rErr

      const row = newRecipe as Record<string, unknown>
      if (recipe.ingredients.length > 0) {
        const { error: riErr } = await supabase.from('recipe_ingredients').insert(
          recipe.ingredients.map(ri => ({
            recipe_id:     row.id,
            ingredient_id: ri.ingredientId,
            amount:        ri.amount,
          }))
        )
        if (riErr) throw riErr
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.recipes }),
  })
}

export function useDeleteRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.recipes }),
  })
}
