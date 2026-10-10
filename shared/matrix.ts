import { excludeBenefitEntries } from './finance'
import type { Account, EntryKind, FinanceEntry, PeriodMode } from './types'

export type MatrixGroup = 'expenses' | 'cards' | 'income' | 'excluded'
export interface MatrixValue {
  entries: FinanceEntry[]
  amount: number
  paid: number
  pending: number
  status: 'paid' | 'pending' | 'mixed' | 'review' | null
}
export interface MatrixRow {
  id: string
  title: string
  kind: EntryKind
  group: MatrixGroup
  account: Account | null
  entries: FinanceEntry[]
  cells: Record<string, MatrixValue>
  total: number
  dueDays: number[]
}
export interface MatrixMonthSummary {
  income: number
  expense: number
  net: number
  paid: number
  received: number
  pendingExpense: number
  pendingIncome: number
  settledNet: number
  excluded: number
  incomeCount: number
  expenseCount: number
}

export const sumMoney = (values: number[]) =>
  values.reduce((total, value) => total + Math.round(value * 100), 0) / 100
export const matrixDate = (entry: FinanceEntry, mode: PeriodMode) =>
  mode === 'competence' ? entry.competenceDate : entry.dueDate
export function matrixMonths(start: string, count = 12): string[] {
  const [year = 2026, month = 1] = start.split('-').map(Number)
  return Array.from({ length: count }, (_, index) =>
    new Date(Date.UTC(year, month - 1 + index, 1)).toISOString().slice(0, 7),
  )
}
export function matrixValue(entries: FinanceEntry[]): MatrixValue {
  const hasPaid = entries.some((entry) => entry.status === 'paid')
  const hasPending = entries.some((entry) => entry.status !== 'paid')
  return {
    entries,
    amount: sumMoney(entries.map((entry) => entry.amount)),
    paid: sumMoney(entries.filter((entry) => entry.status === 'paid').map((entry) => entry.amount)),
    pending: sumMoney(entries.filter((entry) => entry.status !== 'paid').map((entry) => entry.amount)),
    status:
      entries.length === 0
        ? null
        : hasPaid && hasPending
          ? 'mixed'
          : hasPaid
            ? 'paid'
            : entries.some((entry) => entry.status === 'review')
              ? 'review'
              : 'pending',
  }
}
export function matrixRowId(entry: FinanceEntry, accounts: Account[]): string {
  const account = accounts.find((account) => account.id === entry.accountId)
  const excluded = entry.excludeFromCalc || account?.type === 'benefit'
  if (!excluded && entry.kind === 'expense' && account?.type === 'credit_card') {
    return JSON.stringify(['card', account.id])
  }
  return JSON.stringify([
    excluded ? 'excluded' : entry.kind,
    entry.kind,
    entry.accountId,
    entry.ruleId,
    entry.title,
  ])
}

/** Cells retain their source records; aggregating a fatura never replaces its purchases. */
export function buildFinanceMatrix(
  entries: FinanceEntry[],
  accounts: Account[],
  months: string[],
  mode: PeriodMode = 'due_date',
) {
  const accountMap = new Map(accounts.map((account) => [account.id, account]))
  const cashIds = new Set(excludeBenefitEntries(entries, accounts).map((entry) => entry.id))
  const grouped = new Map<string, FinanceEntry[]>()
  for (const entry of entries) {
    const id = matrixRowId(entry, accounts)
    const list = grouped.get(id) ?? []
    list.push(entry)
    grouped.set(id, list)
  }
  const rows: MatrixRow[] = []
  for (const [id, records] of grouped) {
    const first = records[0]!
    const account = accountMap.get(first.accountId ?? '') ?? null
    const group: MatrixGroup = !cashIds.has(first.id)
      ? 'excluded'
      : first.kind === 'income'
        ? 'income'
        : account?.type === 'credit_card'
          ? 'cards'
          : 'expenses'
    const cells = Object.fromEntries(
      months.map((month) => [
        month,
        matrixValue(records.filter((entry) => matrixDate(entry, mode).startsWith(month))),
      ]),
    )
    const periodEntries = Object.values(cells).flatMap((cell) => cell.entries)
    if (!periodEntries.length) continue
    rows.push({
      id,
      title: group === 'cards' ? account!.name : first.title,
      kind: first.kind,
      group,
      account,
      entries: records,
      cells,
      total: sumMoney(Object.values(cells).map((cell) => cell.amount)),
      dueDays: [...new Set(periodEntries.map((entry) => Number(entry.dueDate.slice(8, 10))))].sort(
        (a, b) => a - b,
      ),
    })
  }
  for (const account of accounts.filter((account) => account.type === 'credit_card' && account.active)) {
    const id = JSON.stringify(['card', account.id])
    if (rows.some((row) => row.id === id)) continue
    rows.push({
      id,
      title: account.name,
      kind: 'expense',
      group: 'cards',
      account,
      entries: grouped.get(id) ?? [],
      cells: Object.fromEntries(months.map((month) => [month, matrixValue([])])),
      total: 0,
      dueDays: account.dueDay ? [account.dueDay] : [],
    })
  }
  rows.sort((a, b) => (a.dueDays[0] ?? 32) - (b.dueDays[0] ?? 32) || a.title.localeCompare(b.title, 'pt-BR'))

  const summaries: Record<string, MatrixMonthSummary> = {}
  for (const month of months) {
    const period = entries.filter((entry) => matrixDate(entry, mode).startsWith(month))
    const cash = period.filter((entry) => cashIds.has(entry.id))
    const income = cash.filter((entry) => entry.kind === 'income')
    const expense = cash.filter((entry) => entry.kind === 'expense')
    const incomeCell = matrixValue(income),
      expenseCell = matrixValue(expense)
    summaries[month] = {
      income: incomeCell.amount,
      expense: expenseCell.amount,
      net: sumMoney([incomeCell.amount, -expenseCell.amount]),
      paid: expenseCell.paid,
      received: incomeCell.paid,
      pendingExpense: expenseCell.pending,
      pendingIncome: incomeCell.pending,
      settledNet: sumMoney([incomeCell.paid, -expenseCell.paid]),
      excluded: sumMoney(period.filter((entry) => !cashIds.has(entry.id)).map((entry) => entry.amount)),
      incomeCount: income.length,
      expenseCount: expense.length,
    }
  }
  return { rows, summaries }
}

/** This estimate considers all registered unpaid expenses, including future installments. */
export function matrixCardCommitment(entries: FinanceEntry[], account: Account) {
  const committed = sumMoney(
    entries
      .filter(
        (entry) => entry.kind === 'expense' && entry.accountId === account.id && entry.status !== 'paid',
      )
      .map((entry) => entry.amount),
  )
  return {
    committed,
    available: account.limitTotal === null ? null : sumMoney([account.limitTotal, -committed]),
  }
}
