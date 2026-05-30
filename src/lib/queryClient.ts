import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 5,  // 5 min — no refetch innecesario
      retry:                1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Query keys centralizados — evita strings sueltos en toda la app
export const QK = {
  transactions: ['transactions'] as const,
  accounts:     ['accounts']     as const,
  closings:     ['closings']     as const,
  categories:   ['categories']  as const,
  suppliers:    ['suppliers']   as const,
  ingredients:  ['ingredients'] as const,
  recipes:      ['recipes']     as const,
}
