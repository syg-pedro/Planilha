import { Button } from '@heroui/react'
import { Tabela } from '../../components/Tabela'
import { dataCurta, dinheiro } from '../../services/formatacao'
import type { Account, Category, FinanceEntry } from '../../types'

interface Props {
  lancamentos: FinanceEntry[]
  totalElementos: number
  totalPaginas: number
  paginaAtual: number
  onMudarPagina: (novaPagina: number) => void
  contas: Account[]
  categorias: Category[]
  onAlternarSituacao: (registro: FinanceEntry) => void
  onEditar: (registro: FinanceEntry) => void
  onExcluir: (registro: FinanceEntry) => void
  pendente: boolean
}

export function TabelaLancamentos({
  lancamentos,
  totalElementos: _totalElementos,
  totalPaginas,
  paginaAtual,
  onMudarPagina,
  contas,
  categorias,
  onAlternarSituacao,
  onEditar,
  onExcluir,
  pendente
}: Props) {
  return (
    <>
      <Tabela
        titulo="Lançamentos financeiros"
        registros={lancamentos}
        colunas={[
          {
            id: 'title',
            titulo: 'Descrição',
            conteudo: item => (
              <>
                <strong>{item.title}</strong>
                <p className="ff-muted">
                  {categorias.find(categoria => categoria.id === item.categoryId)?.name ?? 'Sem categoria'}
                  {item.installmentTotal ? ` · ${item.installmentIndex}/${item.installmentTotal}` : ''}
                </p>
              </>
            )
          },
          {
            id: 'account',
            titulo: 'Conta',
            conteudo: item => contas.find(conta => conta.id === item.accountId)?.name ?? 'Sem conta'
          },
          {
            id: 'date',
            titulo: 'Vencimento',
            conteudo: item => dataCurta(item.dueDate)
          },
          {
            id: 'amount',
            titulo: 'Valor',
            conteudo: item => (
              <span className={`ff-number ${item.kind === 'income' ? 'ff-positive' : ''}`}>
                {item.kind === 'income' ? '+' : '−'} {dinheiro(item.amount)}
                {item.excludeFromCalc && <small className="ff-muted"> · Excluído dos totais</small>}
              </span>
            )
          },
          {
            id: 'status',
            titulo: 'Situação',
            conteudo: item => (
              <span className="ff-status">
                {item.status === 'paid' ? '✓ Pago / recebido' : item.status === 'review' ? '◇ Revisar' : '○ Pendente'}
              </span>
            )
          },
          {
            id: 'actions',
            titulo: 'Ações',
            conteudo: item => (
              <div className="ff-actions">
                <Button
                  variant="tertiary"
                  size="sm"
                  isDisabled={pendente}
                  onPress={() => onAlternarSituacao(item)}
                >
                  {item.status === 'paid' ? 'Desfazer' : item.kind === 'income' ? 'Receber' : 'Pagar'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => onEditar(item)}
                  aria-label={`Editar ${item.title}`}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => onExcluir(item)}
                  aria-label={`Excluir ${item.title}`}
                >
                  Excluir
                </Button>
              </div>
            )
          }
        ]}
      />

      <div className="ff-pagination">
        <span className="ff-muted">
          Página {paginaAtual + 1} de {Math.max(1, totalPaginas)}
        </span>
        <div className="ff-actions">
          <Button
            size="sm"
            variant="outline"
            isDisabled={paginaAtual === 0}
            onPress={() => onMudarPagina(paginaAtual - 1)}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            isDisabled={paginaAtual + 1 >= totalPaginas}
            onPress={() => onMudarPagina(paginaAtual + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </>
  )
}

