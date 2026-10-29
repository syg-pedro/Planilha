import { Campo, Escolha, Painel } from '../../components/Controles'
import { SITUACOES, TIPOS } from '../../services/formatacao'
import type { Account } from '../../types'

interface Props {
  inicio: string
  definirInicio: (valor: string) => void
  quantidade: string
  definirQuantidade: (valor: string) => void
  criterio: 'due_date' | 'competence'
  definirCriterio: (valor: 'due_date' | 'competence') => void
  conta: string
  definirConta: (valor: string) => void
  tipo: string
  definirTipo: (valor: string) => void
  situacao: string
  definirSituacao: (valor: string) => void
  busca: string
  definirBusca: (valor: string) => void
  contas: Account[]
}

export function MatrizFiltros({
  inicio,
  definirInicio,
  quantidade,
  definirQuantidade,
  criterio,
  definirCriterio,
  conta,
  definirConta,
  tipo,
  definirTipo,
  situacao,
  definirSituacao,
  busca,
  definirBusca,
  contas
}: Props) {
  return (
    <Painel>
      <div className="ff-filters">
        <Campo
          titulo="A partir de"
          type="month"
          min="1900-01"
          max="2199-12"
          value={inicio}
          onChange={evento => {
            if (evento.target.value) definirInicio(evento.target.value)
          }}
        />
        <Escolha
          titulo="Meses na planilha"
          valor={quantidade}
          alterar={definirQuantidade}
          opcoes={['1', '3', '6', '12', '18', '24'].map(value => ({ value, label: `${value} meses` }))}
        />
        <Escolha
          titulo="Critério da planilha"
          valor={criterio}
          alterar={valor => definirCriterio(valor as 'due_date' | 'competence')}
          opcoes={[
            { value: 'due_date', label: 'Vencimento' },
            { value: 'competence', label: 'Competência' }
          ]}
        />
        <Escolha
          titulo="Conta da planilha"
          valor={conta}
          alterar={definirConta}
          opcoes={[
            { value: 'all', label: 'Todas as contas' },
            { value: 'none', label: 'Sem conta' },
            ...contas.map(item => ({ value: item.id, label: item.name }))
          ]}
        />
        <Escolha
          titulo="Tipo na planilha"
          valor={tipo}
          alterar={definirTipo}
          opcoes={[{ value: 'all', label: 'Receitas e despesas' }, ...TIPOS]}
        />
        <Escolha
          titulo="Situação na planilha"
          valor={situacao}
          alterar={definirSituacao}
          opcoes={[{ value: 'all', label: 'Todas' }, ...SITUACOES]}
        />
        <Campo
          titulo="Buscar na planilha"
          type="search"
          value={busca}
          onChange={evento => definirBusca(evento.target.value)}
        />
      </div>
    </Painel>
  )
}

