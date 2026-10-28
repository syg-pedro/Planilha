import type ExcelJS from 'exceljs'
import type { OnboardingImportPayload } from '../../types'

export const folhas = [
  { nome: 'Contas e cartões', colunas: ['Nome', 'Tipo', 'Responsável', 'Limite', 'Fechamento', 'Vencimento'], limite: 100 },
  { nome: 'Categorias', colunas: ['Nome', 'Tipo', 'Cor'], limite: 200 },
  { nome: 'Fixos mensais', colunas: ['Descrição', 'Tipo', 'Valor', 'Dia de vencimento', 'Conta', 'Categoria'], limite: 500 },
  { nome: 'Lançamentos', colunas: ['Descrição', 'Tipo', 'Valor', 'Data', 'Conta', 'Categoria', 'Status', 'Parcela atual', 'Total parcelas'], limite: 1000 }
] as const
const normalizar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
const texto = (valor: unknown, maximo = 100, obrigatorio = false) => {
  const resultado = String(valor ?? '').trim()
  if (resultado.length > maximo || obrigatorio && !resultado) throw new Error(obrigatorio && !resultado ? 'Preencha os campos obrigatórios.' : `Use até ${maximo} caracteres por campo.`)
  return resultado
}
export const lerValor = (valor: unknown, opcional = false): number | null => {
  if (valor == null || valor === '') {
    if (opcional) return null
    throw new Error('Informe o valor.')
  }
  let literal = typeof valor === 'number' ? String(valor) : texto(valor).replace(/^R\$\s*/, '')
  if (literal.includes(',')) {
    if (!/^(?:\d{1,3}(?:\.\d{3})*|\d+),\d{1,2}$/.test(literal)) throw new Error('Use valores como 1234,56 ou 1234.56.')
    literal = literal.replace(/\./g, '').replace(',', '.')
  }
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(literal)) throw new Error('Use até 12 dígitos inteiros e 2 casas decimais, sem valores negativos.')
  const resultado = Number(literal)
  if (!opcional && resultado <= 0) throw new Error('O valor deve ser maior que zero.')
  return resultado
}
const inteiro = (valor: unknown, maximo: number, opcional = false) => {
  if (valor == null || valor === '') {
    if (opcional) return null
    throw new Error('Informe o dia.')
  }
  if (!/^\d+$/.test(String(valor)) || +String(valor) < 1 || +String(valor) > maximo) throw new Error(`Use um inteiro entre 1 e ${maximo}.`)
  return +String(valor)
}
export const lerData = (valor: unknown) => {
  let literal: string
  if (valor instanceof Date) {
    if (!Number.isFinite(valor.getTime())) throw new Error('Informe uma data válida.')
    literal = valor.toISOString().slice(0, 10)
  } else {
    literal = texto(valor)
    const brasileira = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(literal)
    if (brasileira) literal = `${brasileira[3]}-${brasileira[2]}-${brasileira[1]}`
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(literal) || Number(literal.slice(0, 4)) < 1) throw new Error('Use uma data válida em DD/MM/AAAA ou AAAA-MM-DD.')
  const data = new Date(`${literal}T12:00:00Z`)
  if (!Number.isFinite(data.getTime()) || data.toISOString().slice(0, 10) !== literal) throw new Error('Informe uma data válida, sem dias inexistentes.')
  return literal
}
const tipo = (valor: unknown) => {
  const tipos: Record<string, 'bank' | 'credit_card' | 'benefit' | 'external'> = {
    'conta bancaria': 'bank', banco: 'bank', bank: 'bank', cartao: 'credit_card', 'cartao de credito': 'credit_card', credit_card: 'credit_card',
    beneficio: 'benefit', benefit: 'benefit', externa: 'external', external: 'external'
  }
  const resultado = tipos[normalizar(texto(valor))]
  if (!resultado) throw new Error('Escolha Banco, Cartão de crédito, Benefício ou Externa.')
  return resultado
}
const natureza = (valor: unknown) => {
  const resultado = normalizar(texto(valor))
  if (resultado === 'receita' || resultado === 'income') return 'income'
  if (resultado === 'despesa' || resultado === 'expense') return 'expense'
  throw new Error('Escolha Receita ou Despesa.')
}
const situacao = (valor: unknown) => {
  const resultado = normalizar(texto(valor))
  if (!resultado || resultado === 'pendente' || resultado === 'pending') return 'pending'
  if (['pago', 'recebido', 'paid'].includes(resultado)) return 'paid'
  if (resultado === 'revisar' || resultado === 'review') return 'review'
  throw new Error('Escolha Pendente, Pago, Recebido ou Revisar.')
}
const celula = (valor: ExcelJS.CellValue): unknown => {
  if (valor != null && typeof valor === 'object' && !(valor instanceof Date)) {
    if ('formula' in valor || 'sharedFormula' in valor) throw new Error('Substitua fórmulas por valores antes de importar.')
    if ('richText' in valor) return valor.richText.map(parte => parte.text).join('')
    if ('text' in valor) return valor.text
    throw new Error('A célula contém um valor não reconhecido.')
  }
  return valor
}

