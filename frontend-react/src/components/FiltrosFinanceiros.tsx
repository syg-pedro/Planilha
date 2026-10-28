import { Campo, Escolha } from './Controles'
import { useFinanceiro } from '../hooks/useFinanceiro'
import { SITUACOES, TIPOS } from '../services/formatacao'
import type { Filtros } from '../types'

export function FiltrosFinanceiros({ filtros, alterar, prefixo = '' }: { filtros: Filtros; alterar: (filtros: Filtros) => void; prefixo?: string }) {
  const financeiro = useFinanceiro()
  const mudar = (campo: keyof Filtros, valor: string) => alterar({ ...filtros, [campo]: valor })
  return <div className="ff-filters"><Campo titulo={`${prefixo}Buscar descrição`} type="search" value={filtros.search ?? ''} onChange={evento => mudar('search', evento.target.value)} />
    <Campo titulo={`${prefixo}De`} type="date" value={filtros.from ?? ''} onChange={evento => mudar('from', evento.target.value)} />
    <Campo titulo={`${prefixo}Até`} type="date" value={filtros.to ?? ''} onChange={evento => mudar('to', evento.target.value)} />
    <Escolha titulo={`${prefixo}Critério`} valor={filtros.periodMode ?? 'due_date'} alterar={valor => mudar('periodMode', valor)}
      opcoes={[{ value: 'due_date', label: 'Vencimento' }, { value: 'competence', label: 'Competência' }]} />
    <Escolha titulo={`${prefixo}Conta`} valor={filtros.accountId || 'all'} alterar={valor => mudar('accountId', valor === 'all' ? '' : valor)}
      opcoes={[{ value: 'all', label: 'Todas as contas' }, { value: 'none', label: 'Sem conta' }, ...(financeiro.data?.accounts ?? []).map(item => ({ value: item.id, label: item.name }))]} />
    <Escolha titulo={`${prefixo}Categoria`} valor={filtros.categoryId || 'all'} alterar={valor => mudar('categoryId', valor === 'all' ? '' : valor)}
      opcoes={[{ value: 'all', label: 'Todas as categorias' }, { value: 'none', label: 'Sem categoria' }, ...(financeiro.data?.categories ?? []).map(item => ({ value: item.id, label: item.name }))]} />
    <Escolha titulo={`${prefixo}Tipo`} valor={filtros.kind ?? 'all'} alterar={valor => mudar('kind', valor)} opcoes={[{ value: 'all', label: 'Receitas e despesas' }, ...TIPOS]} />
    <Escolha titulo={`${prefixo}Situação`} valor={filtros.status ?? 'all'} alterar={valor => mudar('status', valor)} opcoes={[{ value: 'all', label: 'Todas' }, ...SITUACOES]} />
  </div>
}
