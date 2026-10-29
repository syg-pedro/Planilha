import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@heroui/react'
import { Carregando, Confirmar, Falha, Janela } from '../components/Controles'
import { Indicadores } from '../components/Indicadores'
import { EditorLancamento } from '../features/lancamentos/EditorLancamento'
import { MatrizFiltros } from '../features/matriz/MatrizFiltros'
import { MatrizTabela } from '../features/matriz/MatrizTabela'
import { MatrizTotais } from '../features/matriz/MatrizTotais'
import { MatrizCelulaModal } from '../features/matriz/MatrizCelulaModal'
import { useFinanceiro } from '../hooks/useFinanceiro'
import { useSessao } from '../hooks/useSessao'
import { useAlterarLancamento } from '../hooks/useAlterarLancamento'
import { api, consulta } from '../services/api'
import { intervaloMes, mesAtual } from '../services/formatacao'
import type { FinanceEntry, Matriz } from '../types'

export default function Planilha() {
  const { sessao } = useSessao()
  const financeiro = useFinanceiro()
  const [inicio, definirInicio] = useState(mesAtual)
  const [quantidade, definirQuantidade] = useState('12')
  const [criterio, definirCriterio] = useState<'due_date' | 'competence'>(financeiro.data?.settings.periodMode ?? 'due_date')
  const [conta, definirConta] = useState('all')
  const [tipo, definirTipo] = useState('all')
  const [situacao, definirSituacao] = useState('all')
  const [busca, definirBusca] = useState('')
  const [celula, definirCelula] = useState<{ linha: Matriz['rows'][number]; mes: string } | null>(null)
  const [editor, definirEditor] = useState<{ registro: FinanceEntry | null; rascunho?: Partial<FinanceEntry> } | null>(null)
  const [excluir, definirExcluir] = useState<FinanceEntry | null>(null)

  const atualizar = useAlterarLancamento(() => {
    definirExcluir(null)
    definirCelula(null)
  })

  const filtros = {
    startMonth: inicio,
    count: quantidade,
    periodMode: criterio,
    accountId: conta === 'all' ? '' : conta,
    kind: tipo,
    status: situacao,
    search: busca
  }

  const dados = useQuery({
    queryKey: ['lab', sessao?.family.id, 'matrix', filtros],
    queryFn: () => api<Matriz>(`/api/reports/matrix${consulta(filtros)}`)
  })

  const abrirCelula = (linha: Matriz['rows'][number], mes: string) => {
    const itens = linha.cells[mes]?.entries ?? []
    if (itens.length) {
      definirCelula({ linha, mes })
      return
    }
    const dia = Math.min(linha.dueDays[0] ?? 1, Number(intervaloMes(mes).to.slice(8)))
    const data = `${mes}-${String(dia).padStart(2, '0')}`
    definirEditor({
      registro: null,
      rascunho: {
        title: linha.group === 'cards' ? '' : linha.title,
        kind: linha.kind,
        accountId: linha.account?.id ?? null,
        dueDate: data,
        competenceDate: data,
        excludeFromCalc: linha.group === 'excluded'
      }
    })
  }

  return (
    <>
      <div className="ff-page-title">
        <div>
          <h1>A casa toda, mês a mês.</h1>
          <p>Explore os meses e abra uma célula para cuidar dos lançamentos.</p>
        </div>
        <Button onPress={() => definirEditor({ registro: null })}>+ Novo lançamento</Button>
      </div>

      <MatrizFiltros
        inicio={inicio}
        definirInicio={definirInicio}
        quantidade={quantidade}
        definirQuantidade={definirQuantidade}
        criterio={criterio}
        definirCriterio={definirCriterio}
        conta={conta}
        definirConta={definirConta}
        tipo={tipo}
        definirTipo={definirTipo}
        situacao={situacao}
        definirSituacao={definirSituacao}
        busca={busca}
        definirBusca={definirBusca}
        contas={financeiro.data?.accounts ?? []}
      />

      {atualizar.isError && <Falha erro={atualizar.error} />}

      {dados.isPending ? (
        <Carregando />
      ) : dados.isError ? (
        <Falha erro={dados.error} repetir={() => { void dados.refetch() }} />
      ) : (
        <>
          <Indicadores
            itens={[
              { titulo: 'Receitas do intervalo', valor: dados.data.totals.income, tipo: 'positivo' },
              { titulo: 'Despesas do intervalo', valor: dados.data.totals.expense, tipo: 'negativo' },
              { titulo: 'Saldo previsto', valor: dados.data.totals.net },
              { titulo: 'A pagar', valor: dados.data.totals.pendingExpense }
            ]}
          />

          <MatrizTabela dados={dados.data} onAbrirCelula={abrirCelula} />

          <MatrizTotais dados={dados.data} />
        </>
      )}

      <MatrizCelulaModal
        celula={celula}
        onFechar={() => definirCelula(null)}
        onAlternarSituacao={registro => atualizar.mutate({ registro })}
        onEditar={registro => definirEditor({ registro })}
        onExcluir={registro => definirExcluir(registro)}
        pendente={atualizar.isPending}
      />

      <Janela
        titulo={editor?.registro ? 'Editar lançamento' : 'Novo lançamento'}
        aberta={!!editor}
        fechar={() => definirEditor(null)}
      >
        {editor && (
          <EditorLancamento
            lancamento={editor.registro}
            rascunho={editor.rascunho}
            fechar={() => definirEditor(null)}
          />
        )}
      </Janela>

      <Confirmar
        titulo="Excluir lançamento?"
        descricao={`“${excluir?.title ?? ''}” será removido.`}
        aberta={!!excluir}
        fechar={() => definirExcluir(null)}
        confirmar={() => {
          if (excluir) atualizar.mutate({ registro: excluir, apagar: true })
        }}
        pendente={atualizar.isPending}
      />
    </>
  )
}
