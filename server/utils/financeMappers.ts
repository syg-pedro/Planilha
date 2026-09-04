import { DEFAULT_COLORS, DEFAULT_DASHBOARD_CONFIG } from '../../shared/constants'
import { createDefaultOnboardingState } from '../../shared/onboarding'
import type { Account, Category, FinanceRule, FinanceEntry, HouseholdSettings, ThemeMode, WishItem, WishPriority, WishStatus } from '../../shared/types'
const toNumber = (value: unknown) => Number(value ?? 0)

export const mapSettingToRow = (settings: HouseholdSettings) => ({
  id: settings.id,
  currency: settings.currency,
  timezone: settings.timezone,
  theme_mode: settings.themeMode,
  density_mode: settings.densityMode,
  period_mode: settings.periodMode,
  horizon_months: settings.horizonMonths,
  notification_days: settings.notificationDays,
  notification_time: settings.notificationTime,
  color_tokens: settings.colorTokens,
  dashboard_config: settings.dashboardConfig,
  onboarding_state: settings.onboarding,
  updated_at: settings.updatedAt
})

export const mapAccountToRow = (account: Account) => ({
  id: account.id,
  household_id: account.householdId,
  name: account.name,
  owner: account.owner,
  type: account.type,
  limit_total: account.limitTotal,
  closing_day: account.closingDay,
  due_day: account.dueDay,
  active: account.active
})

export const mapCategoryToRow = (category: Category) => ({
  id: category.id,
  household_id: category.householdId,
  name: category.name,
  kind: category.kind,
  color: category.color
})

export const mapRuleToRow = (rule: FinanceRule) => ({
  id: rule.id,
  household_id: rule.householdId,
  title: rule.title,
  description: rule.description,
  account_id: rule.accountId,
  category_id: rule.categoryId,
  amount: rule.amount,
  kind: rule.kind,
  due_day: rule.dueDay,
  frequency: rule.frequency,
  starts_at: rule.startsAt,
  ends_at: rule.endsAt,
  auto_generate: rule.autoGenerate,
  metadata: rule.metadata
})

export const mapEntryToRow = (entry: FinanceEntry) => ({
  id: entry.id,
  household_id: entry.householdId,
  rule_id: entry.ruleId,
  account_id: entry.accountId,
  category_id: entry.categoryId,
  title: entry.title,
  description: entry.description,
  amount: entry.amount,
  kind: entry.kind,
  due_date: entry.dueDate,
  competence_date: entry.competenceDate,
  installment_index: entry.installmentIndex,
  installment_total: entry.installmentTotal,
  status: entry.status,
  origin: entry.origin,
  exclude_from_calc: entry.excludeFromCalc ?? false,
  metadata: entry.metadata,
  created_at: entry.createdAt,
  updated_at: entry.updatedAt
})

const normalizeThemeMode = (mode: string): ThemeMode => {
  if (mode === 'light' || mode === 'dark' || mode === 'custom' || mode === 'system') return mode
  return 'dark'
}

export const mapSettingFromRow = (row: Record<string, any>): HouseholdSettings => ({
  themeMode: normalizeThemeMode(row.theme_mode),
  id: row.id,
  currency: row.currency,
  timezone: row.timezone,
  densityMode: row.density_mode,
  periodMode: row.period_mode,
  horizonMonths: row.horizon_months,
  notificationDays: row.notification_days ?? [3, 1],
  notificationTime: row.notification_time ?? '09:00',
  colorTokens: { ...DEFAULT_COLORS, ...(row.color_tokens ?? {}) },
  dashboardConfig: { ...DEFAULT_DASHBOARD_CONFIG, ...(row.dashboard_config ?? {}) },
  onboarding: {
    ...createDefaultOnboardingState(),
    ...(row.onboarding_state ?? {}),
  },
  updatedAt: row.updated_at
})

export const mapAccountFromRow = (row: Record<string, any>): Account => ({
  id: row.id,
  householdId: row.household_id,
  name: row.name,
  owner: row.owner,
  type: row.type,
  limitTotal: row.limit_total,
  closingDay: row.closing_day,
  dueDay: row.due_day,
  active: row.active
})

export const mapCategoryFromRow = (row: Record<string, any>): Category => ({
  id: row.id,
  householdId: row.household_id,
  name: row.name,
  kind: row.kind,
  color: row.color
})

export const mapRuleFromRow = (row: Record<string, any>): FinanceRule => ({
  id: row.id,
  householdId: row.household_id,
  title: row.title,
  description: row.description,
  accountId: row.account_id,
  categoryId: row.category_id,
  amount: toNumber(row.amount),
  kind: row.kind,
  dueDay: row.due_day,
  frequency: row.frequency,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  autoGenerate: row.auto_generate,
  metadata: row.metadata
})

export const mapEntryFromRow = (row: Record<string, any>): FinanceEntry => ({
  id: row.id,
  householdId: row.household_id,
  ruleId: row.rule_id,
  accountId: row.account_id,
  categoryId: row.category_id,
  title: row.title,
  description: row.description,
  amount: toNumber(row.amount),
  kind: row.kind,
  dueDate: row.due_date,
  competenceDate: row.competence_date,
  installmentIndex: row.installment_index,
  installmentTotal: row.installment_total,
  status: row.status,
  origin: row.origin,
  excludeFromCalc: row.exclude_from_calc ?? false,
  metadata: row.metadata,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

export const mapWishItemFromRow = (row: Record<string, any>): WishItem => ({
  id: row.id,
  householdId: row.household_id,
  name: row.name,
  price: row.price != null ? toNumber(row.price) : null,
  url: row.url ?? null,
  imageUrl: row.image_url ?? null,
  notes: row.notes ?? null,
  priority: (row.priority ?? 'medium') as WishPriority,
  status: (row.status ?? 'want') as WishStatus,
  category: row.category ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})
