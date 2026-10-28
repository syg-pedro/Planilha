import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@heroui/react'
import { Carregando, Confirmar, Escolha, Falha, Janela, Painel } from '../components/Controles'
import { Tabela } from '../components/Tabela'
import { Indicadores } from '../components/Indicadores'
import { FiltrosFinanceiros } from '../components/FiltrosFinanceiros'
import { EditorLancamento } from '../features/lancamentos/EditorLancamento'
import { useFinanceiro, useResumo } from '../hooks/useFinanceiro'
import { useSessao } from '../hooks/useSessao'
import { useAlterarLancamento } from '../hooks/useAlterarLancamento'
import { api, consulta } from '../services/api'
import { dataCurta, dinheiro, intervaloMes, mesAtual } from '../services/formatacao'
import type { Filtros, FinanceEntry } from '../types'

type Pagina = { entries: FinanceEntry[]; page: number; size: number; totalElements: number; totalPages: number }

export default function Lancamentos() {
  const financeiro = useFinanceiro()
  const { sessao } = useSessao()
  const [parametros, definirParametros] = useSearchParams()
  const [filtros, definirFiltros] = useState<Filtros>(() => ({ ...intervaloMes(mesAtual()), periodMode: financeiro.data?.settings.periodMode ?? 'due_date' }))
  const [pagina, definirPagina] = useState(0)
  const [ordem, definirOrdem] = useState('date_asc')
  const [selecionado, selecionar] = useState<FinanceEntry | null>(null)
  const [aberto, definirAberto] = useState(false)
  const [excluir, definirExcluir] = useState<FinanceEntry | null>(null)
  const lista = useQuery({ queryKey: ['lab', sessao?.family.id, 'entries', filtros, pagina, ordem],
    queryFn: () => api<Pagina>(`/api/entries/page${consulta({ ...filtros, page: String(pagina), size: '25', sort: ordem })}`) })
  const resumo = useResumo(filtros)
  const atualizar = useAlterarLancamento(() => definirExcluir(null))
  useEffect(() => {
    const id = parametros.get('editar')
    if (parametros.has('novo')) { selecionar(null); definirAberto(true) }
    else if (id) {
      const registro = financeiro.data?.entries.find(item => item.id === id)
      if (registro) { selecionar(registro); definirAberto(true) }
    }
  }, [parametros, financeiro.data])
  const fechar = () => { definirAberto(false); selecionar(null); definirParametros({}, { replace: true }) }
  const editar = (registro: FinanceEntry) => { selecionar(registro); definirAberto(true) }
  return <><div className="ff-page-title"><div><h1>Lançamentos</h1><p>Organize cada entrada e saída. Sem perder os detalhes.</p></div>
    <Button onPress={() => { selecionar(null); definirAberto(true) }}>+ Novo lançamento</Button></div>
    {resumo.data && <Indicadores itens={[{ titulo: 'Receitas', valor: resumo.data.totals.income, tipo: 'positivo' },
      { titulo: 'Despesas', valor: resumo.data.totals.expense, tipo: 'negativo' }, { titulo: 'Saldo', valor: resumo.data.totals.net },
      { titulo: 'A pagar', valor: resumo.data.totals.pendingExpense }]} />}
    <Painel><FiltrosFinanceiros filtros={filtros} alterar={valor => { definirFiltros(valor); definirPagina(0) }} />
      <div className="ff-list-header"><p className="ff-muted">{lista.data?.totalElements ?? 0} lançamentos encontrados</p>
        <Escolha titulo="Ordenar por" valor={ordem} alterar={valor => { definirOrdem(valor); definirPagina(0) }} opcoes={[
          { value: 'date_asc', label: 'Data: mais antiga' }, { value: 'date_desc', label: 'Data: mais recente' }, { value: 'amount_desc', label: 'Maior valor' }]} /></div>
      {atualizar.isError && <Falha erro={atualizar.error} />}{resumo.isError && <Falha erro={resumo.error} />}
      {lista.isPending ? <Carregando /> : lista.isError ? <Falha erro={lista.error} repetir={() => { void lista.refetch() }} />
        : <Tabela titulo="Lançamentos financeiros" registros={lista.data.entries} colunas={[
          { id: 'title', titulo: 'Descrição', conteudo: item => <><strong>{item.title}</strong><p className="ff-muted">{financeiro.data?.categories.find(categoria => categoria.id === item.categoryId)?.name ?? 'Sem categoria'}{item.installmentTotal ? ` · ${item.installmentIndex}/${item.installmentTotal}` : ''}</p></> },
          { id: 'account', titulo: 'Conta', conteudo: item => financeiro.data?.accounts.find(conta => conta.id === item.accountId)?.name ?? 'Sem conta' },
          { id: 'date', titulo: 'Vencimento', conteudo: item => dataCurta(item.dueDate) },
          { id: 'amount', titulo: 'Valor', conteudo: item => <span className={`ff-number ${item.kind === 'income' ? 'ff-positive' : ''}`}>{item.kind === 'income' ? '+' : '−'} {dinheiro(item.amount)}{item.excludeFromCalc && <small className="ff-muted"> · Excluído dos totais</small>}</span> },
          { id: 'status', titulo: 'Situação', conteudo: item => <span className="ff-status">{item.status === 'paid' ? '✓ Pago / recebido' : item.status === 'review' ? '◇ Revisar' : '○ Pendente'}</span> },
          { id: 'actions', titulo: 'Ações', conteudo: item => <div className="ff-actions"><Button variant="tertiary" size="sm" isDisabled={atualizar.isPending} onPress={() => atualizar.mutate({ registro: item })}>{item.status === 'paid' ? 'Desfazer' : item.kind === 'income' ? 'Receber' : 'Pagar'}</Button>
            <Button variant="ghost" size="sm" onPress={() => editar(item)} aria-label={`Editar ${item.title}`}>Editar</Button><Button variant="ghost" size="sm" onPress={() => definirExcluir(item)} aria-label={`Excluir ${item.title}`}>Excluir</Button></div> }
        ]} />}
      {lista.data && <div className="ff-pagination"><span className="ff-muted">Página {pagina + 1} de {Math.max(1, lista.data.totalPages)}</span><div className="ff-actions">
        <Button size="sm" variant="outline" isDisabled={pagina === 0} onPress={() => definirPagina(valor => valor - 1)}>Anterior</Button>
        <Button size="sm" variant="outline" isDisabled={pagina + 1 >= lista.data.totalPages} onPress={() => definirPagina(valor => valor + 1)}>Próxima</Button></div></div>}
    </Painel><Janela titulo={selecionado ? 'Editar lançamento' : 'Novo lançamento'} aberta={aberto} fechar={fechar}>
      {aberto && <EditorLancamento key={selecionado?.id ?? 'novo'} lancamento={selecionado} fechar={fechar} />}
    </Janela><Confirmar titulo="Excluir lançamento?" descricao={`“${excluir?.title ?? ''}” será removido. Esta ação não altera outros lançamentos.`}
      aberta={!!excluir} fechar={() => definirExcluir(null)} confirmar={() => { if (excluir) atualizar.mutate({ registro: excluir, apagar: true }) }} pendente={atualizar.isPending} />
  </>
}
