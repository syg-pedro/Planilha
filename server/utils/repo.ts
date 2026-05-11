import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_COLORS, DEFAULT_DASHBOARD_CONFIG, DEFAULT_HOUSEHOLD_ID } from '../../shared/constants'
import { DEFAULT_DADOS_TEXT } from '../../shared/defaultDadosText'
import { computeKpis } from '../../shared/finance'
import { parseDadosText } from '../../shared/parser'
import { buildEntriesFromRules } from '../../shared/rules'
import { makeId } from '../../shared/id'
import type {
  Account,
  BootstrapResponse,
  Category,
  DashboardSettingsRequest,
  FinanceEntry,
  FinanceRule,
  HouseholdSettings,
  ThemeSettingsRequest,
  WishItem,
  WishPriority,
  WishStatus
} from '../../shared/types'

interface Repository {
  bootstrap: () => Promise<BootstrapResponse>
  saveEntriesBatch: (upserts: Partial<FinanceEntry>[], deletes: string[]) => Promise<FinanceEntry[]>
  rebuildRules: () => Promise<number>
  reseedEntries: () => Promise<number>
  saveTheme: (payload: ThemeSettingsRequest) => Promise<HouseholdSettings>
  saveDashboard: (payload: DashboardSettingsRequest) => Promise<HouseholdSettings>
  importCsv: (csvText: string, accountId: string | null) => Promise<{ inserted: number; warnings: string[] }>
  saveRules: (upserts: Partial<FinanceRule>[], deletes: string[]) => Promise<FinanceRule[]>
  saveAccounts: (upserts: Partial<Account>[], deletes: string[]) => Promise<Account[]>
  getWishItems: () => Promise<WishItem[]>
  saveWishItems: (upserts: Partial<WishItem>[], deletes: string[]) => Promise<WishItem[]>
}

interface MemoryState {
  settings: HouseholdSettings
  accounts: Account[]
  categories: Category[]
  rules: FinanceRule[]
  entries: FinanceEntry[]
  warnings: string[]
  wishItems: WishItem[]
}

let memoryState: MemoryState | null = null

const toNumber = (value: unknown): number => {
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0))
  return Number.isFinite(num) ? num : 0
}

const splitCsvLine = (line: string, delimiter: string): string[] => {
  const values: string[] = []
  let current = ''
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (char === delimiter && !quoted) {
      values.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  values.push(current.trim())
  return values
}

const parseCsvRows = (csvText: string): Array<Record<string, string>> => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const delimiter = lines[0]?.includes(';') && !(lines[0]?.includes(',') ?? false) ? ';' : ','
  const headers = splitCsvLine(lines[0] ?? '', delimiter).map((header) => header.toLowerCase())
  const rows: Array<Record<string, string>> = []

  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line, delimiter)
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = cols[index] ?? ''
    })
    rows.push(row)
  }

  return rows
}

const createMemoryState = async (): Promise<MemoryState> => {
  const config = useRuntimeConfig()
  const configuredPath = (config.dataFilePath as string) || ''
  const candidatePaths = [configuredPath, join(process.cwd(), 'dados.txt')].filter(Boolean)
  let raw = DEFAULT_DADOS_TEXT

  for (const filePath of candidatePaths) {
    try {
      raw = await readFile(filePath, 'utf8')
      break
    } catch {
      // Fall back to bundled seed text when running in environments
      // where local files are unavailable (for example serverless).
    }
  }

  const seed = parseDadosText(raw)

  return {
    settings: seed.settings,
    accounts: seed.accounts,
    categories: seed.categories,
    rules: seed.rules,
    entries: seed.entries,
    warnings: [...seed.warnings],
    wishItems: []
  }
}

const getMemoryState = async (): Promise<MemoryState> => {
  if (!memoryState) {
    memoryState = await createMemoryState()
  }
  return memoryState
}