export function extrairPlanilha(workbook: ExcelJS.Workbook) {
  const payload: OnboardingImportPayload = { version: 1, accounts: [], categories: [], rules: [], entries: [] }
  const erros: string[] = []
  folhas.forEach((definicao, indice) => {
    const folha = workbook.getWorksheet(definicao.nome)
    if (!folha) { erros.push(`Aba obrigatória ausente: ${definicao.nome}.`); return }
    if (folha.rowCount > 1002 || folha.columnCount > 30) { erros.push(`${definicao.nome}: use até a linha 1002 e 30 colunas.`); return }
    const cabecalho = [1, 3].find(linha => definicao.colunas.every((coluna, posicao) =>
      normalizar(String(folha.getRow(linha).getCell(posicao + 1).text)) === normalizar(coluna)))
    if (!cabecalho) { erros.push(`${definicao.nome}: mantenha os cabeçalhos do modelo na linha 1 ou 3.`); return }
    let quantidade = 0
    folha.eachRow((linha, sourceRow) => {
      if (sourceRow <= cabecalho) return
      const valores: unknown[] = []
      try {
        for (let i = 1; i <= definicao.colunas.length; i++) valores.push(celula(linha.getCell(i).value))
        if (valores.every(valor => valor == null || String(valor).trim() === '')) return
        if (++quantidade > definicao.limite) throw new Error(`Use até ${definicao.limite} registros nesta aba.`)
        const [nome, tipoOuNatureza, terceiro, quarto, quinto, sexto, setimo, oitavo, nono] = valores
        if (indice === 0) payload.accounts.push({ sourceRow, name: texto(nome, 100, true), type: tipo(tipoOuNatureza), owner: texto(terceiro, 80),
          limitTotal: lerValor(quarto, true), closingDay: inteiro(quinto, 31, true), dueDay: inteiro(sexto, 31, true) })
        if (indice === 1) {
          const color = texto(terceiro)
          if (!/^#[a-f\d]{6}$/i.test(color)) throw new Error('Use uma cor como #2563eb, com seis dígitos.')
          payload.categories.push({ sourceRow, name: texto(nome, 100, true), kind: natureza(tipoOuNatureza), color })
        }
        if (indice === 2) payload.rules.push({ sourceRow, title: texto(nome, 100, true), kind: natureza(tipoOuNatureza), amount: lerValor(terceiro)!,
          dueDay: inteiro(quarto, 31)!, accountName: texto(quinto) || null, categoryName: texto(sexto) || null })
        if (indice === 3) {
          const installmentIndex = inteiro(oitavo, 999, true), installmentTotal = inteiro(nono, 999, true)
          if ((installmentIndex == null) !== (installmentTotal == null) || installmentIndex != null && installmentIndex > installmentTotal!) throw new Error('Preencha as duas parcelas; a atual não pode superar o total.')
          payload.entries.push({ sourceRow, title: texto(nome, 100, true), kind: natureza(tipoOuNatureza), amount: lerValor(terceiro)!, dueDate: lerData(quarto),
            accountName: texto(quinto) || null, categoryName: texto(sexto) || null, status: situacao(setimo), installmentIndex, installmentTotal })
        }
      } catch (erro) { if (erros.length < 50) erros.push(`${definicao.nome}, linha ${sourceRow}: ${erro instanceof Error ? erro.message : 'Revise os campos.'}`) }
    })
  })
  if (!erros.length && !payload.accounts.length && !payload.categories.length && !payload.rules.length && !payload.entries.length) erros.push('Preencha pelo menos um registro no modelo.')
  return { payload: erros.length ? null : payload, erros }
}

export const validarArquivoExcel = (arquivo: { name: string; size: number }) => {
  if (!/\.xlsx$/i.test(arquivo.name)) throw new Error('Escolha uma planilha .xlsx.')
  if (arquivo.size > 2 * 1024 * 1024) throw new Error('A planilha precisa ter até 2 MB.')
}
export async function lerPlanilha(arquivo: File) {
  validarArquivoExcel(arquivo)
  const { default: Excel } = await import('exceljs')
  const workbook = new Excel.Workbook()
  try { await workbook.xlsx.load(await arquivo.arrayBuffer()) }
  catch { throw new Error('Não foi possível ler a planilha. Use um arquivo .xlsx válido e sem senha.') }
  return extrairPlanilha(workbook)
}
export async function criarModelo() {
  const { default: Excel } = await import('exceljs')
  const workbook = new Excel.Workbook()
  for (const definicao of folhas) {
    const folha = workbook.addWorksheet(definicao.nome)
    folha.addRow([...definicao.colunas])
    folha.getRow(1).font = { bold: true }
    folha.columns.forEach(coluna => { coluna.width = 24 })
    folha.views = [{ state: 'frozen', ySplit: 1 }]
    folha.getColumn(1).width = 34
  }
  const guia = workbook.addWorksheet('Leia-me')
  guia.addRows([
    ['Preencha somente as quatro abas de dados, mantendo seus cabeçalhos.'],
    ['Tipos de conta: Conta bancária, Cartão de crédito, Benefício ou Externa.'],
    ['Tipos financeiros: Receita ou Despesa. Valores positivos com até duas casas decimais.'],
    ['Datas: DD/MM/AAAA ou AAAA-MM-DD. Conta e Categoria devem corresponder aos nomes das outras abas.'],
    ['Status: Pendente, Pago, Recebido ou Revisar. Parcelas: preencha as duas ou deixe ambas vazias.'],
    ['Não use fórmulas. Categorias usam cores hexadecimais de seis dígitos.'],
    ['Limites: 100 contas, 200 categorias, 500 fixos e 1000 lançamentos. Arquivo até 2 MB.'],
    ['A importação inicial exige uma família sem dados financeiros. Fixos gerarão os lançamentos futuros.']
  ])
  guia.getColumn(1).width = 110
  return workbook.xlsx.writeBuffer()
}
