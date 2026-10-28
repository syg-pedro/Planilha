import { dinheiro } from '../services/formatacao'

export function Indicadores({ itens }: { itens: { titulo: string; valor: number; detalhe?: string; tipo?: 'positivo' | 'negativo' }[] }) {
  return <dl className="ff-kpis">{itens.map(item => <div key={item.titulo}>
    <dt>{item.titulo}</dt><dd className={`ff-number ${item.tipo === 'positivo' ? 'ff-positive' : item.tipo === 'negativo' ? 'ff-negative' : ''}`}>
      {dinheiro(item.valor)}</dd>{item.detalhe && <p>{item.detalhe}</p>}
  </div>)}</dl>
}
