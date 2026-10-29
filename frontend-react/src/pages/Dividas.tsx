import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Carregando, Falha, Painel, Vazio } from '../components/Controles'
import { Indicadores } from '../components/Indicadores'
import { FiltrosFinanceiros } from '../components/FiltrosFinanceiros'
import { GrupoDividaCard } from '../features/dividas/GrupoDividaCard'
import { useSessao } from '../hooks/useSessao'
import { useFinanceiro } from '../hooks/useFinanceiro'
import { useAlterarLancamento } from '../hooks/useAlterarLancamento'
import { api, consulta } from '../services/api'
import type { Dividas as DadosDividas, Filtros } from '../types'

export default function Dividas() {
  const { sessao } = useSessao()
  const financeiro = useFinanceiro()
  const [filtros, definirFiltros] = useState<Filtros>({
    periodMode: financeiro.data?.settings.periodMode ?? 'due_date'
  })

  const dados = useQuery({
    queryKey: ['lab', sessao?.family.id, 'debts', filtros],
    queryFn: () => api<DadosDividas>(`/api/reports/debts${consulta(filtros)}`)
  })

  const atualizar = useAlterarLancamento()

  return (
    <>
      <div className="ff-page-title">
        <div>
          <h1>Parcelas sob controle.</h1>
          <p>Acompanhe os compromissos até a última parcela.</p>
        </div>
        <Link to="/lancamentos?novo=1">+ Novo lançamento</Link>
      </div>

      <Painel>
        <FiltrosFinanceiros filtros={filtros} alterar={definirFiltros} prefixo="Dívidas: " />
      </Painel>

      {atualizar.isError && <Falha erro={atualizar.error} />}

      {dados.isPending ? (
        <Carregando />
      ) : dados.isError ? (
        <Falha erro={dados.error} repetir={() => { void dados.refetch() }} />
      ) : (
        <>
          <Indicadores
            itens={[
              { titulo: 'Saldo pendente', valor: dados.data.summary.totalPending },
              { titulo: 'Total dos grupos ativos', valor: dados.data.summary.totalAmount },
              {
                titulo: 'Neste mês',
                valor: dados.data.summary.thisMonth,
                detalhe: `${dados.data.summary.paidCount} de ${dados.data.summary.totalCount} parcelas cadastradas pagas`
              }
            ]}
          />

          {!dados.data.groups.length ? (
            <Painel>
              <Vazio titulo="Nenhuma dívida parcelada pendente">
                Identifique número e total de parcelas no lançamento para acompanhá-lo aqui.
              </Vazio>
            </Painel>
          ) : (
            dados.data.groups.map(grupo => (
              <GrupoDividaCard
                key={grupo.key}
                grupo={grupo}
                onAlternarSituacao={registro => atualizar.mutate({ registro })}
                pendente={atualizar.isPending}
              />
            ))
          )}

          <p className="ff-note">
            Os grupos consideram apenas as parcelas cadastradas. Benefícios, itens excluídos dos totais e receitas parceladas permanecem visíveis aqui.
          </p>
        </>
      )}
    </>
  )
}
