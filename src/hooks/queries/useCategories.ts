import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QK } from '@/lib/queryClient'
import type { Category } from '@/types'

function fromDB(row: Record<string, unknown>): Category {
  return {
    id:            String(row.id),
    name:          String(row.name),
    type:          String(row.type ?? ''),
    subcategories: Array.isArray(row.subcategories)
      ? (row.subcategories as string[])
      : [],
  }
}

export function useCategories() {
  return useQuery({
    queryKey: QK.categories,
    queryFn:  async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (error) throw error
      return (data as Record<string, unknown>[]).map(fromDB)
    },
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cat: Omit<Category, 'id'>) => {
      const { error } = await supabase.from('categories').insert([cat])
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.categories }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cat: Category) => {
      const { error } = await supabase.from('categories').update(cat).eq('id', cat.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.categories }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.categories }),
  })
}
