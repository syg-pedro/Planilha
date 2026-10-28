import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, consulta } from '../services/api'
import { useSessao } from './useSessao'
import type { BootstrapResponse, Filtros, Resumo } from '../types'

export function useFinanceiro() {
  const { sessao } = useSessao()
  return useQuery({ queryKey: ['lab', sessao?.family.id, 'bootstrap'],
    queryFn: () => api<BootstrapResponse>('/api/bootstrap'), enabled: !!sessao })
}

export function useResumo(filtros: Filtros) {
  const { sessao } = useSessao()
  return useQuery({ queryKey: ['lab', sessao?.family.id, 'summary', filtros],
    queryFn: () => api<Resumo>(`/api/reports/summary${consulta(filtros)}`), enabled: !!sessao })
}

export function useGravar<T>(caminho: string, metodo = 'POST') {
  const cache = useQueryClient()
  return useMutation({ mutationFn: (dados: T) => api(caminho, { method: metodo, body: dados }),
    onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['lab'] }) } })
}
