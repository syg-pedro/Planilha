import { dinheiro } from '../../services/formatacao'
import { Vazio } from '../../components/Controles'

export function GraficoFluxo({ dados }: { dados: { month: string; income: number; expense: number }[] }) {
  if (!dados.length) return <Vazio titulo="Sem movimentação neste período" />
  const maximo = Math.max(1, ...dados.flatMap(item => [item.income, item.expense]))
  return <figure className="ff-chart"><figcaption className="ff-chart__legend"><span>↗ Receitas</span><span>↘ Despesas</span></figcaption>
    <div className="ff-chart__rows">{dados.map(item => <div key={item.month} className="ff-chart__row">
      <span>{item.month.split('-').reverse().join('/')}</span><div>
        <div className="ff-chart__track"><div className="ff-chart__bar ff-chart__bar--income" style={{ width: `${item.income / maximo * 100}%` }} /></div>
        <div className="ff-chart__track"><div className="ff-chart__bar ff-chart__bar--expense" style={{ width: `${item.expense / maximo * 100}%` }} /></div>
      </div><div className="ff-chart__values"><span className="ff-positive ff-number">{dinheiro(item.income)}</span>
        <span className="ff-number">{dinheiro(item.expense)}</span></div>
    </div>)}</div>
  </figure>
}

export function GraficoCategorias({ dados }: { dados: { id: string; nome: string; valor: number }[] }) {
  if (!dados.length) return <Vazio titulo="Nenhuma despesa no período" />
  const maximo = Math.max(1, ...dados.map(item => item.valor))
  return <ul className="ff-categories">{dados.map(item => <li key={item.id}>
    <div><span>{item.nome}</span><strong className="ff-number">{dinheiro(item.valor)}</strong></div>
    <div className="ff-chart__track"><div className="ff-chart__bar ff-chart__bar--income" style={{ width: `${item.valor / maximo * 100}%` }} /></div>
  </li>)}</ul>
}
