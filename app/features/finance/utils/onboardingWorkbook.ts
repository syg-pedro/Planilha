import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { normalizeOnboardingKey } from '#shared/onboarding'
import type {
  Account,
  EntryKind,
  EntryStatus,
  OnboardingImportPayload,
} from '#shared/types'

const FILE_NAME = 'modelo-financeiro-familiar.xlsx'
const CATEGORY_COLORS = ['#5b5bf7', '#13a86b', '#e84545', '#f59e0b', '#0ea5e9', '#ec4899']
const REQUIRED_SHEETS = ['Contas e cartões', 'Categorias', 'Fixos mensais', 'Lançamentos'] as const

export interface WorkbookParseResult {
  payload: OnboardingImportPayload | null
  errors: string[]
}

type SheetName = typeof REQUIRED_SHEETS[number]

const clean = (value: unknown): string => String(value ?? '').trim()

const cellValue = (value: unknown): unknown => {
  if (value && typeof value === 'object') {
    if ('result' in value) return (value as { result?: unknown }).result
    if ('text' in value) return (value as { text?: unknown }).text
    if ('richText' in value) {
      return (value as { richText?: Array<{ text?: string }> }).richText?.map((part) => part.text ?? '').join('') ?? ''
    }
  }
  return value
}

const asNumber = (value: unknown): number | null => {
  const raw = cellValue(value)
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  const text = clean(raw)
    .replace(/R\$/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  if (!text) return null
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}

const asDay = (value: unknown): number | null => {
  const number = asNumber(value)
  return number !== null && Number.isInteger(number) && number >= 1 && number <= 31 ? number : null
}

const pad = (value: number) => String(value).padStart(2, '0')

const formatDate = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const asIsoDate = (value: unknown): string | null => {
  const raw = cellValue(value)
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return formatDate(raw)
  if (typeof raw === 'number') {
    const date = new Date(Date.UTC(1899, 11, 30) + raw * 86400000)
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
  }
  const text = clean(raw)
  if (!text) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])))
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

const mapKind = (value: unknown): EntryKind | null => {
  const key = normalizeOnboardingKey(clean(cellValue(value)))
  if (key === 'receita') return 'income'
  if (key === 'despesa') return 'expense'
  return null
}

const mapStatus = (value: unknown): EntryStatus | null => {
  const key = normalizeOnboardingKey(clean(cellValue(value)))
  if (!key || key === 'pendente') return 'pending'
  if (key === 'pago' || key === 'recebido') return 'paid'
  if (key === 'revisar') return 'review'
  return null
}

const mapAccountType = (value: unknown): Account['type'] | null => {
  const key = normalizeOnboardingKey(clean(cellValue(value)))
  if (key === 'conta bancaria' || key === 'banco') return 'bank'
  if (key === 'cartao' || key === 'cartao de credito') return 'credit_card'
  if (key === 'beneficio') return 'benefit'
  if (key === 'externa') return 'external'
  return null
}

const asReference = (value: unknown): string | null => {
  const text = clean(cellValue(value))
  return text || null
}

const rowIsEmpty = (values: unknown[]): boolean => values.every((value) => clean(cellValue(value)) === '')

interface WorkbookRow {
  getCell: (index: number) => { value: unknown }
}

interface WorkbookSheet {
  eachRow: (options: { includeEmpty: boolean }, callback: (row: WorkbookRow, rowNumber: number) => void) => void
}

const readRows = (worksheet: WorkbookSheet, columns: number): Array<{ rowNumber: number; values: unknown[] }> => {
  const rows: Array<{ rowNumber: number; values: unknown[] }> = []
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return
    const values = Array.from({ length: columns }, (_, index) => row.getCell(index + 1).value)
    if (!rowIsEmpty(values)) rows.push({ rowNumber, values })
  })
  return rows
}

const addWorkbookTitle = (worksheet: any, title: string, subtitle: string) => {
  worksheet.mergeCells('A1:H1')
  worksheet.getCell('A1').value = title
  worksheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } }
  worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B5BF7' } }
  worksheet.getCell('A1').alignment = { vertical: 'middle' }
  worksheet.getRow(1).height = 30
  worksheet.mergeCells('A2:H2')
  worksheet.getCell('A2').value = subtitle
  worksheet.getCell('A2').font = { italic: true, color: { argb: 'FF475569' } }
  worksheet.getRow(2).height = 24
}

