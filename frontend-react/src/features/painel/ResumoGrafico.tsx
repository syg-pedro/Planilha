import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Campo, Carregando, Escolha, Falha, Painel } from '../../components/Controles'
import { useFinanceiro, useResumo } from '../../hooks/useFinanceiro'
import { dinheiro, intervaloMes, mesAtual, mesNome } from '../../services/formatacao'
import { GraficoCategorias, GraficoFluxo } from './Grafico'
import { Tabela } from '../../components/Tabela'
import { Vazio } from '../../components/Controles'
import type { Resumo } from '../../types'

type Tipo = 'fluxo' | 'categorias' | 'projecao' | 'cartoes' | 'limites' | 'heatmap'
const titulos: Record<Tipo, string> = { fluxo: 'Fluxo de caixa', categorias: 'Para onde vai seu dinheiro',
  projecao: 'Evolução do saldo previsto', cartoes: 'Seus cartões', limites: 'Limites e compromissos', heatmap: 'Mapa de despesas' }

function MapaDespesas({ valores, mes }: { valores: Record<string, number>; mes: string }) {
  const meses = [...new Set(Object.keys(valores).map(data => data.slice(0, 7)))].sort()
  if (!meses.length) meses.push(mes)
  const maximo = Math.max(1, ...Object.values(valores))
  return <>{meses.map(periodo => <div key={periodo}><h3>{mesNome(periodo)}</h3><ol className="ff-heatmap" aria-label={`Despesas por vencimento em ${mesNome(periodo)}`}>
    {Array.from({ length: Number(intervaloMes(periodo).to.slice(8)) }, (_, indice) => {
      const dia = `${periodo}-${String(indice + 1).padStart(2, '0')}`
      const valor = valores[dia]
      return <li key={dia} aria-label={`${dia}: ${valor === undefined ? 'sem despesas' : dinheiro(valor)}`}
        style={valor === undefined ? undefined : { backgroundColor: `color-mix(in srgb, var(--ff-positive) ${Math.max(8, valor / maximo * 30)}%, var(--ff-surface))` }}>
        <span>{indice + 1}</span><strong>{valor === undefined ? '—' : dinheiro(valor)}</strong></li>
    })}
  </ol></div>)}</>
}

function Cartoes({ dados, limites }: { dados: Resumo; limites: boolean }) {
  return dados.cards.length ? <ul className="ff-card-list">{dados.cards.map(item => <li key={item.accountId}>
    <div><strong>{item.name}</strong><Link to="/contas" aria-label={`Ver cartão ${item.name}`}>↗</Link></div>
    <p className="ff-muted">{limites ? 'Disponível' : 'Despesas do período'}</p><strong className="ff-number">
      {limites && item.available == null ? 'Limite não informado' : dinheiro(limites ? item.available : item.expense)}</strong>
    <p className="ff-muted">Comprometido em todas as parcelas futuras: {dinheiro(item.globalCommitted)}</p>
    {item.limitTotal != null && <p className="ff-muted">Limite total: {dinheiro(item.limitTotal)}</p>}
  </li>)}</ul> : <Vazio titulo="Nenhum cartão cadastrado"><Link to="/contas">Adicione seu primeiro cartão.</Link></Vazio>
}

export function ResumoGrafico({ tipo }: { tipo: Tipo }) {
  const [mes, definirMes] = useState(mesAtual)
  const [conta, definirConta] = useState('all')
  const financeiro = useFinanceiro()
  const resumo = useResumo({ ...intervaloMes(mes), accountId: conta === 'all' ? undefined : conta,
    periodMode: financeiro.data?.settings.periodMode })
  const titulo = titulos[tipo]
  return <Painel titulo={titulo} detalhe="Filtros exclusivos deste gráfico">
    <div className="ff-filters"><Campo titulo={`Período: ${titulo}`} type="month" value={mes} onChange={evento => { if (evento.target.value) definirMes(evento.target.value) }} />
      <Escolha titulo={`Conta: ${titulo}`} valor={conta} alterar={definirConta} opcoes={[{ value: 'all', label: 'Todas as contas' },
        ...(financeiro.data?.accounts ?? []).map(item => ({ value: item.id, label: item.name }))]} /></div>
    {resumo.isPending ? <Carregando /> : resumo.isError ? <Falha erro={resumo.error} repetir={() => { void resumo.refetch() }} />
      : tipo === 'fluxo' ? <GraficoFluxo dados={resumo.data.cashflow} /> : tipo === 'categorias' ? <GraficoCategorias dados={Object.entries(resumo.data.categories)
        .map(([id, valor]) => ({ id, valor, nome: financeiro.data?.categories.find(item => item.id === id)?.name ?? 'Sem categoria' }))
        .sort((a, b) => b.valor - a.valor)} /> : tipo === 'projecao' ? <Tabela titulo="Saldo previsto acumulado" registros={resumo.data.projection.map(item => ({ ...item, id: item.month }))}
          colunas={[{ id: 'month', titulo: 'Mês', conteudo: item => mesNome(item.month) },
            { id: 'balance', titulo: 'Saldo acumulado', conteudo: item => <strong className="ff-number">{dinheiro(item.balance)}</strong> }]} />
          : tipo === 'heatmap' ? <MapaDespesas valores={resumo.data.dailyExpenses} mes={mes} /> : <Cartoes dados={resumo.data} limites={tipo === 'limites'} />}
  </Painel>
}
