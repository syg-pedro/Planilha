// ============================================================================
// TIPOS DE DOMÍNIO - PLANILHA (JAVA + REACT)
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'custom' | 'system'
export type DensityMode = 'compact' | 'comfortable'
export type PeriodMode = 'due_date' | 'competence'
export type EntryKind = 'income' | 'expense'
export type EntryStatus = 'pending' | 'paid' | 'review'
export type EntryOrigin = 'auto' | 'manual' | 'imported'
export type OnboardingStatus = 'new' | 'active' | 'dismissed' | 'completed'

export interface OnboardingState {
  version: 1
  status: OnboardingStatus
  completedSteps: string[]
  updatedAt: string
}

export interface ColorTokens {
  primary: string
  accent: string
  positive: string
  negative: string
  neutral: string
  background: string
  card: string
}

export const UI_COLOR_ALIASES = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export type UiColorAlias = typeof UI_COLOR_ALIASES[number]
export const UI_ICON_SETS = ['lucide', 'bootstrap', 'heroicons', 'iconoir', 'material', 'phosphor', 'remix', 'tabler'] as const
export type UiIconSetId = typeof UI_ICON_SETS[number]
export const UI_PRESET_IDS = ['default', 'mono', 'cobalt', 'sky', 'mint', 'iris', 'crimson', 'coral', 'sunset', 'carbon', 'bubblegum', 'parchment'] as const
export type UiThemePresetId = typeof UI_PRESET_IDS[number]
export type UiShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950
export type UiShadeStop = UiShade | 'white' | 'black'

export interface StyleOptions {
  defaults?: {
    variant?: string
    size?: string
    variants?: Partial<Record<'buttons' | 'panels' | 'inputs', string>>
    colors?: Partial<Record<'buttons' | 'panels' | 'inputs', string>>
  }
  tokenShades?: Record<string, { light?: UiShadeStop; dark?: UiShadeStop }>
}

export interface UiThemePreferences {
  version: 1
  preset: UiThemePresetId
  colors?: Partial<Record<UiColorAlias, string>>
  font?: string
  icons?: UiIconSetId
  radius?: number
}

export interface DashboardConfig {
  visibleWidgets: string[]
  sortMode: 'date_asc' | 'date_desc' | 'amount_desc'
  defaultRange: 'month' | 'quarter' | 'year'
  uiTheme?: UiThemePreferences
}

export interface HouseholdSettings {
  id: string
  currency: string
  timezone: string
  themeMode: ThemeMode
  densityMode: DensityMode
  periodMode: PeriodMode
  horizonMonths: number
  notificationDays: number[]
  notificationTime: string
  colorTokens: ColorTokens
  dashboardConfig: DashboardConfig
  onboarding: OnboardingState
  updatedAt: string
}

export interface Account {
  id: string
  householdId: string
  name: string
  owner: string
  type: 'bank' | 'credit_card' | 'benefit' | 'external'
  limitTotal: number | null
  closingDay: number | null
  dueDay: number | null
  active: boolean
}

export interface Category {
  id: string
  householdId: string
  name: string
  kind: EntryKind
  color: string
}

export interface FinanceRule {
  id: string
  householdId: string
  title: string
  description: string
  accountId: string | null
  categoryId: string | null
  amount: number
  kind: EntryKind
  dueDay: number | null
  frequency: 'monthly' | 'manual'
  startsAt: string
  endsAt: string | null
  autoGenerate: boolean
  metadata: Record<string, unknown> | null
}

