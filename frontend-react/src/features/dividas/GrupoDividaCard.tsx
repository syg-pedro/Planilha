import { Link } from 'react-router-dom'
import { Button } from '@heroui/react'
import { Painel, Rotulo } from '../../components/Controles'
import { Tabela } from '../../components/Tabela'
import { dataCurta, dinheiro } from '../../services/formatacao'
import type { Dividas, FinanceEntry } from '../../types'

interface Props {
  grupo: Dividas['groups'][number]
  onAlternarSituacao: (registro: FinanceEntry) => void
  pendente: boolean
}

export function GrupoDividaCard({ grupo, onAlternarSituacao, pendente }: Props) {
  return (
    <Painel key={grupo.key}>
      <details className="ff-debt">
        <summary>
          <span>
            <strong>{grupo.title}</strong>
            <span className="ff-muted">
              {grupo.accountName} · {grupo.paidCount}/{grupo.totalCount} pagas
            </span>
          </span>
          <span className="ff-number">
            {dinheiro(grupo.pendingAmount)} <span aria-hidden="true">⌄</span>
          </span>
        </summary>

        <Tabela
          titulo={`Parcelas de ${grupo.title}`}
          registros={grupo.entries}
          colunas={[
            {
              id: 'installment',
              titulo: 'Parcela',
              conteudo: item => <strong>{item.installmentIndex}/{item.installmentTotal}</strong>
            },
            {
              id: 'date',
              titulo: 'Vencimento',
              conteudo: item => dataCurta(item.dueDate)
            },
            {
              id: 'amount',
              titulo: 'Valor',
              conteudo: item => dinheiro(item.amount)
            },
            {
              id: 'status',
              titulo: 'Situação',
              conteudo: item => (
                <Rotulo tipo={item.status === 'paid' ? 'sucesso' : item.status === 'review' ? 'aviso' : 'neutro'}>
                  {item.status === 'paid' ? '✓ Pago / recebido' : item.status === 'review' ? '◇ Revisar' : '○ Pendente'}
                </Rotulo>
              )
            },
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
                  <Link to={`/lancamentos?editar=${item.id}`}>Editar</Link>
                </div>
              )
            }
          ]}
        />
      </details>
    </Painel>
  )
}

