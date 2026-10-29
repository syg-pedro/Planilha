import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Campo, Carregando, Falha, Painel, Rotulo } from '../components/Controles'
import { Indicadores } from '../components/Indicadores'
import { FiltrosFinanceiros } from '../components/FiltrosFinanceiros'
import { Tabela } from '../components/Tabela'
import { useSessao } from '../hooks/useSessao'
import { useFinanceiro } from '../hooks/useFinanceiro'
import { api, consulta } from '../services/api'
import { dinheiro, hoje } from '../services/formatacao'
import type { Filtros, Planejamento as DadosPlanejamento } from '../types'

export default function Planejamento() {
  const { sessao } = useSessao()
  const financeiro = useFinanceiro()
  const [ano, definirAno] = useState(hoje().slice(0, 4))
  const [filtros, definirFiltros] = useState<Filtros>({ periodMode: financeiro.data?.settings.periodMode ?? 'due_date' })
  const dados = useQuery({ queryKey: ['lab', sessao?.family.id, 'annual-plan', ano, filtros],
    queryFn: () => api<DadosPlanejamento>(`/api/reports/annual-plan${consulta({ ...filtros, year: ano })}`), enabled: /^\d{4}$/.test(ano) })
  return <><div className="ff-page-title"><div><h1>Um plano para o ano.</h1><p>Veja os meses com registros e antecipe os próximos passos.</p></div>
    <Campo titulo="Ano do planejamento" type="number" min="1" max="9999" value={ano} onChange={evento => definirAno(evento.target.value)} /></div>
    <Painel><FiltrosFinanceiros filtros={filtros} alterar={definirFiltros} prefixo="Planejamento: " /></Painel>
    {dados.isPending ? <Carregando /> : dados.isError ? <Falha erro={dados.error} repetir={() => { void dados.refetch() }} /> : <>
      <Indicadores itens={[{ titulo: 'Receitas cadastradas', valor: dados.data.totals.totalIncome, tipo: 'positivo' },
        { titulo: 'Despesas cadastradas', valor: dados.data.totals.totalExpense, tipo: 'negativo' },
        { titulo: 'Saldo cadastrado', valor: dados.data.totals.totalNet },
        { titulo: 'Saldo anual estimado', valor: dados.data.totals.projectedNet, detalhe: `Média dos ${dados.data.totals.recordedMonths} meses com registros` }]} />
      <Painel titulo="Mês a mês" detalhe={`${dados.data.totals.riskMonths} meses com despesas acima das receitas`}>
        <Tabela titulo="Planejamento dos doze meses" registros={dados.data.rows.map(item => ({ ...item, id: item.month }))} colunas={[
          { id: 'month', titulo: 'Mês', conteudo: item => <span><strong>{item.label}</strong>{item.isCurrentMonth && <> · <Rotulo tipo="info">Atual</Rotulo></>}</span> },
          { id: 'income', titulo: 'Receitas', conteudo: item => item.hasRecords ? <span className="ff-number ff-positive">{dinheiro(item.income)}</span> : '—' },
          { id: 'expense', titulo: 'Despesas', conteudo: item => item.hasRecords ? <span className="ff-number">{dinheiro(item.expense)}</span> : '—' },
          { id: 'net', titulo: 'Saldo', conteudo: item => item.hasRecords ? <strong className={`ff-number ${item.net < 0 ? 'ff-negative' : 'ff-positive'}`}>{dinheiro(item.net)}</strong> : 'Sem registros' },
          { id: 'accumulated', titulo: 'Acumulado', conteudo: item => <span className="ff-number">{dinheiro(item.accumulated)}</span> }
        ]} /><p className="ff-note">A estimativa repete a média dos meses com registros para os meses sem dados. Ela não representa saldo bancário ou garantia de renda.</p>
      </Painel></>}
  </>
}
