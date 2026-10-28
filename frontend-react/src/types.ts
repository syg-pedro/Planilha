export type {
  Account, Category, FinanceEntry, FinanceRule, HouseholdSettings, WishItem,
  BootstrapResponse, OnboardingImportPayload, OnboardingImportPreview
} from '../../shared/types'

export type Sessao = {
  accessToken: string
  expiresAt: string
  user: { id: string; name: string; email: string }
  family: { id: string; name: string; role: 'owner' | 'member' }
}

export type Filtros = {
  from?: string; to?: string; periodMode?: string; accountId?: string
  categoryId?: string; kind?: string; status?: string; search?: string
}

export type Resumo = {
  totals: { income: number; expense: number; net: number; paid: number; received: number
    pendingExpense: number; pendingIncome: number; settledNet: number; excluded: number
    incomeCount: number; expenseCount: number }
  kpis: { totalIncome: number; totalExpense: number; net: number; pendingAmount: number
    upcoming7Days: number; cardsUsedPercent: number }
  cashflow: { month: string; income: number; expense: number; net: number }[]
  projection: { month: string; balance: number }[]
  categories: Record<string, number>
  cards: { accountId: string; name: string; limitTotal: number | null; expense: number
    globalCommitted: number; available: number | null; usagePercent: number }[]
  paymentCycles: { id: string; startDay: number; endDay: number; pendingTotal: number
    pendingCount: number; projectedBalanceImpact: number }[]
  savingsRate: number
  persons: { name: string; income: number; expense: number; net: number }[]
  dailyExpenses: Record<string, number>
}

export type Planejamento = {
  rows: { month: string; label: string; income: number; expense: number; net: number
    accumulated: number; hasRecords: boolean; isCurrentMonth: boolean }[]
  totals: { totalIncome: number; totalExpense: number; totalNet: number
    projectedIncome: number; projectedExpense: number; projectedNet: number
    riskMonths: number; recordedMonths: number }
}

export type Dividas = {
  groups: { key: string; title: string; catName: string; accountName: string; accountId: string | null
    entries: import('../../shared/types').FinanceEntry[]; paidCount: number; totalCount: number
    totalAmount: number; pendingAmount: number; installmentAmount: number }[]
  summary: { totalPending: number; totalAmount: number; paidCount: number; totalCount: number; thisMonth: number }
}

export type Matriz = {
  months: string[]
  rows: { id: string; title: string; kind: 'income' | 'expense'; group: string
    account: import('../../shared/types').Account | null; entries: import('../../shared/types').FinanceEntry[]
    cells: Record<string, { entries: import('../../shared/types').FinanceEntry[]; amount: number; paid: number; pending: number; status: string | null }>
    total: number; dueDays: number[] }[]
  summaries: Record<string, Resumo['totals']>
  totals: Resumo['totals']
  cardCommitments: Record<string, { committed: number; available: number | null }>
}
