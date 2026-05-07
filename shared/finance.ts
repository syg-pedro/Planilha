import { monthKey, parseIsoDate } from './date'
import type { Account, DashboardFilters, FinanceEntry, FinanceKpis, PeriodMode } from './types'

export const applyFilters = (entries: FinanceEntry[], filters: DashboardFilters): FinanceEntry[] => {
  const now = new Date()
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const months = filters.range === 'year' ? 12 : filters.range === 'quarter' ? 3 : 1
  const end = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + months, 0))

  return entries.filter((entry) => {
    const sourceDate = filters.periodMode === 'competence' ? entry.competenceDate : entry.dueDate
    const date = parseIsoDate(sourceDate)
    if (date < currentMonth || date > end) {
      return false
    }
    if (filters.accountIds.length > 0 && entry.accountId && !filters.accountIds.includes(entry.accountId)) {
      return false
    }
    if (filters.categoryIds.length > 0 && entry.categoryId && !filters.categoryIds.includes(entry.categoryId)) {
      return false
    }
    return true
  })
}

export const computeKpis = (entries: FinanceEntry[], accounts: Account[]): FinanceKpis => {
  const now = new Date()
  const seven = new Date(now)
  seven.setUTCDate(now.getUTCDate() + 7)

  const totalIncome = entries
    .filter((entry) => entry.kind === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const totalExpense = entries
    .filter((entry) => entry.kind === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const pendingAmount = entries
    .filter((entry) => entry.status !== 'paid')
    .reduce((sum, entry) => sum + (entry.kind === 'expense' ? entry.amount : -entry.amount), 0)

  const upcoming7Days = entries
    .filter((entry) => {
      const due = parseIsoDate(entry.dueDate)
      return due >= now && due <= seven && entry.status !== 'paid'
    })
    .reduce((sum, entry) => sum + (entry.kind === 'expense' ? entry.amount : 0), 0)

  const totalLimit = accounts
    .filter((account) => account.type === 'credit_card' && account.limitTotal)
    .reduce((sum, account) => sum + (account.limitTotal ?? 0), 0)

  const cardExpenses = entries
    .filter((entry) => entry.kind === 'expense' && entry.accountId && accounts.some((account) => account.id === entry.accountId && account.type === 'credit_card'))
    .reduce((sum, entry) => sum + entry.amount, 0)

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    pendingAmount,
    upcoming7Days,
    cardsUsedPercent: totalLimit > 0 ? (cardExpenses / totalLimit) * 100 : 0
  }
}

export const buildCashflowSeries = (entries: FinanceEntry[], periodMode: PeriodMode): { month: string; income: number; expense: number; net: number }[] => {
  const map = new Map<string, { income: number; expense: number }>()

  for (const entry of entries) {
    const key = monthKey(periodMode === 'competence' ? entry.competenceDate : entry.dueDate)
    const current = map.get(key) ?? { income: 0, expense: 0 }
    if (entry.kind === 'income') {
      current.income += entry.amount
    } else {
      current.expense += entry.amount
    }
    map.set(key, current)
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({ month, income: values.income, expense: values.expense, net: values.income - values.expense }))
}

export const buildCategoryBreakdown = (entries: FinanceEntry[]): Record<string, number> => {
  const result: Record<string, number> = {}
  for (const entry of entries) {
    if (entry.kind !== 'expense') {
      continue
    }
    const key = entry.categoryId ?? 'sem-categoria'
    result[key] = (result[key] ?? 0) + entry.amount
  }
  return result
}

export const buildCardBreakdown = (entries: FinanceEntry[]): Record<string, number> => {
  const result: Record<string, number> = {}
  for (const entry of entries) {
    if (entry.kind !== 'expense') {
      continue
    }
    const key = entry.accountId ?? 'sem-conta'
    result[key] = (result[key] ?? 0) + entry.amount
  }
  return result
}

export const buildProjection = (entries: FinanceEntry[], periodMode: PeriodMode): { month: string; balance: number }[] => {
  const cashflow = buildCashflowSeries(entries, periodMode)
  let running = 0
  return cashflow.map((item) => {
    running += item.net
    return {
      month: item.month,
      balance: running
    }
  })
}

export const buildHeatmap = (entries: FinanceEntry[]): { day: number; month: string; value: number }[] => {
  return entries
    .filter((entry) => entry.kind === 'expense')
    .map((entry) => {
      const date = parseIsoDate(entry.dueDate)
      return {
        day: date.getUTCDate(),
        month: monthKey(entry.dueDate),
        value: entry.amount
      }
    })
}
