import { buildFinanceMatrix, type MatrixRow } from './matrix'
import { sumMoney } from './money'
import type { Account, EntryBatchRequest, EntryKind, FinanceEntry, PeriodMode } from './types'

export interface SpreadsheetModel {
  /** Despesas e faturas de cartão: cada uma vira uma coluna da planilha. */
  columns: MatrixRow[]
  incomes: MatrixRow[]
  expenseByMonth: Record<string, number>
  incomeByMonth: Record<string, number>
  balanceByMonth: Record<string, number>
  totalExpense: number
}

/** Totais saem das próprias células exibidas, então Soma, totais e Sobra sempre fecham entre si. */
export function buildSpreadsheet(
  entries: FinanceEntry[],
  accounts: Account[],
  months: string[],
  mode: PeriodMode = 'due_date',
): SpreadsheetModel {
  const { rows } = buildFinanceMatrix(entries, accounts, months, mode)
  const columns = rows.filter((row) => row.group === 'expenses' || row.group === 'cards')
  const incomes = rows.filter((row) => row.group === 'income')
  const byMonth = (list: MatrixRow[]) =>
    Object.fromEntries(months.map((month) => [month, sumMoney(list.map((row) => row.cells[month]?.amount ?? 0))]))
  const expenseByMonth = byMonth(columns)
  const incomeByMonth = byMonth(incomes)
  const balanceByMonth = Object.fromEntries(
    months.map((month) => [month, sumMoney([incomeByMonth[month]!, -expenseByMonth[month]!])]),
  )
  return { columns, incomes, expenseByMonth, incomeByMonth, balanceByMonth, totalExpense: sumMoney(Object.values(expenseByMonth)) }
}

const round = (value: number) => Math.round(value * 100) / 100

function parseNumber(text: string): number | null {
  let value = text.trim().replace(/R\$/i, '').replace(/\s/g, '')
  if (value === '') return null
  if (value.includes(',')) value = value.replace(/\./g, '').replace(',', '.')
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(value)) value = value.replace(/\./g, '')
  return /^-?(\d+\.?\d*|\.\d+)$/.test(value) ? Number(value) : Number.NaN
}

/**
 * Lê o que foi digitado numa célula: "1.400,00", "47.82", "R$ 99" ou contas como "=106,09*2".
 * Retorna null para célula vazia e NaN quando o texto não é um valor.
 */
export function parseSheetInput(raw: string): number | null {
  const text = raw.trim()
  if (!text.startsWith('=')) {
    const value = parseNumber(text)
    return value === null || Number.isNaN(value) ? value : round(value)
  }
  const tokens = text.slice(1).match(/\d[\d.,]*|[-+*/()]|\S/g) ?? []
  let index = 0
  const peek = () => tokens[index]
  const next = () => tokens[index++]
  const factor = (): number => {
    const token = next()
    if (token === '-') return -factor()
    if (token === '+') return factor()
    if (token === '(') {
      const value = expression()
      if (next() !== ')') throw new Error('parêntese')
      return value
    }
    const value = parseNumber(token ?? '')
    if (value === null || Number.isNaN(value)) throw new Error('número')
    return value
  }
  const term = (): number => {
    let value = factor()
    while (peek() === '*' || peek() === '/') value = next() === '*' ? value * factor() : value / factor()
    return value
  }
  const expression = (): number => {
    let value = term()
    while (peek() === '+' || peek() === '-') value = next() === '+' ? value + term() : value - term()
    return value
  }
  try {
    const value = expression()
    return index === tokens.length && Number.isFinite(value) ? round(value) : Number.NaN
  } catch {
    return Number.NaN
  }
}

export function entryDateFor(month: string, day: number): string {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number]
  const last = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  return `${month}-${String(Math.min(Math.max(1, day), last)).padStart(2, '0')}`
}

const shiftMonth = (month: string, offset: number) => {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number]
  return new Date(Date.UTC(year, monthNumber - 1 + offset, 1)).toISOString().slice(0, 7)
}

export interface NewEntryBase {
  householdId: string
  title: string
  accountId: string | null
  categoryId: string | null
  amount: number
  kind: EntryKind
  ruleId?: string | null
}

export function newSheetEntry(base: NewEntryBase, month: string, day: number, id: string, now: string): FinanceEntry {
  const date = entryDateFor(month, day)
  return {
    id, householdId: base.householdId, ruleId: base.ruleId ?? null, accountId: base.accountId, categoryId: base.categoryId,
    title: base.title, description: '', amount: base.amount, kind: base.kind, dueDate: date, competenceDate: date,
    installmentIndex: null, installmentTotal: null, status: 'pending', origin: 'manual', excludeFromCalc: false,
    metadata: null, createdAt: now, updatedAt: now,
  }
}

/** Uma compra parcelada vira uma parcela por mês, a partir da fatura em que foi lançada. */
export function planInstallments(
  base: NewEntryBase, firstMonth: string, day: number, count: number, makeId: () => string, now: string,
): FinanceEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    ...newSheetEntry(base, shiftMonth(firstMonth, index), day, makeId(), now),
    installmentIndex: count > 1 ? index + 1 : null,
    installmentTotal: count > 1 ? count : null,
  }))
}

/** Parcelas seguintes da mesma compra; com `amount`, para na primeira que já tem outro valor. */
export function nextInstallments(entries: FinanceEntry[], entry: FinanceEntry, amount?: number): FinanceEntry[] {
  if (entry.installmentIndex == null || entry.installmentTotal == null) return []
  const later = entries
    .filter((item) => item.id !== entry.id && item.kind === entry.kind && item.accountId === entry.accountId
      && item.title === entry.title && item.installmentTotal === entry.installmentTotal
      && (item.installmentIndex ?? 0) > entry.installmentIndex!)
    .sort((a, b) => a.installmentIndex! - b.installmentIndex!)
  if (amount === undefined) return later
  const stop = later.findIndex((item) => item.amount !== amount)
  return stop < 0 ? later : later.slice(0, stop)
}

/** Lote que desfaz `batch`: restaura o estado anterior, apaga o que foi criado e recria o que foi excluído. */
export function invertBatch(previous: FinanceEntry[], batch: EntryBatchRequest): EntryBatchRequest {
  const byId = new Map(previous.map((entry) => [entry.id, entry]))
  const upserts: FinanceEntry[] = []
  const deletes: string[] = []
  for (const change of batch.upserts) {
    const before = change.id ? byId.get(change.id) : undefined
    if (before) upserts.push(before)
    else if (change.id) deletes.push(change.id)
  }
  for (const id of batch.deletes) {
    const before = byId.get(id)
    if (before) upserts.push(before)
  }
  return { upserts, deletes }
}
