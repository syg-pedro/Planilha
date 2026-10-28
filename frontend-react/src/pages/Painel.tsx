import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@heroui/react'
import { Campo, Carregando, Falha, Painel, Vazio } from '../components/Controles'
import { Indicadores } from '../components/Indicadores'
import { useFinanceiro, useResumo } from '../hooks/useFinanceiro'
import { dataCurta, dinheiro, intervaloMes, mesAtual, mesNome } from '../services/formatacao'
import { ResumoGrafico } from '../features/painel/ResumoGrafico'

export default function VisaoGeral() {
  const [mes, definirMes] = useState(mesAtual)
  const financeiro = useFinanceiro()
  const resumo = useResumo({ ...intervaloMes(mes), periodMode: financeiro.data?.settings.periodMode })
  if (financeiro.isPending || resumo.isPending) return <Carregando />
  if (resumo.isError) return <Falha erro={resumo.error} repetir={() => { void resumo.refetch() }} />
  const dados = resumo.data
  const proximos = [...(financeiro.data?.entries ?? [])].filter(item => item.status !== 'paid' && item.dueDate.startsWith(mes))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5)
  const widgets = financeiro.data?.settings.dashboardConfig.visibleWidgets ?? []
  return <><div className="ff-page-title"><div><p className="ff-eyebrow">SEU PANORAMA</p><h1>Um olhar para o seu mês.</h1>
    <p>Veja o que entrou, o que saiu e o que está por vir.</p></div>
    <div className="ff-actions"><Campo titulo="Mês do panorama" type="month" value={mes} onChange={evento => { if (evento.target.value) definirMes(evento.target.value) }} />
      <Link className="ff-action-link" to="/lancamentos?novo=1">+ Novo lançamento</Link></div></div>
    {widgets.includes('kpis') && <Indicadores itens={[{ titulo: 'Saldo previsto', valor: dados.totals.net, detalhe: mesNome(mes) },
      { titulo: 'Receitas', valor: dados.totals.income, tipo: 'positivo', detalhe: `${dados.totals.incomeCount} lançamentos` },
      { titulo: 'Despesas', valor: dados.totals.expense, tipo: 'negativo', detalhe: `${dados.totals.expenseCount} lançamentos` },
      { titulo: 'A pagar', valor: dados.totals.pendingExpense, detalhe: 'Compromissos ainda pendentes' }]} />}
    <div className="ff-grid"><div>{widgets.includes('cashflow') && <ResumoGrafico tipo="fluxo" />}
      {widgets.includes('category') && <ResumoGrafico tipo="categorias" />}
      {widgets.includes('projection') && <ResumoGrafico tipo="projecao" />}
      {widgets.includes('heatmap') && <ResumoGrafico tipo="heatmap" />}</div><div>
      {widgets.includes('upcoming') && <Painel titulo="Compromissos do mês" acao={<Link to="/lancamentos">Ver todos ↗</Link>}>
        {proximos.length ? <ul className="ff-upcoming">{proximos.map(item => <li key={item.id}><div className="ff-upcoming__date">{dataCurta(item.dueDate)}</div>
          <div><Link to={`/lancamentos?editar=${item.id}`}>{item.title}</Link><p className="ff-muted">{item.kind === 'income' ? 'A receber' : 'A pagar'}</p></div>
          <strong className="ff-number">{dinheiro(item.amount)}</strong></li>)}</ul> : <Vazio titulo="Tudo em dia neste mês" />}
      </Painel>}
      {widgets.includes('cards') && <ResumoGrafico tipo="cartoes" />}
      {widgets.includes('limits') && <ResumoGrafico tipo="limites" />}
    </div></div>
    {widgets.includes('kpis') && <Painel titulo="Como está o mês" detalhe="Pagamentos, recebimentos e quinzenas, sem contas de benefício ou itens excluídos">
      <div className="ff-grid ff-grid--equal"><div><p className="ff-muted">Saldo realizado</p><strong className="ff-big-number">{dinheiro(dados.totals.settledNet)}</strong>
        <p className="ff-muted">{dinheiro(dados.totals.received)} recebidos · {dinheiro(dados.totals.paid)} pagos</p></div>
        <div className="ff-cycles">{dados.paymentCycles.map(ciclo => <div key={ciclo.id}><p>{ciclo.startDay} a {ciclo.endDay}</p>
          <strong className="ff-number">{dinheiro(ciclo.pendingTotal)}</strong><span className="ff-muted">{ciclo.pendingCount} despesas pendentes</span></div>)}</div></div>
      <div className="ff-actions ff-actions--end"><Button variant="tertiary" onPress={() => window.print()}>Imprimir panorama</Button><Link to="/planejamento">Abrir planejamento anual ↗</Link></div>
    </Painel>}
  </>
}
