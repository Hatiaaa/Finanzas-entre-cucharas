import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QK } from '@/lib/queryClient'
import type { Transaction, TransactionType } from '@/types'

// ── Mapper ────────────────────────────────────────────────────────────────────

function fromDB(row: Record<string, unknown>): Transaction {
  return {
    id:            String(row.id),
    date:          String(row.date),
    type:          row.type as TransactionType,
    category:      String(row.category   ?? ''),
    subcategory:   String(row.subcategory ?? ''),
    amount:        Number(row.amount),
    accountId:     String(row.account_id),
    toAccountId:   row.to_account_id ? String(row.to_account_id) : undefined,
    quantity:      row.quantity  != null ? Number(row.quantity)  : undefined,
    description:   row.description != null ? String(row.description) : undefined,
    hasAttachment: Boolean(row.has_attachment),
    client:        row.client != null ? String(row.client) : undefined,
  }
}

// ── Query ─────────────────────────────────────────────────────────────────────

export function useTransactions() {
  return useQuery({
    queryKey: QK.transactions,
    queryFn:  async () => {
      // Paginación para traer todos los registros sin límite de 1000
      let all: Record<string, unknown>[] = []
      let from = 0
      const step = 1000

      while (true) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          // ⚠️ El segundo criterio (id) es OBLIGATORIO: ordenar solo por `date`
          // deja indeterminado el orden de filas con la misma marca de tiempo
          // (un cierre crea decenas de filas con timestamp idéntico). Sin un
          // desempate único, la paginación con .range() duplica o salta filas
          // en el borde de cada página → el saldo mostrado se descuadra.
          .order('date', { ascending: false })
          .order('id',   { ascending: false })
          .range(from, from + step - 1)

        if (error) throw error
        if (!data || data.length === 0) break
        all = all.concat(data as Record<string, unknown>[])
        if (data.length < step) break
        from += step
      }

      return all.map(fromDB)
    },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

type CreateTxInput = Omit<Transaction, 'id'>

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tx: CreateTxInput) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          date:          tx.date,
          type:          tx.type,
          category:      tx.category,
          subcategory:   tx.subcategory,
          amount:        tx.amount,
          account_id:    tx.accountId,
          to_account_id: tx.toAccountId ?? null,
          quantity:      tx.quantity    ?? null,
          description:   tx.description ?? null,
          has_attachment: tx.hasAttachment,
          client:        tx.client ?? null,
        }])
        .select()
        .single()
      if (error) throw error
      return fromDB(data as Record<string, unknown>)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.transactions }),
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tx: Transaction) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          date:           tx.date,
          type:           tx.type,
          category:       tx.category,
          subcategory:    tx.subcategory,
          amount:         tx.amount,
          account_id:     tx.accountId,
          to_account_id:  tx.toAccountId ?? null,
          quantity:       tx.quantity    ?? null,
          description:    tx.description ?? null,
          has_attachment: tx.hasAttachment,
          client:         tx.client ?? null,
        })
        .eq('id', tx.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.transactions }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.transactions }),
  })
}
