import { computeKpis, excludeBenefitEntries } from '#shared/finance'
import { matrixDate, sumMoney } from '#shared/matrix'
import type { Account, FinanceEntry, PeriodMode } from '#shared/types'

export type ReportPeriod = 'month' | 'quarter' | '6months' | 'year'
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function financialToday(timezone = 'America/Sao_Paulo', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function nextMonthlyDueDate(dueDay: number | null, today: string) {
  if (dueDay === null || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return null
  const [year = 2026, month = 1] = today.split('-').map(Number)
  const target = (offset: number) => {
    const lastDay = new Date(Date.UTC(year, month + offset, 0)).getUTCDate()
    return new Date(Date.UTC(year, month - 1 + offset, Math.min(dueDay, lastDay))).toISOString().slice(0, 10)
  }
  const current = target(0)
  return current >= today ? current : target(1)
}

export function buildAnnualPlan(entries: FinanceEntry[], accounts: Account[], year: number, mode: PeriodMode, currentMonth: string) {
  const eligible = excludeBenefitEntries(entries, accounts)
  let accumulated = 0
  const rows = Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`
    const records = eligible.filter(entry => matrixDate(entry, mode).startsWith(month))
    const kpis = computeKpis(records, accounts)
    accumulated = sumMoney([accumulated, kpis.net])
    return { month, label: `${monthNames[index]} ${year}`, income: kpis.totalIncome, expense: kpis.totalExpense, net: kpis.net, accumulated, hasRecords: records.length > 0, isCurrentMonth: month === currentMonth }
  })
  const recorded = rows.filter(row => row.hasRecords)
  const totalIncome = sumMoney(recorded.map(row => row.income))
  const totalExpense = sumMoney(recorded.map(row => row.expense))
  const remaining = 12 - recorded.length
  const projectedIncome = recorded.length ? sumMoney([totalIncome, (totalIncome / recorded.length) * remaining]) : 0
  const projectedExpense = recorded.length ? sumMoney([totalExpense, (totalExpense / recorded.length) * remaining]) : 0
  return {
    rows,
    totals: { totalIncome, totalExpense, totalNet: sumMoney([totalIncome, -totalExpense]), projectedIncome, projectedExpense, projectedNet: sumMoney([projectedIncome, -projectedExpense]), riskMonths: recorded.filter(row => row.net < 0).length, recordedMonths: recorded.length },
  }
}

export function filterReportEntries(entries: FinanceEntry[], accounts: Account[], period: ReportPeriod, mode: PeriodMode, currentMonth: string) {
  const [year = 2026, month = 1] = currentMonth.split('-').map(Number)
  const end = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10)
  const offset = period === 'quarter' ? -2 : period === '6months' ? -5 : 0
  const start = period === 'year' ? `${year}-01-01` : new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 10)
  return excludeBenefitEntries(entries, accounts).filter(entry => {
    const date = matrixDate(entry, mode)
    return date >= start && date < end
  })
}
