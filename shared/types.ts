export type ThemeMode = 'light' | 'dark' | 'eva' | 'cyberpunk' | 'arasaka' | 'custom' | 'system'
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

export interface DashboardConfig {
  visibleWidgets: string[]
  sortMode: 'date_asc' | 'date_desc' | 'amount_desc'
  defaultRange: 'month' | 'quarter' | 'year'
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
