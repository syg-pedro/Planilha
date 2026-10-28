import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { CAMPOS_LANCAMENTO, camposEditaveis } from '../services/formatacao'
import type { FinanceEntry } from '../types'

export function useAlterarLancamento(concluir?: () => void) {
  const cache = useQueryClient()
  return useMutation({ mutationFn: ({ registro, apagar }: { registro: FinanceEntry; apagar?: boolean }) => api(`/api/entries/${registro.id}`,
    apagar ? { method: 'DELETE' } : { method: 'PUT', body: { ...camposEditaveis(registro, CAMPOS_LANCAMENTO), status: registro.status === 'paid' ? 'pending' : 'paid' } }),
  onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['lab'] }); concluir?.() } })
}
