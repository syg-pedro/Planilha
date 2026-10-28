import { useState } from 'react'
import { Button } from '@heroui/react'
import { Carregando, Falha, Painel } from '../components/Controles'
import { Indicadores } from '../components/Indicadores'
import { FiltrosFinanceiros } from '../components/FiltrosFinanceiros'
import { Tabela } from '../components/Tabela'
import { useFinanceiro, useResumo } from '../hooks/useFinanceiro'
import { GraficoCategorias, GraficoFluxo } from '../features/painel/Grafico'
import { dinheiro, hoje } from '../services/formatacao'
import type { Filtros } from '../types'

export default function Relatorios() {
  const financeiro = useFinanceiro()
  const ano = hoje().slice(0, 4)
  const [filtros, definirFiltros] = useState<Filtros>({ from: `${ano}-01-01`, to: `${ano}-12-31`, periodMode: financeiro.data?.settings.periodMode ?? 'due_date' })
  const dados = useResumo(filtros)
  return <><div className="ff-page-title"><div><h1>Os números contam a história.</h1><p>Entenda como sua família recebe, gasta e se organiza.</p></div>
    <Button variant="outline" onPress={() => window.print()}>Imprimir relatório</Button></div>
    <Painel><FiltrosFinanceiros filtros={filtros} alterar={definirFiltros} prefixo="Relatórios: " /></Painel>
    {dados.isPending ? <Carregando /> : dados.isError ? <Falha erro={dados.error} repetir={() => { void dados.refetch() }} /> : <>
      <Indicadores itens={[{ titulo: 'Receitas', valor: dados.data.totals.income, tipo: 'positivo' }, { titulo: 'Despesas', valor: dados.data.totals.expense, tipo: 'negativo' },
        { titulo: 'Saldo', valor: dados.data.totals.net, detalhe: `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(dados.data.savingsRate)}% das receitas preservadas` },
        { titulo: 'Saldo realizado', valor: dados.data.totals.settledNet }]} />
      <div className="ff-grid ff-grid--equal"><Painel titulo="Entradas e saídas"><GraficoFluxo dados={dados.data.cashflow} /></Painel>
        <Painel titulo="Despesas por categoria"><GraficoCategorias dados={Object.entries(dados.data.categories).map(([id, valor]) => ({ id, valor,
          nome: financeiro.data?.categories.find(item => item.id === id)?.name ?? 'Sem categoria' })).sort((a, b) => b.valor - a.valor)} /></Painel></div>
      <Painel titulo="Por pessoa"><Tabela titulo="Receitas e despesas por titular" registros={dados.data.persons.map(item => ({ ...item, id: item.name }))} colunas={[
        { id: 'name', titulo: 'Titular', conteudo: item => <strong>{item.name || 'Sem titular'}</strong> },
        { id: 'income', titulo: 'Receitas', conteudo: item => <span className="ff-positive ff-number">{dinheiro(item.income)}</span> },
        { id: 'expense', titulo: 'Despesas', conteudo: item => <span className="ff-number">{dinheiro(item.expense)}</span> },
        { id: 'net', titulo: 'Saldo', conteudo: item => <strong className="ff-number">{dinheiro(item.net)}</strong> }
      ]} /></Painel><p className="ff-note">Contas de benefício e lançamentos marcados como excluídos não entram nos indicadores de caixa.</p>
    </>}
  </>
}
