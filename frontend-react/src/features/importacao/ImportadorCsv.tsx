import { useState } from 'react'
import { Button } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { Alerta, Carregando, Escolha, Falha, Painel, ZonaUpload } from '../../components/Controles'
import { Tabela } from '../../components/Tabela'
import { api } from '../../services/api'
import { dataCurta, dinheiro } from '../../services/formatacao'
import type { Account } from '../../types'

interface PreviaCsv {
  rows: Array<{
    title: string
    dueDate: string
    amount: number
    kind: string
    status: string
  }>
  warnings: string[]
  canImport: boolean
}

interface Props {
  familyId?: string
  contas: Account[]
}

export function ImportadorCsv({ familyId, contas }: Props) {
  const cache = useQueryClient()
  const [contaId, definirContaId] = useState('')
  const [arquivo, definirArquivo] = useState<File | null>(null)
  const [texto, definirTexto] = useState('')
  const [previa, definirPrevia] = useState<PreviaCsv | null>(null)
  const [lendo, definirLendo] = useState(false)
  const [importando, definirImportando] = useState(false)
  const [sucesso, definirSucesso] = useState<string | null>(null)
  const [falha, definirFalha] = useState<Error | string | null>(null)

  const processarTexto = async (conteudo: string, file: File) => {
    if (!conteudo.trim()) return
    definirTexto(conteudo)
    definirArquivo(file)
    definirSucesso(null)
    definirFalha(null)
    definirPrevia(null)
    definirLendo(true)

    try {
      const resultado = await api<PreviaCsv>('/api/import/csv/preview', {
        method: 'POST',
        body: JSON.stringify({
          accountId: contaId || null,
          csvContent: conteudo
        })
      })
      definirPrevia(resultado)
    } catch (err) {
      definirFalha(err instanceof Error ? err : String(err))
    } finally {
      definirLendo(false)
    }
  }

  const carregarArquivoCsv = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result as string
      void processarTexto(content, file)
    }
    reader.readAsText(file)
  }

  const selecionarArquivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const file = evento.target.files?.[0]
    if (!file) return
    carregarArquivoCsv(file)
  }

  const executarImportacao = async () => {
    if (!texto.trim()) return
    definirImportando(true)
    definirFalha(null)
    try {
      const resultado = await api<{ message: string; count: number }>('/api/import/csv', {
        method: 'POST',
        body: JSON.stringify({
          accountId: contaId || null,
          csvContent: texto
        })
      })
      definirSucesso(`Importação concluída! ${resultado.count} lançamentos foram criados no extrato.`)
      definirTexto('')
      definirArquivo(null)
      definirPrevia(null)
      await cache.invalidateQueries({ queryKey: ['lab', familyId] })
    } catch (err) {
      definirFalha(err instanceof Error ? err : String(err))
    } finally {
      definirImportando(false)
    }
  }

  return (
    <Painel
      titulo="Extrato Bancário ou de Cartão (.csv)"
      detalhe="Importe o extrato baixado da sua instituição financeira diretamente para a conta escolhida."
    >
      <div className="ff-form">
        <Escolha
          titulo="Vincular à conta"
          valor={contaId}
          alterar={definirContaId}
          opcoes={[
            { value: '', label: 'Sem conta vinculada' },
            ...contas.map(item => ({ value: item.id, label: `${item.name} (${item.owner || 'Titular'})` }))
          ]}
        />

        <ZonaUpload
          id="arquivo-csv-input"
          accept=".csv,text/csv"
          arquivo={arquivo}
          aoSelecionar={selecionarArquivo}
          onArquivoSolto={carregarArquivoCsv}
          titulo="Selecione ou arraste um arquivo .csv de extrato bancário"
          subtitulo="Extrato com colunas de data, valor e descrição"
          icone="📄"
        />

        {lendo && <Carregando />}
        {falha && <Falha erro={falha} />}
        {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}

        {previa && (
          <div className="ff-form">
            <p className="ff-muted" style={{ margin: 0 }}>
              <strong>{previa.rows.length}</strong> transações identificadas no extrato.
            </p>

            {previa.warnings?.length > 0 && (
              <Alerta tipo="aviso">
                <strong>Avisos:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {previa.warnings.map(aviso => (
                    <li key={aviso}>{aviso}</li>
                  ))}
                </ul>
              </Alerta>
            )}

            <Tabela
              titulo="Prévia das transações do extrato"
              registros={previa.rows.slice(0, 10).map((item, idx) => ({ ...item, id: String(idx) }))}
              colunas={[
                { id: 'title', titulo: 'Descrição', conteudo: item => <strong>{item.title}</strong> },
                { id: 'date', titulo: 'Data', conteudo: item => dataCurta(item.dueDate) },
                {
                  id: 'amount',
                  titulo: 'Valor',
                  conteudo: item => (
                    <span className={`ff-number ${item.kind === 'income' ? 'ff-positive' : ''}`}>
                      {item.kind === 'income' ? '+' : '−'} {dinheiro(item.amount)}
                    </span>
                  )
                },
                { id: 'status', titulo: 'Situação', conteudo: item => item.status === 'paid' ? 'Liquidado' : 'Pendente' }
              ]}
            />

            <div className="ff-actions ff-actions--end">
              <Button
                variant="outline"
                isDisabled={importando}
                onPress={() => {
                  definirTexto('')
                  definirArquivo(null)
                  definirPrevia(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                isDisabled={!previa.canImport || importando}
                onPress={executarImportacao}
              >
                {importando ? 'Importando extrato...' : 'Confirmar e importar extrato'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Painel>
  )
}