export interface FinanceEntry {
  id: string
  householdId: string
  ruleId: string | null
  accountId: string | null
  categoryId: string | null
  title: string
  description: string
  amount: number
  kind: EntryKind
  dueDate: string
  competenceDate: string
  installmentIndex: number | null
  installmentTotal: number | null
  status: EntryStatus
  origin: EntryOrigin
  excludeFromCalc: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface DashboardFilters {
  range: 'month' | 'quarter' | 'year'
  periodMode: PeriodMode
  categoryIds: string[]
  accountIds: string[]
}

export interface FinanceKpis {
  totalIncome: number
  totalExpense: number
  net: number
  pendingAmount: number
  upcoming7Days: number
  cardsUsedPercent: number
}

export interface ExpensePaymentCycle {
  id: 'first-half' | 'second-half'
  startDay: number
  endDay: number
  pendingTotal: number
  pendingCount: number
  projectedBalanceImpact: number
}

export interface BootstrapResponse {
  settings: HouseholdSettings
  accounts: Account[]
  categories: Category[]
  rules: FinanceRule[]
  entries: FinanceEntry[]
  kpis: FinanceKpis
  warnings: string[]
}

export interface EntryBatchRequest {
  upserts: Partial<FinanceEntry>[]
  deletes: string[]
}

export interface ThemeSettingsRequest {
  themeMode: ThemeMode
  densityMode: DensityMode
  colorTokens: ColorTokens
}

export interface DashboardSettingsRequest {
  dashboardConfig: DashboardConfig
  periodMode: PeriodMode
  notificationTime?: string
}

export interface OnboardingAccountInput {
  sourceRow: number
  name: string
  type: Account['type']
  owner: string
  limitTotal: number | null
  closingDay: number | null
  dueDay: number | null
}

export interface OnboardingCategoryInput {
  sourceRow: number
  name: string
  kind: EntryKind
  color: string
}

export interface OnboardingRuleInput {
  sourceRow: number
  title: string
  kind: EntryKind
  amount: number
  dueDay: number
  accountName: string | null
  categoryName: string | null
}

export interface OnboardingEntryInput {
  sourceRow: number
  title: string
  kind: EntryKind
  amount: number
  dueDate: string
  accountName: string | null
  categoryName: string | null
  status: EntryStatus
  installmentIndex: number | null
  installmentTotal: number | null
}

export interface OnboardingImportPayload {
  version: 1
  accounts: OnboardingAccountInput[]
  categories: OnboardingCategoryInput[]
  rules: OnboardingRuleInput[]
  entries: OnboardingEntryInput[]
}

export interface OnboardingImportSummary {
  accounts: number
  categories: number
  rules: number
  generatedEntries: number
  entries: number
}

export interface OnboardingImportPreview extends OnboardingImportSummary {
  warnings: string[]
  canImport: boolean
}

export type WishPriority = 'high' | 'medium' | 'low'
export type WishStatus = 'want' | 'saving' | 'bought'

export interface WishItem {
  id: string
  householdId: string
  name: string
  price: number | null
  url: string | null
  imageUrl: string | null
  notes: string | null
  priority: WishPriority
  status: WishStatus
  category: string | null
  createdAt: string
  updatedAt: string
}

// ----------------------------------------------------------------------------
// TIPOS ESPECÍFICOS DA APLICAÇÃO REACT & SESSÃO
// ----------------------------------------------------------------------------

export type Sessao = {
  accessToken: string
  expiresAt: string
  user: { id: string; name: string; email: string }
  family: { id: string; name: string; role: 'owner' | 'member' }
}

export type Filtros = {
  from?: string
  to?: string
  periodMode?: string
  accountId?: string
  categoryId?: string
  kind?: string
  status?: string
  search?: string
}

export type Resumo = {
  totals: {
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
  kpis: {
    totalIncome: number
    totalExpense: number
    net: number
    pendingAmount: number
    upcoming7Days: number
    cardsUsedPercent: number
  }
  cashflow: { month: string; income: number; expense: number; net: number }[]
  projection: { month: string; balance: number }[]
  categories: Record<string, number>
  cards: {
    accountId: string
    name: string
    limitTotal: number | null
    expense: number
    globalCommitted: number
    available: number | null
    usagePercent: number
  }[]
  paymentCycles: {
    id: string
    startDay: number
    endDay: number
    pendingTotal: number
    pendingCount: number
    projectedBalanceImpact: number
  }[]
  savingsRate: number
  persons: { name: string; income: number; expense: number; net: number }[]
  dailyExpenses: Record<string, number>
}

export type Planejamento = {
  rows: {
    month: string
    label: string
    income: number
    expense: number
    net: number
    accumulated: number
    hasRecords: boolean
    isCurrentMonth: boolean
  }[]
  totals: {
    totalIncome: number
    totalExpense: number
    totalNet: number
    projectedIncome: number
    projectedExpense: number
    projectedNet: number
    riskMonths: number
    recordedMonths: number
  }
}

export type Dividas = {
  groups: {
    key: string
    title: string
    catName: string
    accountName: string
    accountId: string | null
    entries: FinanceEntry[]
    paidCount: number
    totalCount: number
    totalAmount: number
    pendingAmount: number
    installmentAmount: number
  }[]
  summary: {
    totalPending: number
    totalAmount: number
    paidCount: number
    totalCount: number
    thisMonth: number
  }
}

export type Matriz = {
  months: string[]
  rows: {
    id: string
    title: string
    kind: 'income' | 'expense'
    group: string
    account: Account | null
    entries: FinanceEntry[]
    cells: Record<string, {
      entries: FinanceEntry[]
      amount: number
      paid: number
      pending: number
      status: string | null
    }>
    total: number
    dueDays: number[]
  }[]
  summaries: Record<string, Resumo['totals']>
  totals: Resumo['totals']
  cardCommitments: Record<string, { committed: number; available: number | null }>
}
