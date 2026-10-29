import { Painel } from '../../components/Controles'
import { Tabela } from '../../components/Tabela'
import { dinheiro, mesNome } from '../../services/formatacao'
import type { Matriz } from '../../types'

interface Props {
  dados: Matriz
}

export function MatrizTotais({ dados }: Props) {
  const registros = dados.months.map(mes => ({
    id: mes,
    ...dados.summaries[mes]
  }))

  return (
    <Painel titulo="Resumo dos meses">
      <Tabela
        titulo="Totais mensais da planilha"
        registros={registros}
        colunas={[
          { id: 'month', titulo: 'Mês', conteudo: item => mesNome(item.id) },
          { id: 'income', titulo: 'Receitas', conteudo: item => dinheiro(item.income) },
          { id: 'expense', titulo: 'Despesas', conteudo: item => dinheiro(item.expense) },
          { id: 'net', titulo: 'Saldo', conteudo: item => dinheiro(item.net) },
          { id: 'pending', titulo: 'A pagar', conteudo: item => dinheiro(item.pendingExpense) }
        ]}
      />
    </Painel>
  )
}

