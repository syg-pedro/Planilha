import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@heroui/react'
import { Campo, Carregando, Escolha, Falha, Janela, Painel, Confirmar } from '../components/Controles'
import { Indicadores } from '../components/Indicadores'
import { Tabela } from '../components/Tabela'
import { EditorLancamento } from '../features/lancamentos/EditorLancamento'
import { useFinanceiro } from '../hooks/useFinanceiro'
import { useSessao } from '../hooks/useSessao'
import { useAlterarLancamento } from '../hooks/useAlterarLancamento'
import { api, consulta } from '../services/api'
import { dataCurta, dinheiro, intervaloMes, mesAtual, mesNome, SITUACOES, TIPOS } from '../services/formatacao'
import type { FinanceEntry, Matriz } from '../types'

const grupos: Record<string, string> = { expenses: 'Despesas', cards: 'Cartões', income: 'Receitas', excluded: 'Fora dos totais' }

export default function Planilha() {
  const { sessao } = useSessao()
  const financeiro = useFinanceiro()
  const [inicio, definirInicio] = useState(mesAtual)
  const [quantidade, definirQuantidade] = useState('12')
  const [criterio, definirCriterio] = useState(financeiro.data?.settings.periodMode ?? 'due_date')
  const [conta, definirConta] = useState('all')
  const [tipo, definirTipo] = useState('all')
  const [situacao, definirSituacao] = useState('all')
  const [busca, definirBusca] = useState('')
  const [celula, definirCelula] = useState<{ linha: Matriz['rows'][number]; mes: string } | null>(null)
  const [editor, definirEditor] = useState<{ registro: FinanceEntry | null; rascunho?: Partial<FinanceEntry> } | null>(null)
  const [excluir, definirExcluir] = useState<FinanceEntry | null>(null)
  const atualizar = useAlterarLancamento(() => { definirExcluir(null); definirCelula(null) })
  const filtros = { startMonth: inicio, count: quantidade, periodMode: criterio, accountId: conta === 'all' ? '' : conta,
    kind: tipo, status: situacao, search: busca }
  const dados = useQuery({ queryKey: ['lab', sessao?.family.id, 'matrix', filtros],
    queryFn: () => api<Matriz>(`/api/reports/matrix${consulta(filtros)}`) })
  const abrirCelula = (linha: Matriz['rows'][number], mes: string) => {
    const itens = linha.cells[mes]?.entries ?? []
    if (itens.length) { definirCelula({ linha, mes }); return }
    const dia = Math.min(linha.dueDays[0] ?? 1, Number(intervaloMes(mes).to.slice(8)))
    const data = `${mes}-${String(dia).padStart(2, '0')}`
    definirEditor({ registro: null, rascunho: { title: linha.group === 'cards' ? '' : linha.title, kind: linha.kind,
      accountId: linha.account?.id ?? null, dueDate: data, competenceDate: data, excludeFromCalc: linha.group === 'excluded' } })
  }
  return <><div className="ff-page-title"><div><h1>A casa toda, mês a mês.</h1><p>Explore os meses e abra uma célula para cuidar dos lançamentos.</p></div>
    <Button onPress={() => definirEditor({ registro: null })}>+ Novo lançamento</Button></div>
    <Painel><div className="ff-filters"><Campo titulo="A partir de" type="month" min="1900-01" max="2199-12" value={inicio} onChange={evento => { if (evento.target.value) definirInicio(evento.target.value) }} />
      <Escolha titulo="Meses na planilha" valor={quantidade} alterar={definirQuantidade} opcoes={['1', '3', '6', '12', '18', '24'].map(value => ({ value, label: `${value} meses` }))} />
      <Escolha titulo="Critério da planilha" valor={criterio} alterar={valor => definirCriterio(valor as 'due_date' | 'competence')}
        opcoes={[{ value: 'due_date', label: 'Vencimento' }, { value: 'competence', label: 'Competência' }]} />
      <Escolha titulo="Conta da planilha" valor={conta} alterar={definirConta} opcoes={[{ value: 'all', label: 'Todas as contas' }, { value: 'none', label: 'Sem conta' },
        ...(financeiro.data?.accounts ?? []).map(item => ({ value: item.id, label: item.name }))]} />
      <Escolha titulo="Tipo na planilha" valor={tipo} alterar={definirTipo} opcoes={[{ value: 'all', label: 'Receitas e despesas' }, ...TIPOS]} />
      <Escolha titulo="Situação na planilha" valor={situacao} alterar={definirSituacao} opcoes={[{ value: 'all', label: 'Todas' }, ...SITUACOES]} />
      <Campo titulo="Buscar na planilha" type="search" value={busca} onChange={evento => definirBusca(evento.target.value)} />
    </div></Painel>{atualizar.isError && <Falha erro={atualizar.error} />}
    {dados.isPending ? <Carregando /> : dados.isError ? <Falha erro={dados.error} repetir={() => { void dados.refetch() }} /> : <>
      <Indicadores itens={[{ titulo: 'Receitas do intervalo', valor: dados.data.totals.income, tipo: 'positivo' },
        { titulo: 'Despesas do intervalo', valor: dados.data.totals.expense, tipo: 'negativo' },
        { titulo: 'Saldo previsto', valor: dados.data.totals.net }, { titulo: 'A pagar', valor: dados.data.totals.pendingExpense }]} />
      <Painel titulo="Sua planilha" detalhe="— sem registros · ○ pendente · ◐ parcial · ✓ quitado · ◇ revisar">
        <Tabela titulo="Planilha financeira mensal" registros={dados.data.rows} colunas={[
          { id: 'title', titulo: 'Compromisso', conteudo: linha => <div className="ff-matrix-title"><strong>{linha.title}</strong>
            <p className="ff-muted">{grupos[linha.group]}{linha.account ? ` · ${linha.account.owner || linha.account.name}` : ''}</p></div> },
          ...dados.data.months.map(mes => ({ id: mes, titulo: mesNome(mes), conteudo: (linha: Matriz['rows'][number]) => {
            const valor = linha.cells[mes]
            const simbolo = valor?.status === 'paid' ? '✓' : valor?.status === 'partial' ? '◐' : valor?.status === 'review' ? '◇' : '○'
            return <Button variant="ghost" size="sm" className="ff-matrix-cell" onPress={() => abrirCelula(linha, mes)}
              aria-label={`${linha.title}, ${mesNome(mes)}: ${valor?.entries.length ? dinheiro(valor.amount) : 'adicionar lançamento'}`}>
              {valor?.entries.length ? <><span aria-hidden="true">{simbolo}</span> {dinheiro(valor.amount)}</> : <span className="ff-muted">— <span aria-hidden="true">+</span></span>}
            </Button>
          } })),
          { id: 'total', titulo: 'Total', conteudo: linha => <strong className="ff-number">{dinheiro(linha.total)}</strong> }
        ]} />
      </Painel><Painel titulo="Resumo dos meses"><Tabela titulo="Totais mensais da planilha" registros={dados.data.months.map(mes => ({ id: mes, ...dados.data.summaries[mes] }))} colunas={[
        { id: 'month', titulo: 'Mês', conteudo: item => mesNome(item.id) }, { id: 'income', titulo: 'Receitas', conteudo: item => dinheiro(item.income) },
        { id: 'expense', titulo: 'Despesas', conteudo: item => dinheiro(item.expense) }, { id: 'net', titulo: 'Saldo', conteudo: item => dinheiro(item.net) },
        { id: 'pending', titulo: 'A pagar', conteudo: item => dinheiro(item.pendingExpense) }
      ]} /></Painel>
    </>}
    <Janela titulo={celula ? `${celula.linha.title} · ${mesNome(celula.mes)}` : 'Lançamentos da célula'} aberta={!!celula} fechar={() => definirCelula(null)}>
      {celula && <Tabela titulo="Lançamentos desta célula" registros={celula.linha.cells[celula.mes]?.entries ?? []} colunas={[
        { id: 'title', titulo: 'Descrição', conteudo: item => <strong>{item.title}</strong> }, { id: 'date', titulo: 'Vencimento', conteudo: item => dataCurta(item.dueDate) },
        { id: 'amount', titulo: 'Valor', conteudo: item => dinheiro(item.amount) }, { id: 'actions', titulo: 'Ações', conteudo: item => <div className="ff-actions">
          <Button size="sm" variant="tertiary" isDisabled={atualizar.isPending} onPress={() => atualizar.mutate({ registro: item })}>{item.status === 'paid' ? 'Desfazer' : item.kind === 'income' ? 'Receber' : 'Pagar'}</Button>
          <Button size="sm" variant="ghost" onPress={() => { definirCelula(null); definirEditor({ registro: item }) }}>Editar</Button>
          <Button size="sm" variant="ghost" onPress={() => { definirCelula(null); definirExcluir(item) }}>Excluir</Button></div> }
      ]} />}
    </Janela><Janela titulo={editor?.registro ? 'Editar lançamento' : 'Novo lançamento'} aberta={!!editor} fechar={() => definirEditor(null)}>
      {editor && <EditorLancamento lancamento={editor.registro} rascunho={editor.rascunho} fechar={() => definirEditor(null)} />}
    </Janela><Confirmar titulo="Excluir lançamento?" descricao={`“${excluir?.title ?? ''}” será removido.`} aberta={!!excluir} fechar={() => definirExcluir(null)}
      confirmar={() => { if (excluir) atualizar.mutate({ registro: excluir, apagar: true }) }} pendente={atualizar.isPending} />
  </>
}
