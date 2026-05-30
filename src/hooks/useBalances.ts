import { useMemo } from 'react'
import type { Account, Transaction, AccountBalance } from '@/types'

/**
 * Calcula el saldo actual de cada cuenta sumando/restando
 * todas las transacciones sobre su balance inicial.
 * Es una función pura y determinista — sin estado externo.
 */
export function calculateBalances(
  accounts:     Account[],
  transactions: Transaction[],
): AccountBalance[] {
  const map = new Map<string, number>()

  for (const acc of accounts) {
    map.set(acc.id, isFinite(acc.initialBalance) ? acc.initialBalance : 0)
  }

  for (const tx of transactions) {
    const amount = Number(tx.amount)
    if (!isFinite(amount)) continue

    if (map.has(tx.accountId)) {
      const cur = map.get(tx.accountId)!
      if      (tx.type === 'Ingreso')       map.set(tx.accountId, cur + amount)
      else if (tx.type === 'Egreso')        map.set(tx.accountId, cur - amount)
      else if (tx.type === 'Transferencia') map.set(tx.accountId, cur - amount)
    }

    if (tx.type === 'Transferencia' && tx.toAccountId && map.has(tx.toAccountId)) {
      map.set(tx.toAccountId, map.get(tx.toAccountId)! + amount)
    }
  }

  return accounts.map(acc => ({ accountId: acc.id, balance: map.get(acc.id) ?? 0 }))
}

/**
 * Hook que memoiza los balances calculados.
 * Recalcula solo cuando cambian accounts o transactions.
 */
export function useBalances(
  accounts:     Account[],
  transactions: Transaction[],
): AccountBalance[] {
  return useMemo(
    () => calculateBalances(accounts, transactions),
    [accounts, transactions],
  )
}
