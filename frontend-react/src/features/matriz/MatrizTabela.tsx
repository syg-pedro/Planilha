import { Button } from '@heroui/react'
import { Painel } from '../../components/Controles'
import { Tabela } from '../../components/Tabela'
import { dinheiro, mesNome } from '../../services/formatacao'
import type { Matriz } from '../../types'

const GRUPOS: Record<string, string> = {
  expenses: 'Despesas',
  cards: 'Cartões',
  income: 'Receitas',
  excluded: 'Fora dos totais'
}

interface Props {
  dados: Matriz
  onAbrirCelula: (linha: Matriz['rows'][number], mes: string) => void
}

export function MatrizTabela({ dados, onAbrirCelula }: Props) {
  return (
    <Painel titulo="Sua planilha" detalhe="— sem registros · ○ pendente · ◐ parcial · ✓ quitado · ◇ revisar">
      <Tabela
        titulo="Planilha financeira mensal"
        registros={dados.rows}
        colunas={[
          {
            id: 'title',
            titulo: 'Compromisso',
            conteudo: linha => (
              <div className="ff-matrix-title">
                <strong>{linha.title}</strong>
                <p className="ff-muted">
                  {GRUPOS[linha.group]}
                  {linha.account ? ` · ${linha.account.owner || linha.account.name}` : ''}
                </p>
              </div>
            )
          },
          ...dados.months.map(mes => ({
            id: mes,
            titulo: mesNome(mes),
            conteudo: (linha: Matriz['rows'][number]) => {
              const valor = linha.cells[mes]
              const simbolo = valor?.status === 'paid' ? '✓' : valor?.status === 'partial' ? '◐' : valor?.status === 'review' ? '◇' : '○'
              const statusClass = valor?.status ? `ff-matrix-cell--${valor.status}` : ''
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`ff-matrix-cell ${statusClass}`}
                  onPress={() => onAbrirCelula(linha, mes)}
                  aria-label={`${linha.title}, ${mesNome(mes)}: ${valor?.entries.length ? dinheiro(valor.amount) : 'adicionar lançamento'}`}
                >
                  {valor?.entries.length ? (
                    <>
                      <span aria-hidden="true">{simbolo}</span> {dinheiro(valor.amount)}
                    </>
                  ) : (
                    <span className="ff-muted">— <span aria-hidden="true">+</span></span>
                  )}
                </Button>
              )
            }
          })),
          {
            id: 'total',
            titulo: 'Total',
            conteudo: linha => <strong className="ff-number">{dinheiro(linha.total)}</strong>
          }
        ]}
      />
    </Painel>
  )
}

