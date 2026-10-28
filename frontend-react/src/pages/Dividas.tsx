import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@heroui/react'
import { Carregando, Falha, Painel, Vazio } from '../components/Controles'
import { Indicadores } from '../components/Indicadores'
import { FiltrosFinanceiros } from '../components/FiltrosFinanceiros'
import { Tabela } from '../components/Tabela'
import { useSessao } from '../hooks/useSessao'
import { useFinanceiro } from '../hooks/useFinanceiro'
import { useAlterarLancamento } from '../hooks/useAlterarLancamento'
import { api, consulta } from '../services/api'
import { dataCurta, dinheiro } from '../services/formatacao'
import type { Dividas as DadosDividas, Filtros } from '../types'

export default function Dividas() {
  const { sessao } = useSessao()
  const financeiro = useFinanceiro()
  const [filtros, definirFiltros] = useState<Filtros>({ periodMode: financeiro.data?.settings.periodMode ?? 'due_date' })
  const dados = useQuery({ queryKey: ['lab', sessao?.family.id, 'debts', filtros], queryFn: () => api<DadosDividas>(`/api/reports/debts${consulta(filtros)}`) })
  const atualizar = useAlterarLancamento()
  return <><div className="ff-page-title"><div><h1>Parcelas sob controle.</h1><p>Acompanhe os compromissos até a última parcela.</p></div><Link to="/lancamentos?novo=1">+ Novo lançamento</Link></div>
    <Painel><FiltrosFinanceiros filtros={filtros} alterar={definirFiltros} prefixo="Dívidas: " /></Painel>
    {atualizar.isError && <Falha erro={atualizar.error} />}
    {dados.isPending ? <Carregando /> : dados.isError ? <Falha erro={dados.error} repetir={() => { void dados.refetch() }} /> : <>
      <Indicadores itens={[{ titulo: 'Saldo pendente', valor: dados.data.summary.totalPending }, { titulo: 'Total dos grupos ativos', valor: dados.data.summary.totalAmount },
        { titulo: 'Neste mês', valor: dados.data.summary.thisMonth, detalhe: `${dados.data.summary.paidCount} de ${dados.data.summary.totalCount} parcelas cadastradas pagas` }]} />
      {!dados.data.groups.length ? <Painel><Vazio titulo="Nenhuma dívida parcelada pendente">Identifique número e total de parcelas no lançamento para acompanhá-lo aqui.</Vazio></Painel>
        : dados.data.groups.map(grupo => <Painel key={grupo.key}><details className="ff-debt"><summary><span><strong>{grupo.title}</strong><span className="ff-muted">{grupo.accountName} · {grupo.paidCount}/{grupo.totalCount} pagas</span></span>
          <span className="ff-number">{dinheiro(grupo.pendingAmount)} <span aria-hidden="true">⌄</span></span></summary>
          <Tabela titulo={`Parcelas de ${grupo.title}`} registros={grupo.entries} colunas={[
            { id: 'installment', titulo: 'Parcela', conteudo: item => <strong>{item.installmentIndex}/{item.installmentTotal}</strong> },
            { id: 'date', titulo: 'Vencimento', conteudo: item => dataCurta(item.dueDate) },
            { id: 'amount', titulo: 'Valor', conteudo: item => dinheiro(item.amount) },
            { id: 'status', titulo: 'Situação', conteudo: item => item.status === 'paid' ? 'Pago / recebido' : item.status === 'review' ? 'Revisar' : 'Pendente' },
            { id: 'actions', titulo: 'Ações', conteudo: item => <div className="ff-actions"><Button size="sm" variant="tertiary" isDisabled={atualizar.isPending} onPress={() => atualizar.mutate({ registro: item })}>{item.status === 'paid' ? 'Desfazer' : item.kind === 'income' ? 'Receber' : 'Pagar'}</Button>
              <Link to={`/lancamentos?editar=${item.id}`}>Editar</Link></div> }
          ]} /></details></Painel>)}
      <p className="ff-note">Os grupos consideram apenas as parcelas cadastradas. Benefícios, itens excluídos dos totais e receitas parceladas permanecem visíveis aqui.</p>
    </>}
  </>
}
