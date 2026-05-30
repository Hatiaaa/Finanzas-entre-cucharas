import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QK } from '@/lib/queryClient'
import type { Account, AccountType } from '@/types'

// ── Mappers ──────────────────────────────────────────────────────────────────

function fromDB(row: Record<string, unknown>): Account {
  return {
    id:             String(row.id),
    name:           String(row.name),
    type:           row.type as AccountType,
    initialBalance: Number(row.initial_balance),
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useAccounts() {
  return useQuery({
    queryKey: QK.accounts,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name')
      if (error) throw error
      return (data as Record<string, unknown>[]).map(fromDB)
    },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (account: Omit<Account, 'id'>) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{ name: account.name, initial_balance: account.initialBalance, type: account.type }])
        .select()
        .single()
      if (error) throw error
      return fromDB(data as Record<string, unknown>)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.accounts }),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (account: Account) => {
      const { error } = await supabase
        .from('accounts')
        .update({ name: account.name, initial_balance: account.initialBalance, type: account.type })
        .eq('id', account.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.accounts }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.accounts }),
  })
}
