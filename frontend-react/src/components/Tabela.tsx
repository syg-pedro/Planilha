import type { ReactNode } from 'react'
import { Table } from '@heroui/react'
import { Vazio } from './Controles'

export function Tabela<T extends { id: string }>({ titulo, colunas, registros }: {
  titulo: string; colunas: { id: string; titulo: string; conteudo: (registro: T) => ReactNode }[]; registros: T[]
}) {
  return <Table className="ff-table"><Table.ScrollContainer>
    <Table.Content aria-label={titulo}><Table.Header>{colunas.map((coluna, indice) =>
      <Table.Column key={coluna.id} id={coluna.id} isRowHeader={indice === 0}>{coluna.titulo}</Table.Column>
    )}</Table.Header><Table.Body renderEmptyState={() => <Vazio />}>
      {registros.map(registro => <Table.Row key={registro.id} id={registro.id}>
        {colunas.map(coluna => <Table.Cell key={coluna.id}>{coluna.conteudo(registro)}</Table.Cell>)}
      </Table.Row>)}
    </Table.Body></Table.Content>
  </Table.ScrollContainer></Table>
}