const addTable = (worksheet: any, headers: string[], widths: number[]) => {
  const headerRow = worksheet.addRow(headers)
  headerRow.height = 24
  headerRow.eachCell((cell: any) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } }
    cell.alignment = { vertical: 'middle' }
  })
  widths.forEach((width, index) => { worksheet.getColumn(index + 1).width = width })
  worksheet.views = [{ state: 'frozen', ySplit: 3 }]
  worksheet.autoFilter = { from: 'A3', to: `${String.fromCharCode(64 + headers.length)}3` }
  for (let row = 4; row <= 103; row += 1) {
    for (let column = 1; column <= headers.length; column += 1) {
      const cell = worksheet.getCell(row, column)
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
    }
  }
}

const createWorkbook = async () => {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Financeiro Familiar'
  workbook.created = new Date()

  const guide = workbook.addWorksheet('Leia-me')
  addWorkbookTitle(guide, 'MODELO INICIAL', 'Preencha as abas abaixo e envie este mesmo arquivo pelo Financeiro Familiar.')
  guide.getColumn(1).width = 26
  guide.getColumn(2).width = 92
  const guideRows = [
    ['1. Contas e cartões', 'Cadastre bancos, cartões e benefícios. Os nomes serão usados nas outras abas.'],
    ['2. Categorias', 'Crie as categorias de receitas e despesas que deseja acompanhar.'],
    ['3. Fixos mensais', 'Inclua aluguel, salário, assinaturas e outras movimentações que se repetem todo mês.'],
    ['4. Lançamentos', 'Inclua compras, pagamentos ou receitas avulsas. Use uma linha por item.'],
    ['Importante', 'Não altere os títulos das colunas. Valores devem ser positivos; Receita ou Despesa define o tipo.'],
  ]
  guideRows.forEach((values) => {
    const row = guide.addRow(values)
    row.getCell(1).font = { bold: true, color: { argb: 'FF5B5BF7' } }
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' }
    row.height = 34
  })

  const accounts = workbook.addWorksheet('Contas e cartões')
  addWorkbookTitle(accounts, 'CONTAS E CARTÕES', 'Tipos aceitos: Conta bancária, Cartão, Benefício ou Externa.')
  addTable(accounts, ['Nome', 'Tipo', 'Responsável', 'Limite', 'Fechamento', 'Vencimento'], [28, 20, 22, 15, 15, 15])
  for (let row = 4; row <= 103; row += 1) {
    accounts.getCell(`B${row}`).dataValidation = { type: 'list', allowBlank: false, formulae: ['"Conta bancária,Cartão,Benefício,Externa"'] }
  }

  const categories = workbook.addWorksheet('Categorias')
  addWorkbookTitle(categories, 'CATEGORIAS', 'Exemplos: Moradia, Mercado, Transporte, Salário e Freelance.')
  addTable(categories, ['Nome', 'Tipo', 'Cor'], [32, 18, 16])
  for (let row = 4; row <= 203; row += 1) {
    categories.getCell(`B${row}`).dataValidation = { type: 'list', allowBlank: false, formulae: ['"Receita,Despesa"'] }
  }

  const rules = workbook.addWorksheet('Fixos mensais')
  addWorkbookTitle(rules, 'FIXOS MENSAIS', 'Cada linha vira um lançamento mensal automático para os próximos meses.')
  addTable(rules, ['Descrição', 'Tipo', 'Valor', 'Dia de vencimento', 'Conta', 'Categoria'], [34, 16, 16, 21, 26, 26])
  for (let row = 4; row <= 503; row += 1) {
    rules.getCell(`B${row}`).dataValidation = { type: 'list', allowBlank: false, formulae: ['"Receita,Despesa"'] }
  }

  const entries = workbook.addWorksheet('Lançamentos')
  addWorkbookTitle(entries, 'LANÇAMENTOS AVULSOS', 'Use a data no formato dd/mm/aaaa ou a seleção de data do Excel.')
  addTable(entries, ['Descrição', 'Tipo', 'Valor', 'Data', 'Conta', 'Categoria', 'Status', 'Parcela atual', 'Total parcelas'], [34, 16, 16, 16, 24, 24, 16, 16, 16])
  for (let row = 4; row <= 1003; row += 1) {
    entries.getCell(`B${row}`).dataValidation = { type: 'list', allowBlank: false, formulae: ['"Receita,Despesa"'] }
    entries.getCell(`G${row}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Pendente,Pago,Revisar"'] }
  }

  return workbook
}

const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

export const downloadOnboardingWorkbook = async () => {
  const workbook = await createWorkbook()
  const buffer = await workbook.xlsx.writeBuffer() as ArrayBuffer

  if (Capacitor.isNativePlatform()) {
    try {
      const saved = await Filesystem.writeFile({
        path: FILE_NAME,
        data: toBase64(buffer),
        directory: Directory.Cache,
      })
      await Share.share({
        title: 'Modelo Financeiro Familiar',
        text: 'Preencha esta planilha e envie pelo aplicativo para começar.',
        files: [saved.uri],
      })
      return
    } catch {
      // APKs anteriores à integração nativa ainda tentam o download padrão do WebView.
    }
  }

  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = FILE_NAME
  link.click()
  URL.revokeObjectURL(url)
}

export const parseOnboardingWorkbook = async (file: File): Promise<WorkbookParseResult> => {
  const errors: string[] = []
  if (!/\.xlsx$/i.test(file.name)) {
    return { payload: null, errors: ['Envie o arquivo .xlsx baixado pelo Financeiro Familiar.'] }
  }
  if (file.size > 2 * 1024 * 1024) {
    return { payload: null, errors: ['O arquivo ultrapassa o limite de 2 MB.'] }
  }

  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())

  const sheets = new Map<SheetName, any>()
  for (const sheetName of REQUIRED_SHEETS) {
    const worksheet = workbook.getWorksheet(sheetName)
    if (!worksheet) {
      errors.push(`A aba "${sheetName}" está ausente. Baixe um novo modelo e tente novamente.`)
    } else {
      sheets.set(sheetName, worksheet)
    }
  }
  if (errors.length) return { payload: null, errors }

  const accounts: OnboardingImportPayload['accounts'] = []
  for (const { rowNumber, values } of readRows(sheets.get('Contas e cartões'), 6)) {
    const [name, type, owner, limit, closingDay, dueDay] = values
    const parsedType = mapAccountType(type)
    if (!clean(cellValue(name))) errors.push(`Contas e cartões, linha ${rowNumber}: informe o nome.`)
    if (!parsedType) errors.push(`Contas e cartões, linha ${rowNumber}: escolha um tipo válido.`)
    const parsedLimit = asNumber(limit)
    if (clean(cellValue(limit)) && (parsedLimit === null || parsedLimit < 0)) errors.push(`Contas e cartões, linha ${rowNumber}: limite inválido.`)
    if (clean(cellValue(closingDay)) && asDay(closingDay) === null) errors.push(`Contas e cartões, linha ${rowNumber}: fechamento deve estar entre 1 e 31.`)
    if (clean(cellValue(dueDay)) && asDay(dueDay) === null) errors.push(`Contas e cartões, linha ${rowNumber}: vencimento deve estar entre 1 e 31.`)
    if (clean(cellValue(name)) && parsedType && (parsedLimit !== null || !clean(cellValue(limit))) && (!clean(cellValue(closingDay)) || asDay(closingDay)) && (!clean(cellValue(dueDay)) || asDay(dueDay))) {
      accounts.push({ sourceRow: rowNumber, name: clean(cellValue(name)), type: parsedType, owner: clean(cellValue(owner)), limitTotal: parsedLimit, closingDay: asDay(closingDay), dueDay: asDay(dueDay) })
    }
  }

  const categories: OnboardingImportPayload['categories'] = []
  for (const { rowNumber, values } of readRows(sheets.get('Categorias'), 3)) {
    const [name, kind, color] = values
    const parsedKind = mapKind(kind)
    const parsedColor = clean(cellValue(color)) || CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length] || '#5b5bf7'
    if (!clean(cellValue(name))) errors.push(`Categorias, linha ${rowNumber}: informe o nome.`)
    if (!parsedKind) errors.push(`Categorias, linha ${rowNumber}: escolha Receita ou Despesa.`)
    if (!/^#[0-9a-f]{6}$/i.test(parsedColor)) errors.push(`Categorias, linha ${rowNumber}: use uma cor hexadecimal, como #5B5BF7.`)
    if (clean(cellValue(name)) && parsedKind && /^#[0-9a-f]{6}$/i.test(parsedColor)) {
      categories.push({ sourceRow: rowNumber, name: clean(cellValue(name)), kind: parsedKind, color: parsedColor })
    }
  }

  const rules: OnboardingImportPayload['rules'] = []
  for (const { rowNumber, values } of readRows(sheets.get('Fixos mensais'), 6)) {
    const [title, kind, amount, dueDay, accountName, categoryName] = values
    const parsedKind = mapKind(kind)
    const parsedAmount = asNumber(amount)
    if (!clean(cellValue(title))) errors.push(`Fixos mensais, linha ${rowNumber}: informe a descrição.`)
    if (!parsedKind) errors.push(`Fixos mensais, linha ${rowNumber}: escolha Receita ou Despesa.`)
    if (parsedAmount === null || parsedAmount <= 0) errors.push(`Fixos mensais, linha ${rowNumber}: informe um valor maior que zero.`)
    if (asDay(dueDay) === null) errors.push(`Fixos mensais, linha ${rowNumber}: vencimento deve estar entre 1 e 31.`)
    if (clean(cellValue(title)) && parsedKind && parsedAmount && asDay(dueDay)) {
      rules.push({ sourceRow: rowNumber, title: clean(cellValue(title)), kind: parsedKind, amount: parsedAmount, dueDay: asDay(dueDay) as number, accountName: asReference(accountName), categoryName: asReference(categoryName) })
    }
  }

  const entries: OnboardingImportPayload['entries'] = []
  for (const { rowNumber, values } of readRows(sheets.get('Lançamentos'), 9)) {
    const [title, kind, amount, dueDate, accountName, categoryName, status, installmentIndex, installmentTotal] = values
    const parsedKind = mapKind(kind)
    const parsedAmount = asNumber(amount)
    const parsedDate = asIsoDate(dueDate)
    const parsedStatus = mapStatus(status)
    const parsedIndex = clean(cellValue(installmentIndex)) ? asNumber(installmentIndex) : null
    const parsedTotal = clean(cellValue(installmentTotal)) ? asNumber(installmentTotal) : null
    if (!clean(cellValue(title))) errors.push(`Lançamentos, linha ${rowNumber}: informe a descrição.`)
    if (!parsedKind) errors.push(`Lançamentos, linha ${rowNumber}: escolha Receita ou Despesa.`)
    if (parsedAmount === null || parsedAmount <= 0) errors.push(`Lançamentos, linha ${rowNumber}: informe um valor maior que zero.`)
    if (!parsedDate) errors.push(`Lançamentos, linha ${rowNumber}: informe uma data válida.`)
    if (!parsedStatus) errors.push(`Lançamentos, linha ${rowNumber}: status inválido.`)
    if ((parsedIndex === null) !== (parsedTotal === null) || (parsedIndex && parsedTotal && (!Number.isInteger(parsedIndex) || !Number.isInteger(parsedTotal) || parsedIndex < 1 || parsedIndex > parsedTotal))) {
      errors.push(`Lançamentos, linha ${rowNumber}: informe parcelas válidas ou deixe as duas colunas vazias.`)
    }
    if (clean(cellValue(title)) && parsedKind && parsedAmount && parsedDate && parsedStatus && (parsedIndex === null) === (parsedTotal === null)) {
      entries.push({ sourceRow: rowNumber, title: clean(cellValue(title)), kind: parsedKind, amount: parsedAmount, dueDate: parsedDate, accountName: asReference(accountName), categoryName: asReference(categoryName), status: parsedStatus, installmentIndex: parsedIndex, installmentTotal: parsedTotal })
    }
  }

  const payload: OnboardingImportPayload = { version: 1, accounts, categories, rules, entries }
  if (errors.length > 0) return { payload: null, errors: errors.slice(0, 12) }
  return { payload, errors: [] }
}
