import { ImportadorXlsx } from '../features/importacao/ImportadorXlsx'
import { ImportadorCsv } from '../features/importacao/ImportadorCsv'
import { useFinanceiro } from '../hooks/useFinanceiro'
import { useSessao } from '../hooks/useSessao'

export default function Importacao() {
  const { sessao } = useSessao()
  const financeiro = useFinanceiro()
  const responsavel = sessao?.family.role === 'owner'

  return (
    <>
      <div className="ff-page-title">
        <div>
          <h1>Importação de Dados</h1>
          <p>
            Traga seus dados de planilhas Excel ou extratos bancários em formato CSV sem perder histórico.
          </p>
        </div>
      </div>

      <div className="ff-form">
        <ImportadorXlsx familyId={sessao?.family.id} responsavel={responsavel} />
        <ImportadorCsv familyId={sessao?.family.id} contas={financeiro.data?.accounts ?? []} />
      </div>
    </>
  )
}
