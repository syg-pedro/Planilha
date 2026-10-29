import { useState } from 'react'
import { Button } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { Carregando, Falha, Painel } from '../../components/Controles'
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

  const selecionarArquivo = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const file = evento.target.files?.[0]
    if (!file) return
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
      <div className="ff-actions" style={{ marginBottom: '1.25rem' }}>
        <Button variant="outline" onPress={baixarModelo}>
          Baixar modelo oficial (.xlsx)
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label
          htmlFor="arquivo-xlsx-input"
          style={{
            border: '2px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.02)',
            transition: 'border-color 0.2s ease'
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
          <strong>{arquivo ? arquivo.name : 'Clique para selecionar sua planilha (.xlsx)'}</strong>
          <p className="ff-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
            Aceita arquivos Microsoft Excel compatíveis com o modelo oficial
          </p>
          <input
            id="arquivo-xlsx-input"
            type="file"
            accept=".xlsx"
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

        {errosLeitura.length > 0 && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(255, 51, 102, 0.1)',
              border: '1px solid rgba(255, 51, 102, 0.3)'
            }}
          >
            <strong style={{ color: '#ff3366' }}>Corrija os erros na planilha antes de importar:</strong>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
              {errosLeitura.map(erro => (
                <li key={erro} style={{ fontSize: '0.875rem' }}>{erro}</li>
              ))}
            </ul>
          </div>
        )}

        {previa && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem'
              }}
            >
              <div className="ff-kpi-card" style={{ padding: '0.75rem 1rem' }}>
                <span className="ff-muted" style={{ fontSize: '0.75rem' }}>Contas</span>
                <strong style={{ fontSize: '1.25rem' }}>{previa.accounts}</strong>
              </div>
              <div className="ff-kpi-card" style={{ padding: '0.75rem 1rem' }}>
                <span className="ff-muted" style={{ fontSize: '0.75rem' }}>Categorias</span>
                <strong style={{ fontSize: '1.25rem' }}>{previa.categories}</strong>
              </div>
              <div className="ff-kpi-card" style={{ padding: '0.75rem 1rem' }}>
                <span className="ff-muted" style={{ fontSize: '0.75rem' }}>Regras</span>
                <strong style={{ fontSize: '1.25rem' }}>{previa.rules}</strong>
              </div>
              <div className="ff-kpi-card" style={{ padding: '0.75rem 1rem' }}>
                <span className="ff-muted" style={{ fontSize: '0.75rem' }}>Lançamentos</span>
                <strong style={{ fontSize: '1.25rem' }}>{previa.entries}</strong>
              </div>
            </div>

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
                <strong style={{ color: '#ffb800' }}>Avisos da importação:</strong>
                <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                  {previa.warnings.map(aviso => (
                    <li key={aviso}>{aviso}</li>
                  ))}
                </ul>
              </div>
            )}

            {payload && payload.entries.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
                  Prévia dos lançamentos a serem importados ({payload.entries.length} encontrados)
                </h4>
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
                  <p className="ff-muted" style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' }}>
                    Mostrando os 10 primeiros de {payload.entries.length} lançamentos.
                  </p>
                )}
              </div>
            )}

            <div className="ff-actions" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
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
              <p className="ff-muted" style={{ fontSize: '0.8rem', textAlign: 'right' }}>
                Apenas o responsável pela família pode importar planilhas completas.
              </p>
            )}
          </div>
        )}
      </div>
    </Painel>
  )
}
