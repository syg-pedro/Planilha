import { useState } from 'react'
import { Button } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { Carregando, Escolha, Falha, Painel } from '../../components/Controles'
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
  const [texto, definirTexto] = useState('')
  const [nomeArquivo, definirNomeArquivo] = useState('')
  const [previa, definirPrevia] = useState<PreviaCsv | null>(null)
  const [lendo, definirLendo] = useState(false)
  const [importando, definirImportando] = useState(false)
  const [sucesso, definirSucesso] = useState<string | null>(null)
  const [falha, definirFalha] = useState<Error | string | null>(null)

  const processarTexto = async (conteudo: string, nome?: string) => {
    if (!conteudo.trim()) return
    definirTexto(conteudo)
    if (nome) definirNomeArquivo(nome)
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

  const selecionarArquivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const file = evento.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result as string
      void processarTexto(content, file.name)
    }
    reader.readAsText(file)
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
      definirNomeArquivo('')
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Escolha
          titulo="Vincular à conta"
          valor={contaId}
          alterar={definirContaId}
          opcoes={[
            { value: '', label: 'Sem conta vinculada' },
            ...contas.map(item => ({ value: item.id, label: `${item.name} (${item.owner || 'Titular'})` }))
          ]}
        />

        <label
          htmlFor="arquivo-csv-input"
          style={{
            border: '2px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>📄</div>
          <strong>{nomeArquivo || 'Selecione ou arraste um arquivo .csv de extrato bancário'}</strong>
          <input
            id="arquivo-csv-input"
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={selecionarArquivo}
          />
        </label>

        {lendo && <Carregando />}
        {falha && <Falha erro={falha} />}

        {sucesso && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(0, 245, 155, 0.12)',
              border: '1px solid rgba(0, 245, 155, 0.35)',
              color: '#00f59b'
            }}
          >
            ✓ {sucesso}
          </div>
        )}

        {previa && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <p className="ff-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
              <strong>{previa.rows.length}</strong> transações identificadas no extrato.
            </p>

            {previa.warnings?.length > 0 && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 184, 0, 0.1)',
                  border: '1px solid rgba(255, 184, 0, 0.3)',
                  fontSize: '0.85rem'
                }}
              >
                <strong style={{ color: '#ffb800' }}>Avisos:</strong>
                <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                  {previa.warnings.map(aviso => (
                    <li key={aviso}>{aviso}</li>
                  ))}
                </ul>
              </div>
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

            <div className="ff-actions" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button
                variant="outline"
                isDisabled={importando}
                onPress={() => {
                  definirTexto('')
                  definirNomeArquivo('')
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
