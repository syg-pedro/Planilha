import type { Account, EntryKind, EntryStatus, FinanceEntry, PeriodMode } from './types'

export interface FinanceQuery {
  month: string
  range: 'month' | 'quarter' | 'year'
  presentation: 'matrix' | 'list'
  dateMode: PeriodMode
  search: string
  kind: 'all' | EntryKind
  status: 'all' | EntryStatus
  accountId: string
}

export const isFinanceMonth = (value: unknown): value is string =>
  typeof value === 'string' && /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value)

export const shiftFinanceMonth = (month: string, offset: number): string => {
  const [year = 2026, index = 1] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, index - 1 + offset, 1))
  return date.toISOString().slice(0, 7)
}

export const createFinanceQuery = (month: string, dateMode: PeriodMode = 'due_date'): FinanceQuery => ({
  month,
  range: 'year',
  presentation: 'matrix',
  dateMode,
  search: '',
  kind: 'all',
  status: 'all',
  accountId: ''
})

export const financeQueryMonths = (query: FinanceQuery): string[] =>
  Array.from({ length: query.range === 'year' ? 12 : query.range === 'quarter' ? 3 : 1 }, (_, index) =>
    shiftFinanceMonth(query.month, index)
  )

/** Outstanding expenses come first; each group keeps the selected date criterion. */
export const sortFinanceListEntries = (
  entries: FinanceEntry[],
  dateMode: PeriodMode = 'due_date'
): FinanceEntry[] => {
  const priority = (entry: FinanceEntry) => entry.status === 'paid' ? 2 : entry.kind === 'expense' ? 0 : 1
  const date = (entry: FinanceEntry) => dateMode === 'competence' ? entry.competenceDate : entry.dueDate
  return [...entries].sort((a, b) =>
    priority(a) - priority(b) || date(a).localeCompare(date(b)) || a.title.localeCompare(b.title, 'pt-BR')
  )
}

/** Presentation never changes the records, period, search or financial exclusions. */
export const filterFinanceQuery = (
  entries: FinanceEntry[],
  accounts: Account[],
  query: FinanceQuery
): FinanceEntry[] => {
  const months = new Set(financeQueryMonths(query))
  const accountMap = new Map(accounts.map((account) => [account.id, account]))
  const search = query.search.trim().toLocaleLowerCase('pt-BR')
  return entries.filter((entry) => {
    const date = query.dateMode === 'competence' ? entry.competenceDate : entry.dueDate
    if (!months.has(date.slice(0, 7))) return false
    if (query.kind !== 'all' && entry.kind !== query.kind) return false
    if (query.status !== 'all' && entry.status !== query.status) return false
    if (query.accountId && (entry.accountId ?? 'none') !== query.accountId) return false
    const account = accountMap.get(entry.accountId ?? '')
    return (
      !search ||
      [entry.title, entry.description, account?.name, account?.owner]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(search)
    )
  })
}

export const hasFinanceQueryFilters = (query: FinanceQuery) =>
  Boolean(query.search.trim() || query.kind !== 'all' || query.status !== 'all' || query.accountId)

export const parseFinanceQuery = (values: Record<string, unknown>, current: FinanceQuery): FinanceQuery => ({
  ...current,
  month: isFinanceMonth(values.month) ? values.month : current.month,
  range: ['month', 'quarter', 'year'].includes(String(values.range))
    ? (values.range as FinanceQuery['range'])
    : current.range,
  presentation: ['matrix', 'list'].includes(String(values.view))
    ? (values.view as FinanceQuery['presentation'])
    : current.presentation,
  dateMode: ['due_date', 'competence'].includes(String(values.date))
    ? (values.date as PeriodMode)
    : current.dateMode,
  search: typeof values.q === 'string' ? values.q : current.search,
  kind: ['all', 'expense', 'income'].includes(String(values.kind))
    ? (values.kind as FinanceQuery['kind'])
    : current.kind,
  status: ['all', 'pending', 'paid', 'review'].includes(String(values.status))
    ? (values.status as FinanceQuery['status'])
    : current.status,
  accountId: typeof values.account === 'string' ? values.account : current.accountId
})

export const serializeFinanceQuery = (query: FinanceQuery): Record<string, string> => ({
  month: query.month,
  range: query.range,
  view: query.presentation,
  date: query.dateMode,
  q: query.search,
  kind: query.kind,
  status: query.status,
  account: query.accountId
})
