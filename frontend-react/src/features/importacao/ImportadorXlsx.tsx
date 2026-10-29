import { useState } from 'react'
import { Button } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { Alerta, Carregando, Falha, Painel, ZonaUpload } from '../../components/Controles'
import { Tabela } from '../../components/Tabela'
import { api } from '../../services/api'
import { dataCurta, dinheiro } from '../../services/formatacao'
import { criarModelo, lerPlanilha } from './planilha'
import type { OnboardingImportPayload, OnboardingImportPreview } from '../../types'

interface Props {
  familyId?: string
  responsavel: boolean
}

export function ImportadorXlsx({ familyId, responsavel }: Props) {
  const cache = useQueryClient()
  const [arquivo, definirArquivo] = useState<File | null>(null)
  const [lendo, definirLendo] = useState(false)
  const [errosLeitura, definirErrosLeitura] = useState<string[]>([])
  const [payload, definirPayload] = useState<OnboardingImportPayload | null>(null)
  const [previa, definirPrevia] = useState<OnboardingImportPreview | null>(null)
  const [importando, definirImportando] = useState(false)
  const [sucesso, definirSucesso] = useState<string | null>(null)
  const [falha, definirFalha] = useState<Error | string | null>(null)

  const baixarModelo = async () => {
    try {
      const buffer = await criarModelo()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'modelo-planilha.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      definirFalha(err instanceof Error ? err : String(err))
    }
  }

  const processarArquivo = async (file: File) => {
    definirArquivo(file)
    definirSucesso(null)
    definirFalha(null)
    definirErrosLeitura([])
    definirPrevia(null)
    definirPayload(null)
    definirLendo(true)

    try {
      const resultado = await lerPlanilha(file)
      if (resultado.erros.length) {
        definirErrosLeitura(resultado.erros)
      } else if (resultado.payload) {
        definirPayload(resultado.payload)
        const preview = await api<OnboardingImportPreview>('/api/onboarding/import/preview', {
          method: 'POST',
          body: JSON.stringify(resultado.payload)
        })
        definirPrevia(preview)
      }
    } catch (err) {
      definirFalha(err instanceof Error ? err : String(err))
    } finally {
      definirLendo(false)
    }
  }

  const selecionarArquivo = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const file = evento.target.files?.[0]
    if (!file) return
    await processarArquivo(file)
  }

  const executarImportacao = async () => {
    if (!payload) return
    definirImportando(true)
    definirFalha(null)
    try {
      const resultado = await api<{ message: string; summary: OnboardingImportPreview }>('/api/onboarding/import', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      definirSucesso(
        `Importação concluída com sucesso! ${resultado.summary.entries} lançamentos, ${resultado.summary.accounts} contas, ${resultado.summary.categories} categorias e ${resultado.summary.rules} regras importadas.`
      )
      definirArquivo(null)
      definirPayload(null)
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
      titulo="Planilha completa (.xlsx)"
      detalhe="Importe contas, categorias, regras recorrentes e todos os lançamentos de uma vez."
    >
      <div className="ff-actions" style={{ marginBottom: '14px' }}>
        <Button variant="outline" onPress={baixarModelo}>
          Baixar modelo oficial (.xlsx)
        </Button>
      </div>

      <div className="ff-form">
        <ZonaUpload
          id="arquivo-xlsx-input"
          accept=".xlsx"
          arquivo={arquivo}
          aoSelecionar={selecionarArquivo}
          onArquivoSolto={processarArquivo}
          titulo="Clique ou arraste sua planilha (.xlsx)"
          subtitulo="Aceita arquivos Microsoft Excel compatíveis com o modelo oficial"
          icone="📊"
        />

        {lendo && <Carregando />}
        {falha && <Falha erro={falha} />}
        {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}

        {errosLeitura.length > 0 && (
          <Alerta tipo="erro">
            <strong>Corrija os erros na planilha antes de importar:</strong>
            <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
              {errosLeitura.map(erro => (
                <li key={erro} style={{ fontSize: '0.85rem' }}>{erro}</li>
              ))}
            </ul>
          </Alerta>
        )}

        {previa && (
          <div className="ff-form">
            <div className="ff-kpis" style={{ margin: '8px 0' }}>
              <div>
                <dt>Contas</dt>
                <dd>{previa.accounts}</dd>
              </div>
              <div>
                <dt>Categorias</dt>
                <dd>{previa.categories}</dd>
              </div>
              <div>
                <dt>Regras</dt>
                <dd>{previa.rules}</dd>
              </div>
              <div>
                <dt>Lançamentos</dt>
                <dd>{previa.entries}</dd>
              </div>
            </div>

            {previa.warnings?.length > 0 && (
              <Alerta tipo="aviso">
                <strong>Avisos da importação:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {previa.warnings.map(aviso => (
                    <li key={aviso}>{aviso}</li>
                  ))}
                </ul>
              </Alerta>
            )}

            {payload && payload.entries.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '0.925rem' }}>
                  Prévia dos lançamentos a serem importados ({payload.entries.length} encontrados)
                </h3>
                <Tabela
                  titulo="Prévia de lançamentos XLSX"
                  registros={payload.entries.slice(0, 10).map((item, idx) => ({ ...item, id: String(idx) }))}
                  colunas={[
                    { id: 'title', titulo: 'Descrição', conteudo: item => <strong>{item.title}</strong> },
                    { id: 'cat', titulo: 'Categoria', conteudo: item => item.categoryName || '—' },
                    { id: 'acc', titulo: 'Conta', conteudo: item => item.accountName || '—' },
                    { id: 'date', titulo: 'Vencimento', conteudo: item => dataCurta(item.dueDate) },
                    {
                      id: 'amount',
                      titulo: 'Valor',
                      conteudo: item => (
                        <span className={`ff-number ${item.kind === 'income' ? 'ff-positive' : ''}`}>
                          {item.kind === 'income' ? '+' : '−'} {dinheiro(item.amount)}
                        </span>
                      )
                    }
                  ]}
                />
                {payload.entries.length > 10 && (
                  <p className="ff-muted" style={{ textAlign: 'center', marginTop: '6px' }}>
                    Mostrando os 10 primeiros de {payload.entries.length} lançamentos.
                  </p>
                )}
              </div>
            )}

            <div className="ff-actions ff-actions--end">
              <Button
                variant="outline"
                isDisabled={importando}
                onPress={() => {
                  definirArquivo(null)
                  definirPayload(null)
                  definirPrevia(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                isDisabled={!previa.canImport || importando || !responsavel}
                onPress={executarImportacao}
              >
                {importando ? 'Importando dados...' : 'Confirmar e importar planilha'}
              </Button>
            </div>
            {!responsavel && (
              <p className="ff-muted" style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                Apenas o responsável pela família pode importar planilhas completas.
              </p>
            )}
          </div>
        )}
      </div>
    </Painel>
  )
}
