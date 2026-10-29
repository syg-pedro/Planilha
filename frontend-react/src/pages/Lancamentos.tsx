import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@heroui/react'
import { Carregando, Confirmar, Escolha, Falha, Janela, Painel } from '../components/Controles'
import { Indicadores } from '../components/Indicadores'
import { FiltrosFinanceiros } from '../components/FiltrosFinanceiros'
import { EditorLancamento } from '../features/lancamentos/EditorLancamento'
import { TabelaLancamentos } from '../features/lancamentos/TabelaLancamentos'
import { useFinanceiro, useResumo } from '../hooks/useFinanceiro'
import { useSessao } from '../hooks/useSessao'
import { useAlterarLancamento } from '../hooks/useAlterarLancamento'
import { api, consulta } from '../services/api'
import { intervaloMes, mesAtual } from '../services/formatacao'
import type { Filtros, FinanceEntry } from '../types'

type Pagina = {
  entries: FinanceEntry[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export default function Lancamentos() {
  const financeiro = useFinanceiro()
  const { sessao } = useSessao()
  const [parametros, definirParametros] = useSearchParams()
  const [filtros, definirFiltros] = useState<Filtros>(() => ({
    ...intervaloMes(mesAtual()),
    periodMode: financeiro.data?.settings.periodMode ?? 'due_date'
  }))
  const [pagina, definirPagina] = useState(0)
  const [ordem, definirOrdem] = useState('date_asc')
  const [selecionado, selecionar] = useState<FinanceEntry | null>(null)
  const [aberto, definirAberto] = useState(false)
  const [excluir, definirExcluir] = useState<FinanceEntry | null>(null)

  const lista = useQuery({
    queryKey: ['lab', sessao?.family.id, 'entries', filtros, pagina, ordem],
    queryFn: () => api<Pagina>(`/api/entries/page${consulta({ ...filtros, page: String(pagina), size: '25', sort: ordem })}`)
  })

  const resumo = useResumo(filtros)
  const atualizar = useAlterarLancamento(() => definirExcluir(null))

  useEffect(() => {
    const id = parametros.get('editar')
    if (parametros.has('novo')) {
      selecionar(null)
      definirAberto(true)
    } else if (id) {
      const registro = financeiro.data?.entries.find(item => item.id === id)
      if (registro) {
        selecionar(registro)
        definirAberto(true)
      }
    }
  }, [parametros, financeiro.data])

  const fechar = () => {
    definirAberto(false)
    selecionar(null)
    definirParametros({}, { replace: true })
  }

  const editar = (registro: FinanceEntry) => {
    selecionar(registro)
    definirAberto(true)
  }

  return (
    <>
      <div className="ff-page-title">
        <div>
          <h1>Lançamentos</h1>
          <p>Organize cada entrada e saída. Sem perder os detalhes.</p>
        </div>
        <Button onPress={() => { selecionar(null); definirAberto(true) }}>+ Novo lançamento</Button>
      </div>

      {resumo.data && (
        <Indicadores
          itens={[
            { titulo: 'Receitas', valor: resumo.data.totals.income, tipo: 'positivo' },
            { titulo: 'Despesas', valor: resumo.data.totals.expense, tipo: 'negativo' },
            { titulo: 'Saldo', valor: resumo.data.totals.net },
            { titulo: 'A pagar', valor: resumo.data.totals.pendingExpense }
          ]}
        />
      )}

      <Painel>
        <FiltrosFinanceiros
          filtros={filtros}
          alterar={valor => {
            definirFiltros(valor)
            definirPagina(0)
          }}
        />

        <div className="ff-list-header">
          <p className="ff-muted">{lista.data?.totalElements ?? 0} lançamentos encontrados</p>
          <Escolha
            titulo="Ordenar por"
            valor={ordem}
            alterar={valor => {
              definirOrdem(valor)
              definirPagina(0)
            }}
            opcoes={[
              { value: 'date_asc', label: 'Data: mais antiga' },
              { value: 'date_desc', label: 'Data: mais recente' },
              { value: 'amount_desc', label: 'Maior valor' }
            ]}
          />
        </div>

        {atualizar.isError && <Falha erro={atualizar.error} />}
        {resumo.isError && <Falha erro={resumo.error} />}

        {lista.isPending ? (
          <Carregando />
        ) : lista.isError ? (
          <Falha erro={lista.error} repetir={() => { void lista.refetch() }} />
        ) : (
          <TabelaLancamentos
            lancamentos={lista.data.entries}
            totalElementos={lista.data.totalElements}
            totalPaginas={lista.data.totalPages}
            paginaAtual={pagina}
            onMudarPagina={definirPagina}
            contas={financeiro.data?.accounts ?? []}
            categorias={financeiro.data?.categories ?? []}
            onAlternarSituacao={registro => atualizar.mutate({ registro })}
            onEditar={editar}
            onExcluir={definirExcluir}
            pendente={atualizar.isPending}
          />
        )}
      </Painel>

      <Janela
        titulo={selecionado ? 'Editar lançamento' : 'Novo lançamento'}
        aberta={aberto}
        fechar={fechar}
      >
        {aberto && <EditorLancamento key={selecionado?.id ?? 'novo'} lancamento={selecionado} fechar={fechar} />}
      </Janela>

      <Confirmar
        titulo="Excluir lançamento?"
        descricao={`“${excluir?.title ?? ''}” será removido. Esta ação não altera outros lançamentos.`}
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
