import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QK } from '@/lib/queryClient'
import type { DailyClosing } from '@/types'

function fromDB(row: Record<string, unknown>): DailyClosing {
  return {
    id:             String(row.id),
    date:           String(row.date),
    accountId:      String(row.account_id),
    systemBalance:  Number(row.system_balance),
    physicalAmount: Number(row.physical_amount),
    difference:     Number(row.difference),
    notes:          row.notes != null ? String(row.notes) : undefined,
  }
}

export function useClosings() {
  return useQuery({
    queryKey: QK.closings,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('daily_closings')
        .select('*')
        .order('date', { ascending: false })
      if (error) throw error
      return (data as Record<string, unknown>[]).map(fromDB)
    },
  })
}

export function useDeleteClosing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('daily_closings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.closings }),
  })
}
