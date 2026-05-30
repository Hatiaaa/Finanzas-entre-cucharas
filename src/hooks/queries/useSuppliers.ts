import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QK } from '@/lib/queryClient'
import type { Supplier } from '@/types'

function fromDB(row: Record<string, unknown>): Supplier {
  return { id: String(row.id), name: String(row.name) }
}

export function useSuppliers() {
  return useQuery({
    queryKey: QK.suppliers,
    queryFn:  async () => {
      const { data, error } = await supabase.from('suppliers').select('*').order('name')
      if (error) throw error
      return (data as Record<string, unknown>[]).map(fromDB)
    },
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id'>) => {
      const { error } = await supabase.from('suppliers').insert([supplier])
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.suppliers }),
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (supplier: Supplier) => {
      const { error } = await supabase.from('suppliers').update(supplier).eq('id', supplier.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.suppliers }),
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.suppliers }),
  })
}
