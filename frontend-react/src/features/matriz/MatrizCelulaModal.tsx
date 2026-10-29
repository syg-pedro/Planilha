import { Button } from '@heroui/react'
import { Janela } from '../../components/Controles'
import { Tabela } from '../../components/Tabela'
import { dataCurta, dinheiro, mesNome } from '../../services/formatacao'
import type { FinanceEntry, Matriz } from '../../types'

interface Props {
  celula: { linha: Matriz['rows'][number]; mes: string } | null
  onFechar: () => void
  onAlternarSituacao: (registro: FinanceEntry) => void
  onEditar: (registro: FinanceEntry) => void
  onExcluir: (registro: FinanceEntry) => void
  pendente: boolean
}

export function MatrizCelulaModal({
  celula,
  onFechar,
  onAlternarSituacao,
  onEditar,
  onExcluir,
  pendente
}: Props) {
  const aberta = !!celula
  const titulo = celula ? `${celula.linha.title} · ${mesNome(celula.mes)}` : 'Lançamentos da célula'
  const lancamentos = celula ? (celula.linha.cells[celula.mes]?.entries ?? []) : []

  return (
    <Janela titulo={titulo} aberta={aberta} fechar={onFechar}>
      {celula && (
        <Tabela
          titulo="Lançamentos desta célula"
          registros={lancamentos}
          colunas={[
            { id: 'title', titulo: 'Descrição', conteudo: item => <strong>{item.title}</strong> },
            { id: 'date', titulo: 'Vencimento', conteudo: item => dataCurta(item.dueDate) },
            { id: 'amount', titulo: 'Valor', conteudo: item => dinheiro(item.amount) },
            {
              id: 'actions',
              titulo: 'Ações',
              conteudo: item => (
                <div className="ff-actions">
                  <Button
                    size="sm"
                    variant="tertiary"
                    isDisabled={pendente}
                    onPress={() => onAlternarSituacao(item)}
                  >
                    {item.status === 'paid' ? 'Desfazer' : item.kind === 'income' ? 'Receber' : 'Pagar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      onFechar()
                      onEditar(item)
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      onFechar()
                      onExcluir(item)
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              )
            }
          ]}
        />
      )}
    </Janela>
  )
}