const buildBootstrap = (state: MemoryState): BootstrapResponse => ({
  settings: state.settings,
  accounts: state.accounts,
  categories: state.categories,
  rules: state.rules,
  entries: state.entries,
  kpis: computeKpis(state.entries, state.accounts),
  warnings: state.warnings
})

const makeMemoryRepo = (): Repository => ({
  async bootstrap() {
    const state = await getMemoryState()
    return buildBootstrap(state)
  },

  async saveEntriesBatch(upserts, deletes) {
    const state = await getMemoryState()
    const index = new Map(state.entries.map((entry) => [entry.id, entry]))

    for (const id of deletes) {
      index.delete(id)
    }

    for (const patch of upserts) {
      const now = new Date().toISOString()
      if (!patch.id || !index.has(patch.id)) {
        const entry: FinanceEntry = {
          id: patch.id ?? makeId('entry'),
          householdId: DEFAULT_HOUSEHOLD_ID,
          ruleId: patch.ruleId ?? null,
          accountId: patch.accountId ?? null,
          categoryId: patch.categoryId ?? null,
          title: patch.title ?? 'Novo lancamento',
          description: patch.description ?? '',
          amount: toNumber(patch.amount ?? 0),
          kind: patch.kind === 'income' ? 'income' : 'expense',
          dueDate: patch.dueDate ?? new Date().toISOString().slice(0, 10),
          competenceDate: patch.competenceDate ?? patch.dueDate ?? new Date().toISOString().slice(0, 10),
          installmentIndex: patch.installmentIndex ?? null,
          installmentTotal: patch.installmentTotal ?? null,
          status: patch.status ?? 'pending',
          origin: patch.origin ?? 'manual',
          excludeFromCalc: patch.excludeFromCalc ?? false,
          metadata: patch.metadata ?? null,
          createdAt: now,
          updatedAt: now
        }
        index.set(entry.id, entry)
        continue
      }

      const current = index.get(patch.id) as FinanceEntry
      index.set(patch.id, {
        ...current,
        ...patch,
        amount: toNumber(patch.amount ?? current.amount),
        updatedAt: now
      })
    }

    state.entries = [...index.values()].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return state.entries
  },

  async rebuildRules() {
    const state = await getMemoryState()
    state.entries = state.entries.filter((entry) => !(entry.origin === 'auto' && entry.metadata?.generatedFromRule))
    const generated = buildEntriesFromRules(state.rules, DEFAULT_HOUSEHOLD_ID, state.settings.horizonMonths)
    state.entries.push(...generated)
    state.entries.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return generated.length
  },

  async reseedEntries() {
    const state = await getMemoryState()
    const config = useRuntimeConfig()
    const configuredPath = (config.dataFilePath as string) || ''
    const candidatePaths = [configuredPath, join(process.cwd(), 'dados.txt')].filter(Boolean)
    let raw = DEFAULT_DADOS_TEXT
    for (const filePath of candidatePaths) {
      try { raw = await readFile(filePath, 'utf8'); break } catch { /* fallback */ }
    }
    const seed = parseDadosText(raw)
    state.entries = seed.entries
    state.entries.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return state.entries.length
  },

  async saveTheme(payload) {
    const state = await getMemoryState()
    state.settings = {
      ...state.settings,
      themeMode: payload.themeMode,
      densityMode: payload.densityMode,
      colorTokens: payload.colorTokens,
      updatedAt: new Date().toISOString()
    }
    return state.settings
  },

  async saveDashboard(payload) {
    const state = await getMemoryState()
    state.settings = {
      ...state.settings,
      dashboardConfig: payload.dashboardConfig,
      periodMode: payload.periodMode,
      updatedAt: new Date().toISOString()
    }
    return state.settings
  },

  async importCsv(csvText, accountId) {
    const state = await getMemoryState()
    const parsedRows = parseCsvRows(csvText)
    let inserted = 0
    const warnings: string[] = []

    for (const row of parsedRows) {
      const rawAmount = row.amount ?? row.valor ?? row.value
      const rawDate = row.date ?? row.data ?? row.duedate
      const rawTitle = row.title ?? row.descricao ?? row.description ?? 'Importado CSV'
      if (!rawAmount || !rawDate) {
        warnings.push('Linha CSV ignorada por faltar data ou valor.')
        continue
      }

      const amount = toNumber(rawAmount)
      const isExpense = amount >= 0
      const dueDate = String(rawDate).slice(0, 10)
      const entry: FinanceEntry = {
        id: makeId('entry'),
        householdId: DEFAULT_HOUSEHOLD_ID,
        ruleId: null,
        accountId,
        categoryId: null,
        title: rawTitle,
        description: 'Importado via CSV',
        amount: Math.abs(amount),
        kind: isExpense ? 'expense' : 'income',
        dueDate,
        competenceDate: dueDate,
        installmentIndex: null,
        installmentTotal: null,
        status: 'pending',
        origin: 'imported',
        excludeFromCalc: false,
        metadata: { csv: row },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      state.entries.push(entry)
      inserted += 1
    }

    return { inserted, warnings }
  },

  async saveRules(upserts, deletes) {
    const state = await getMemoryState()
    const index = new Map(state.rules.map(r => [r.id, r]))
    for (const id of deletes) index.delete(id)
    for (const patch of upserts) {
      const now = new Date().toISOString()
      const id  = patch.id ?? makeId('rule')
      const existing = index.get(id)
      if (existing) {
        index.set(id, { ...existing, ...patch, id })
      } else {
        index.set(id, {
          id,
          householdId:  DEFAULT_HOUSEHOLD_ID,
          title:        patch.title        ?? 'Nova regra',
          description:  patch.description  ?? '',
          accountId:    patch.accountId    ?? null,
          categoryId:   patch.categoryId   ?? null,
          amount:       toNumber(patch.amount ?? 0),
          kind:         patch.kind === 'income' ? 'income' : 'expense',
          dueDay:       patch.dueDay        ?? null,
          frequency:    patch.frequency     ?? 'monthly',
          startsAt:     patch.startsAt      ?? now.slice(0, 10),
          endsAt:       patch.endsAt        ?? null,
          autoGenerate: patch.autoGenerate  ?? false,
          metadata:     patch.metadata      ?? null
        })
      }
    }
    state.rules = [...index.values()]
    return state.rules
  },

  async saveAccounts(upserts, deletes) {
    const state = await getMemoryState()
    const index = new Map(state.accounts.map(a => [a.id, a]))
    for (const id of deletes) index.delete(id)
    for (const patch of upserts) {
      const id = patch.id ?? makeId('account')
      const existing = index.get(id)
      if (existing) {
        index.set(id, { ...existing, ...patch, id })
      } else {
        index.set(id, {
          id,
          householdId: DEFAULT_HOUSEHOLD_ID,
          name:        patch.name       ?? 'Nova conta',
          owner:       patch.owner      ?? '',
          type:        patch.type       ?? 'bank',
          limitTotal:  patch.limitTotal ?? null,
          closingDay:  patch.closingDay ?? null,
          dueDay:      patch.dueDay     ?? null,
          active:      patch.active     ?? true,
        })
      }
    }
    state.accounts = [...index.values()]
    return state.accounts
  },

  async getWishItems() {
    const state = await getMemoryState()
    return state.wishItems
  },

  async saveWishItems(upserts, deletes) {
    const state = await getMemoryState()
    const index = new Map(state.wishItems.map(w => [w.id, w]))
    for (const id of deletes) index.delete(id)
    for (const patch of upserts) {
      const now = new Date().toISOString()
      const id = patch.id ?? makeId('wish')
      const existing = index.get(id)
      if (existing) {
        index.set(id, { ...existing, ...patch, id, updatedAt: now })
      } else {
        index.set(id, {
          id,
          householdId: DEFAULT_HOUSEHOLD_ID,
          name: patch.name ?? 'Item',
          price: patch.price ?? null,
          url: patch.url ?? null,
          imageUrl: patch.imageUrl ?? null,
          notes: patch.notes ?? null,
          priority: (patch.priority ?? 'medium') as WishPriority,
          status: (patch.status ?? 'want') as WishStatus,
          category: patch.category ?? null,
          createdAt: now,
          updatedAt: now,
        })
      }
    }
    state.wishItems = [...index.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return state.wishItems
  },

})

const mapSettingToRow = (settings: HouseholdSettings) => ({
  id: settings.id,
  currency: settings.currency,
  timezone: settings.timezone,
  theme_mode: settings.themeMode,
  density_mode: settings.densityMode,
  period_mode: settings.periodMode,
  horizon_months: settings.horizonMonths,
  notification_days: settings.notificationDays,
  color_tokens: settings.colorTokens,
  dashboard_config: settings.dashboardConfig,
  updated_at: settings.updatedAt
})

const mapAccountToRow = (account: Account) => ({
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

const mapCategoryToRow = (category: Category) => ({
  id: category.id,
  household_id: category.householdId,
  name: category.name,
  kind: category.kind,
  color: category.color
})

const mapRuleToRow = (rule: FinanceRule) => ({
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

const mapEntryToRow = (entry: FinanceEntry) => ({
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

const mapSettingFromRow = (row: Record<string, any>): HouseholdSettings => ({
  // Backward compatibility: legacy persisted theme id `eva_01` now maps to `eva`.
  themeMode: row.theme_mode === 'eva_01' ? 'eva' : row.theme_mode,
  id: row.id,
  currency: row.currency,
  timezone: row.timezone,
  densityMode: row.density_mode,
  periodMode: row.period_mode,
  horizonMonths: row.horizon_months,
  notificationDays: row.notification_days ?? [3, 1],
  colorTokens: { ...DEFAULT_COLORS, ...(row.color_tokens ?? {}) },
  dashboardConfig: { ...DEFAULT_DASHBOARD_CONFIG, ...(row.dashboard_config ?? {}) },
  updatedAt: row.updated_at
})

const mapAccountFromRow = (row: Record<string, any>): Account => ({
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

const mapCategoryFromRow = (row: Record<string, any>): Category => ({
  id: row.id,
  householdId: row.household_id,
  name: row.name,
  kind: row.kind,
  color: row.color
})

const mapRuleFromRow = (row: Record<string, any>): FinanceRule => ({
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

const mapEntryFromRow = (row: Record<string, any>): FinanceEntry => ({
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

const mapWishItemFromRow = (row: Record<string, any>): WishItem => ({
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

const ensureSupabaseSeed = async (client: SupabaseClient): Promise<void> => {
  const { count, error } = await client
    .from('household_settings')
    .select('id', { count: 'exact', head: true })
    .eq('id', DEFAULT_HOUSEHOLD_ID)

  if (error) {
    throw error
  }

  if ((count ?? 0) > 0) {
    return
  }

  const state = await createMemoryState()
  await client.from('household_settings').upsert([mapSettingToRow(state.settings)])
  if (state.accounts.length > 0) await client.from('accounts').upsert(state.accounts.map(mapAccountToRow))
  if (state.categories.length > 0) await client.from('categories').upsert(state.categories.map(mapCategoryToRow))
  if (state.rules.length > 0) await client.from('rules').upsert(state.rules.map(mapRuleToRow))
  if (state.entries.length > 0) await client.from('entries').upsert(state.entries.map(mapEntryToRow))
}

const getSupabaseClient = (): SupabaseClient => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.supabaseUrl as string
  const supabaseKey = config.supabaseServiceKey as string

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })
}

const makeSupabaseRepo = (householdId: string): Repository => ({
  async bootstrap() {
    const client = getSupabaseClient()

    const [settingsRes, accountsRes, categoriesRes, rulesRes, entriesRes] = await Promise.all([
      client.from('household_settings').select('*').eq('id', householdId).single(),
      client.from('accounts').select('*').eq('household_id', householdId),
      client.from('categories').select('*').eq('household_id', householdId),
      client.from('rules').select('*').eq('household_id', householdId),
      client.from('entries').select('*').eq('household_id', householdId),
    ])

    if (settingsRes.error) throw settingsRes.error
    if (accountsRes.error) throw accountsRes.error
    if (categoriesRes.error) throw categoriesRes.error
    if (rulesRes.error) throw rulesRes.error
    if (entriesRes.error) throw entriesRes.error

    const settings   = mapSettingFromRow(settingsRes.data)
    const accounts   = (accountsRes.data ?? []).map(mapAccountFromRow)
    const categories = (categoriesRes.data ?? []).map(mapCategoryFromRow)
    const rules      = (rulesRes.data ?? []).map(mapRuleFromRow)
    const entries    = (entriesRes.data ?? []).map(mapEntryFromRow)

    return {
      settings, accounts, categories, rules, entries,
      kpis: computeKpis(entries, accounts),
      warnings: []
    }
  },

  async saveEntriesBatch(upserts, deletes) {
    const client = getSupabaseClient()

    if (deletes.length > 0) {
      const { error } = await client.from('entries').delete().in('id', deletes)
      if (error) throw error
    }

    if (upserts.length > 0) {
      const payload = upserts.map((entry) =>
        mapEntryToRow({
          id: entry.id ?? makeId('entry'),
          householdId,
          ruleId: entry.ruleId ?? null,
          accountId: entry.accountId ?? null,
          categoryId: entry.categoryId ?? null,
          title: entry.title ?? 'Novo lancamento',
          description: entry.description ?? '',
          amount: toNumber(entry.amount),
          kind: entry.kind === 'income' ? 'income' : 'expense',
          dueDate: entry.dueDate ?? new Date().toISOString().slice(0, 10),
          competenceDate: entry.competenceDate ?? entry.dueDate ?? new Date().toISOString().slice(0, 10),
          installmentIndex: entry.installmentIndex ?? null,
          installmentTotal: entry.installmentTotal ?? null,
          status: entry.status ?? 'pending',
          origin: entry.origin ?? 'manual',
          excludeFromCalc: entry.excludeFromCalc ?? false,
          metadata: entry.metadata ?? null,
          createdAt: entry.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      )
      const { error } = await client.from('entries').upsert(payload)
      if (error) throw error
    }

    const { data, error } = await client.from('entries').select('*').eq('household_id', householdId)
    if (error) throw error
    return (data ?? []).map(mapEntryFromRow)
  },

  async rebuildRules() {
    const client = getSupabaseClient()

    const { data: settingsRows, error: settingsError } = await client
      .from('household_settings')
      .select('*')
      .eq('id', householdId)
      .single()
    if (settingsError) throw settingsError

    const { data: rulesRows, error: rulesError } = await client.from('rules').select('*').eq('household_id', householdId)
    if (rulesError) throw rulesError

    const settings = mapSettingFromRow(settingsRows)
    const rules = (rulesRows ?? []).map(mapRuleFromRow)
    const generated = buildEntriesFromRules(rules, householdId, settings.horizonMonths)

    const { error: deleteError } = await client
      .from('entries')
      .delete()
      .eq('household_id', householdId)
      .eq('origin', 'auto')
    if (deleteError) throw deleteError

    if (generated.length > 0) {
      const { error: insertError } = await client.from('entries').insert(generated.map(mapEntryToRow))
      if (insertError) throw insertError
    }

    return generated.length
  },

  async reseedEntries() {
    const client = getSupabaseClient()
    const config = useRuntimeConfig()
    const configuredPath = (config.dataFilePath as string) || ''
    const candidatePaths = [configuredPath, join(process.cwd(), 'dados.txt')].filter(Boolean)
    let raw = DEFAULT_DADOS_TEXT
    for (const filePath of candidatePaths) {
      try { raw = await readFile(filePath, 'utf8'); break } catch { /* fallback */ }
    }
    const seed = parseDadosText(raw)

    // Delete in FK order
    const { error: delEntries } = await client.from('entries').delete().eq('household_id', householdId)
    if (delEntries) throw delEntries

    const { error: delBudgets } = await client.from('budgets').delete().eq('household_id', householdId)
    if (delBudgets) throw delBudgets

    const { error: delRules } = await client.from('rules').delete().eq('household_id', householdId)
    if (delRules) throw delRules

    const { error: delAccounts } = await client.from('accounts').delete().eq('household_id', householdId)
    if (delAccounts) throw delAccounts

    const { error: delCategories } = await client.from('categories').delete().eq('household_id', householdId)
    if (delCategories) throw delCategories

    // Re-insert in FK-safe order
    if (seed.accounts.length > 0) {
      const { error } = await client.from('accounts').insert(seed.accounts.map(mapAccountToRow))
      if (error) throw error
    }
    if (seed.categories.length > 0) {
      const { error } = await client.from('categories').insert(seed.categories.map(mapCategoryToRow))
      if (error) throw error
    }
    if (seed.rules.length > 0) {
      const { error } = await client.from('rules').insert(seed.rules.map(mapRuleToRow))
      if (error) throw error
    }
    if (seed.entries.length > 0) {
      const { error } = await client.from('entries').insert(seed.entries.map(mapEntryToRow))
      if (error) throw error
    }

    return seed.entries.length
  },

  async saveTheme(payload) {
    const client = getSupabaseClient()
    const updates = {
      theme_mode: payload.themeMode,
      density_mode: payload.densityMode,
      color_tokens: payload.colorTokens,
      updated_at: new Date().toISOString()
    }
    const { data, error } = await client
      .from('household_settings')
      .update(updates)
      .eq('id', householdId)
      .select('*')
      .single()

    if (error) throw error
    return mapSettingFromRow(data)
  },

  async saveDashboard(payload) {
    const client = getSupabaseClient()
    const updates = {
      dashboard_config: payload.dashboardConfig,
      period_mode: payload.periodMode,
      updated_at: new Date().toISOString()
    }
    const { data, error } = await client
      .from('household_settings')
      .update(updates)
      .eq('id', householdId)
      .select('*')
      .single()

    if (error) throw error
    return mapSettingFromRow(data)
  },

  async importCsv(csvText, accountId) {
    const client = getSupabaseClient()
    const parsedRows = parseCsvRows(csvText)
    const warnings: string[] = []
    const rows = parsedRows
      .map((row: Record<string, string>) => {
        const rawAmount = row.amount ?? row.valor ?? row.value
        const rawDate = row.date ?? row.data ?? row.duedate
        if (!rawAmount || !rawDate) {
          warnings.push('Linha CSV ignorada por faltar data ou valor.')
          return null
        }
        const dueDate = String(rawDate).slice(0, 10)
        const amount = toNumber(rawAmount)
        const kind = amount >= 0 ? 'expense' : 'income'
        const entry: FinanceEntry = {
          id: makeId('entry'),
          householdId,
          ruleId: null,
          accountId,
          categoryId: null,
          title: row.title ?? row.descricao ?? row.description ?? 'Importado CSV',
          description: 'Importado via CSV',
          amount: Math.abs(amount),
          kind,
          dueDate,
          competenceDate: dueDate,
          installmentIndex: null,
          installmentTotal: null,
          status: 'pending',
          origin: 'imported',
          excludeFromCalc: false,
          metadata: { csv: row },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        return mapEntryToRow(entry)
      })
      .filter(Boolean)

    if (rows.length > 0) {
      const { error } = await client.from('entries').insert(rows as Record<string, unknown>[])
      if (error) throw error
    }

    return { inserted: rows.length, warnings }
  },

  async saveRules(upserts, deletes) {
    const client = getSupabaseClient()
    if (deletes.length > 0) {
      const { error } = await client.from('rules').delete().in('id', deletes)
      if (error) throw error
    }
    if (upserts.length > 0) {
      const payload = upserts.map(r => mapRuleToRow({
        id:           r.id ?? makeId('rule'),
        householdId,
        title:        r.title        ?? 'Nova regra',
        description:  r.description  ?? '',
        accountId:    r.accountId    ?? null,
        categoryId:   r.categoryId   ?? null,
        amount:       toNumber(r.amount ?? 0),
        kind:         r.kind === 'income' ? 'income' : 'expense',
        dueDay:       r.dueDay        ?? null,
        frequency:    r.frequency     ?? 'monthly',
        startsAt:     r.startsAt      ?? new Date().toISOString().slice(0, 10),
        endsAt:       r.endsAt        ?? null,
        autoGenerate: r.autoGenerate  ?? false,
        metadata:     r.metadata      ?? null
      }))
      const { error } = await client.from('rules').upsert(payload)
      if (error) throw error
    }
    const { data, error } = await client.from('rules').select('*').eq('household_id', householdId)
    if (error) throw error
    return (data ?? []).map(mapRuleFromRow)
  },

  async saveAccounts(upserts, deletes) {
    const client = getSupabaseClient()
    if (deletes.length > 0) {
      const { error } = await client.from('accounts').delete().in('id', deletes)
      if (error) throw error
    }
    if (upserts.length > 0) {
      const payload = upserts.map(a => mapAccountToRow({
        id:          a.id          ?? makeId('account'),
        householdId,
        name:        a.name        ?? 'Nova conta',
        owner:       a.owner       ?? '',
        type:        a.type        ?? 'bank',
        limitTotal:  a.limitTotal  ?? null,
        closingDay:  a.closingDay  ?? null,
        dueDay:      a.dueDay      ?? null,
        active:      a.active      ?? true,
      }))
      const { error } = await client.from('accounts').upsert(payload)
      if (error) throw error
    }
    const { data, error } = await client.from('accounts').select('*').eq('household_id', householdId)
    if (error) throw error
    return (data ?? []).map(mapAccountFromRow)
  },

  async getWishItems() {
    const client = getSupabaseClient()
    const { data, error } = await client.from('wish_items').select('*').eq('household_id', householdId)
    if (error) throw error
    return (data ?? []).map(mapWishItemFromRow)
  },

  async saveWishItems(upserts, deletes) {
    const client = getSupabaseClient()
    if (deletes.length > 0) {
      const { error } = await client.from('wish_items').delete().in('id', deletes)
      if (error) throw error
    }
    if (upserts.length > 0) {
      const now = new Date().toISOString()
      const payload = upserts.map(w => ({
        id: w.id ?? makeId('wish'),
        household_id: householdId,
        name: w.name ?? 'Item',
        price: w.price ?? null,
        url: w.url ?? null,
        image_url: w.imageUrl ?? null,
        notes: w.notes ?? null,
        priority: w.priority ?? 'medium',
        status: w.status ?? 'want',
        category: w.category ?? null,
        created_at: w.createdAt ?? now,
        updated_at: now,
      }))
      const { error } = await client.from('wish_items').upsert(payload)
      if (error) throw error
    }
    const { data, error } = await client.from('wish_items').select('*').eq('household_id', householdId)
    if (error) throw error
    return (data ?? []).map(mapWishItemFromRow)
  },
})

export const getRepository = (householdId: string = DEFAULT_HOUSEHOLD_ID): Repository => {
  const config = useRuntimeConfig()
  const hasSupabase = Boolean(config.supabaseUrl) && Boolean(config.supabaseServiceKey)
  return hasSupabase ? makeSupabaseRepo(householdId) : makeMemoryRepo()
}
