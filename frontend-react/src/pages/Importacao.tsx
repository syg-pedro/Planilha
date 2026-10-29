import { useState } from 'react'
import { Button } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { Campo, Carregando, Escolha, Falha, Painel } from '../components/Controles'
import { Tabela } from '../components/Tabela'
import { useFinanceiro } from '../hooks/useFinanceiro'
import { useSessao } from '../hooks/useSessao'
import { api } from '../services/api'
import { dataCurta, dinheiro } from '../services/formatacao'
import { criarModelo, lerPlanilha } from '../features/importacao/planilha'
import type { OnboardingImportPayload, OnboardingImportPreview } from '../types'

export default function Importacao() {
  const { sessao } = useSessao()
  const financeiro = useFinanceiro()
  const cache = useQueryClient()
  const responsavel = sessao?.family.role === 'owner'

  // Estado para XLSX
  const [arquivoXlsx, definirArquivoXlsx] = useState<File | null>(null)
  const [lendoXlsx, definirLendoXlsx] = useState(false)
  const [errosLeituraXlsx, definirErrosLeituraXlsx] = useState<string[]>([])
  const [payloadXlsx, definirPayloadXlsx] = useState<OnboardingImportPayload | null>(null)
  const [previaXlsx, definirPreviaXlsx] = useState<OnboardingImportPreview | null>(null)
  const [importandoXlsx, definirImportandoXlsx] = useState(false)
  const [sucessoXlsx, definirSucessoXlsx] = useState<string | null>(null)
  const [falhaXlsx, definirFalhaXlsx] = useState<unknown>(null)

  // Estado para CSV
  const [contaCsv, definirContaCsv] = useState<string>('')
  const [textoCsv, definirTextoCsv] = useState('')
  const [nomeArquivoCsv, definirNomeArquivoCsv] = useState('')
  const [previaCsv, definirPreviaCsv] = useState<{ rows: Array<{ title: string; dueDate: string; amount: number; kind: string; status: string }>; warnings: string[]; canImport: boolean } | null>(null)
  const [lendoCsv, definirLendoCsv] = useState(false)
  const [importandoCsv, definirImportandoCsv] = useState(false)
  const [sucessoCsv, definirSucessoCsv] = useState<string | null>(null)
  const [falhaCsv, definirFalhaCsv] = useState<unknown>(null)

  const baixarModelo = async () => {
    try {
      const buffer = await criarModelo()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'modelo-financeiro-familiar.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      definirFalhaXlsx(err)
    }
  }

  const selecionarXlsx = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return
    definirArquivoXlsx(arquivo)
    definirSucessoXlsx(null)
    definirFalhaXlsx(null)
    definirErrosLeituraXlsx([])
    definirPreviaXlsx(null)
    definirPayloadXlsx(null)
    definirLendoXlsx(true)

    try {
      const resultado = await lerPlanilha(arquivo)
      if (resultado.erros.length) {
        definirErrosLeituraXlsx(resultado.erros)
      }
      if (resultado.payload) {
        definirPayloadXlsx(resultado.payload)
        const previa = await api<OnboardingImportPreview>('/api/onboarding/import/preview', {
          method: 'POST',
          body: resultado.payload
        })
        definirPreviaXlsx(previa)
      }
    } catch (err) {
      definirFalhaXlsx(err)
    } finally {
      definirLendoXlsx(false)
    }
  }

  const confirmarImportacaoXlsx = async () => {
    if (!payloadXlsx) return
    definirImportandoXlsx(true)
    definirFalhaXlsx(null)
    try {
      const resposta = await api<{ summary: { accounts: number; categories: number; rules: number; entries: number; generatedEntries: number } }>('/api/onboarding/import', {
        method: 'POST',
        body: payloadXlsx
      })
      definirSucessoXlsx(`Importação concluída com sucesso! ${resposta.summary.accounts} contas, ${resposta.summary.categories} categorias, ${resposta.summary.rules} regras e ${resposta.summary.entries + resposta.summary.generatedEntries} lançamentos importados.`)
      definirPayloadXlsx(null)
      definirPreviaXlsx(null)
      definirArquivoXlsx(null)
      await cache.invalidateQueries({ queryKey: ['lab'] })
    } catch (err) {
      definirFalhaXlsx(err)
    } finally {
      definirImportandoXlsx(false)
    }
  }

  const selecionarCsv = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return
    definirNomeArquivoCsv(arquivo.name)
    definirSucessoCsv(null)
    definirFalhaCsv(null)
    definirPreviaCsv(null)
    const leitor = new FileReader()
    leitor.onload = (e) => {
      const texto = String(e.target?.result ?? '')
      definirTextoCsv(texto)
    }
    leitor.readAsText(arquivo, 'UTF-8')
  }

  const preverCsv = async () => {
    if (!textoCsv.trim()) return
    definirLendoCsv(true)
    definirFalhaCsv(null)
    definirSucessoCsv(null)
    try {
      const resposta = await api<{ rows: Array<{ title: string; dueDate: string; amount: number; kind: string; status: string }>; warnings: string[]; canImport: boolean }>('/api/import/csv/preview', {
        method: 'POST',
        body: { csvText: textoCsv, accountId: contaCsv || null }
      })
      definirPreviaCsv(resposta)
    } catch (err) {
      definirFalhaCsv(err)
    } finally {
      definirLendoCsv(false)
    }
  }

  const confirmarImportacaoCsv = async () => {
    if (!textoCsv.trim()) return
    definirImportandoCsv(true)
    definirFalhaCsv(null)
    try {
      const resposta = await api<{ inserted: number; warnings: string[] }>('/api/import/csv', {
        method: 'POST',
        body: { csvText: textoCsv, accountId: contaCsv || null }
      })
      definirSucessoCsv(`${resposta.inserted} lançamento(s) importado(s) com sucesso a partir do CSV.`)
      definirPreviaCsv(null)
      definirTextoCsv('')
      definirNomeArquivoCsv('')
      await cache.invalidateQueries({ queryKey: ['lab'] })
    } catch (err) {
      definirFalhaCsv(err)
    } finally {
      definirImportandoCsv(false)
    }
  }

  const contas = financeiro.data?.accounts ?? []

  return <>
    <div className="ff-page-title">
      <div>
        <h1>Importar dados</h1>
        <p>Migre sua base por planilha (.xlsx) ou importe extratos e faturas em formato CSV.</p>
      </div>
    </div>

    {!responsavel && <p className="ff-muted" style={{ marginBottom: '24px' }}>Somente responsáveis pela família podem realizar importações de dados.</p>}

    <Painel titulo="Planilha completa (.xlsx)" detalhe="Modelo de migração oficial contendo contas, categorias, fixos e lançamentos." className="ff-form">
      <div className="ff-actions">
        <Button variant="outline" onPress={baixarModelo}>Baixar modelo oficial (.xlsx)</Button>
      </div>

      <div className="ff-form">
        <label htmlFor="input-xlsx" style={{ display: 'grid', gap: '8px', cursor: 'pointer' }}>
          <span style={{ fontWeight: 600 }}>Selecione o arquivo preenchido (.xlsx)</span>
          <input
            id="input-xlsx"
            type="file"
            accept=".xlsx"
            disabled={!responsavel || lendoXlsx || importandoXlsx}
            onChange={selecionarXlsx}
            style={{ padding: '8px', border: '1px dashed var(--ff-border)', borderRadius: '8px' }}
          />
        </label>
        {arquivoXlsx && <p className="ff-muted">Arquivo selecionado: {arquivoXlsx.name} ({(arquivoXlsx.size / 1024).toFixed(1)} KB)</p>}
      </div>

      {lendoXlsx && <Carregando />}
      {falhaXlsx != null && <Falha erro={falhaXlsx} />}
      {sucessoXlsx && <div role="status" style={{ padding: '16px', borderRadius: '8px', background: 'var(--ff-tint)', color: 'var(--ff-positive)' }}>{sucessoXlsx}</div>}

      {errosLeituraXlsx.length > 0 && <div role="alert" className="ff-error" style={{ display: 'grid', gap: '4px' }}>
        <strong>Inconsistências encontradas na planilha ({errosLeituraXlsx.length}):</strong>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          {errosLeituraXlsx.slice(0, 15).map((erro, i) => <li key={i}>{erro}</li>)}
        </ul>
        {errosLeituraXlsx.length > 15 && <p className="ff-muted">... e mais {errosLeituraXlsx.length - 15} inconsistências.</p>}
      </div>}

      {previaXlsx && <div className="ff-form" style={{ marginTop: '16px', padding: '16px', border: '1px solid var(--ff-border)', borderRadius: '8px' }}>
        <h3>Pré-visualização da planilha</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '8px', background: 'var(--ff-tint)', borderRadius: '6px' }}><strong>{previaXlsx.accounts}</strong> contas</div>
          <div style={{ padding: '8px', background: 'var(--ff-tint)', borderRadius: '6px' }}><strong>{previaXlsx.categories}</strong> categorias</div>
          <div style={{ padding: '8px', background: 'var(--ff-tint)', borderRadius: '6px' }}><strong>{previaXlsx.rules}</strong> fixos mensais</div>
          <div style={{ padding: '8px', background: 'var(--ff-tint)', borderRadius: '6px' }}><strong>{previaXlsx.entries}</strong> lançamentos</div>
          <div style={{ padding: '8px', background: 'var(--ff-tint)', borderRadius: '6px' }}><strong>{previaXlsx.generatedEntries}</strong> gerados futuros</div>
        </div>

        {previaXlsx.warnings.length > 0 && <div className="ff-error" style={{ margin: '12px 0 0' }}>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {previaXlsx.warnings.map((aviso, i) => <li key={i}>{aviso}</li>)}
          </ul>
        </div>}

        <div className="ff-actions ff-actions--end">
          <Button
            variant="primary"
            isDisabled={!responsavel || !previaXlsx.canImport || importandoXlsx}
            isPending={importandoXlsx}
            onPress={confirmarImportacaoXlsx}
          >
            Confirmar importação da planilha
          </Button>
        </div>
      </div>}
    </Painel>

    <Painel titulo="Extrato bancário ou fatura (.csv)" detalhe="Importe lançamentos em lote a partir de extratos suportados." className="ff-form">
      <div className="ff-form">
        <div className="ff-form-row">
          <Escolha
            titulo="Vincular à conta (opcional)"
            valor={contaCsv}
            alterar={definirContaCsv}
            disabled={!responsavel || lendoCsv || importandoCsv}
            opcoes={[{ value: '', label: 'Nenhuma conta pré-definida' }, ...contas.map(c => ({ value: c.id, label: `${c.name} (${c.type})` }))]}
          />
          <label htmlFor="input-csv" style={{ display: 'grid', gap: '8px', cursor: 'pointer' }}>
            <span style={{ fontWeight: 600 }}>Arquivo CSV</span>
            <input
              id="input-csv"
              type="file"
              accept=".csv,text/csv"
              disabled={!responsavel || lendoCsv || importandoCsv}
              onChange={selecionarCsv}
              style={{ padding: '8px', border: '1px dashed var(--ff-border)', borderRadius: '8px' }}
            />
          </label>
        </div>

        {nomeArquivoCsv && <p className="ff-muted">Arquivo: {nomeArquivoCsv} ({textoCsv.length} caracteres)</p>}

        <div className="ff-actions">
          <Button
            variant="outline"
            isDisabled={!responsavel || !textoCsv.trim() || lendoCsv || importandoCsv}
            isPending={lendoCsv}
            onPress={preverCsv}
          >
            Pré-visualizar extrato CSV
          </Button>
        </div>
      </div>

      {falhaCsv != null && <Falha erro={falhaCsv} />}
      {sucessoCsv && <div role="status" style={{ padding: '16px', borderRadius: '8px', background: 'var(--ff-tint)', color: 'var(--ff-positive)' }}>{sucessoCsv}</div>}

      {previaCsv && <div className="ff-form" style={{ marginTop: '16px' }}>
        <h3>Pré-visualização do extrato</h3>
        <p className="ff-muted">{previaCsv.rows.length} lançamento(s) identificado(s).</p>

        {previaCsv.warnings.length > 0 && <div className="ff-error">
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {previaCsv.warnings.map((aviso, i) => <li key={i}>{aviso}</li>)}
          </ul>
        </div>}

        {previaCsv.rows.length > 0 && <Tabela
          titulo="Primeiras linhas do extrato"
          registros={previaCsv.rows.slice(0, 10).map((r, i) => ({ ...r, id: String(i) }))}
          colunas={[
            { id: 'data', titulo: 'Data', conteudo: r => dataCurta(r.dueDate) },
            { id: 'desc', titulo: 'Descrição', conteudo: r => r.title },
            { id: 'valor', titulo: 'Valor', conteudo: r => dinheiro(r.amount) },
            { id: 'tipo', titulo: 'Tipo', conteudo: r => r.kind === 'income' ? 'Receita' : 'Despesa' },
            { id: 'status', titulo: 'Situação', conteudo: r => r.status === 'paid' ? 'Pago' : 'Pendente' }
          ]}
        />}

        <div className="ff-actions ff-actions--end">
          <Button
            variant="primary"
            isDisabled={!responsavel || !previaCsv.canImport || importandoCsv}
            isPending={importandoCsv}
            onPress={confirmarImportacaoCsv}
          >
            Confirmar importação de extrato ({previaCsv.rows.length} lançamentos)
          </Button>
        </div>
      </div>}
    </Painel>
  </>
}

