import type { FinanceEntry, PeriodMode } from './types'

export const civilDate = (now = new Date(), timezone = 'America/Sao_Paulo'): string => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(p => p.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export const shiftMonth = (month: string, offset: number): string => {
  const [year, index] = month.split('-').map(Number)
  return new Date(Date.UTC(year!, index! - 1 + offset, 1)).toISOString().slice(0, 7)
}

export const entriesInPeriod = (entries: FinanceEntry[], start: string, endExclusive: string, mode: PeriodMode): FinanceEntry[] =>
  entries.filter(entry => {
    const date = mode === 'competence' ? entry.competenceDate : entry.dueDate
    return date >= start && date < endExclusive
  })

export const reportBounds = (period: 'month' | 'quarter' | '6months' | 'year', now = new Date(), timezone = 'America/Sao_Paulo') => {
  const month = civilDate(now, timezone).slice(0, 7)
  const start = period === 'year' ? `${month.slice(0, 4)}-01` : shiftMonth(month, period === 'quarter' ? -2 : period === '6months' ? -5 : 0)
  const end = period === 'year' ? `${Number(month.slice(0, 4)) + 1}-01` : shiftMonth(month, 1)
  return { start: `${start}-01`, end: `${end}-01` }
}
