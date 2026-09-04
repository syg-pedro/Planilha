import { mapAccountToRow, mapCategoryToRow, mapRuleToRow, mapEntryToRow, mapSettingFromRow, mapAccountFromRow, mapCategoryFromRow, mapRuleFromRow, mapEntryFromRow, mapWishItemFromRow } from './financeMappers'
import { createError } from 'h3'
import { saveFinanceBatch, readHouseholdRows } from './financeBatch'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_HOUSEHOLD_ID } from '../../shared/constants'
import { DEFAULT_DADOS_TEXT } from '../../shared/defaultDadosText'
import { computeKpis } from '../../shared/finance'
import { parseDadosText } from '../../shared/parser'
import { buildEntriesFromRules } from '../../shared/rules'
import { makeId } from '../../shared/id'
import { normalizeOnboardingKey } from '../../shared/onboarding'
import type {
  Account,
  BootstrapResponse,
  Category,
  DashboardSettingsRequest,
  FinanceEntry,
  FinanceRule,
  HouseholdSettings,
  OnboardingImportPayload,
  OnboardingImportPreview,
  OnboardingImportSummary,
  OnboardingState,
  ThemeSettingsRequest,
  WishItem,
  WishPriority,
  WishStatus,
} from '../../shared/types'

interface Repository {
  bootstrap: () => Promise<BootstrapResponse>
  saveEntriesBatch: (upserts: Partial<FinanceEntry>[], deletes: string[]) => Promise<FinanceEntry[]>
  rebuildRules: () => Promise<number>
  reseedEntries: () => Promise<number>
  saveTheme: (payload: ThemeSettingsRequest) => Promise<HouseholdSettings>
  saveDashboard: (payload: DashboardSettingsRequest) => Promise<HouseholdSettings>
  importCsv: (csvText: string, accountId: string | null) => Promise<{ inserted: number; warnings: string[] }>
  previewOnboardingImport: (payload: OnboardingImportPayload) => Promise<OnboardingImportPreview>
  importOnboardingWorkbook: (payload: OnboardingImportPayload) => Promise<OnboardingImportPreview>
  saveOnboarding: (onboarding: OnboardingState) => Promise<HouseholdSettings>
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

const hasFinancialData = (state: Pick<MemoryState, 'accounts' | 'categories' | 'rules' | 'entries'>): boolean =>
  state.accounts.length > 0 || state.categories.length > 0 || state.rules.length > 0 || state.entries.length > 0

interface PreparedOnboardingImport {
  accounts: Account[]
  categories: Category[]
  rules: FinanceRule[]
  entries: FinanceEntry[]
  summary: OnboardingImportSummary
}

const prepareOnboardingImport = (
  payload: OnboardingImportPayload,
  householdId: string,
  horizonMonths: number
): PreparedOnboardingImport => {
  const now = new Date().toISOString()
  const today = now.slice(0, 10)
  const accountByName = new Map<string, string>()
  const categoryByName = new Map<string, string>()

  const accounts = payload.accounts.map((input) => {
    const id = makeId('account')
    accountByName.set(normalizeOnboardingKey(input.name), id)
    return {
      id,
      householdId,
      name: input.name,
      owner: input.owner || 'Família',
      type: input.type,
      limitTotal: input.limitTotal,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
      active: true,
    }
  })

  const categories = payload.categories.map((input) => {
    const id = makeId('category')
    categoryByName.set(normalizeOnboardingKey(input.name), id)
    return {
      id,
      householdId,
      name: input.name,
      kind: input.kind,
      color: input.color,
    }
  })

  const lookupReference = (name: string | null, lookup: Map<string, string>, label: string, sourceRow: number) => {
    if (!name) return null
    const id = lookup.get(normalizeOnboardingKey(name))
    if (!id) {
      throw new Error(`Linha ${sourceRow}: ${label} "${name}" não foi encontrada na planilha.`)
    }
    return id
  }

  const rules = payload.rules.map((input) => ({
    id: makeId('rule'),
    householdId,
    title: input.title,
    description: 'Importado pelo modelo inicial',
    accountId: lookupReference(input.accountName, accountByName, 'A conta', input.sourceRow),
    categoryId: lookupReference(input.categoryName, categoryByName, 'A categoria', input.sourceRow),
    amount: input.amount,
    kind: input.kind,
    dueDay: input.dueDay,
    frequency: 'monthly' as const,
    startsAt: today,
    endsAt: null,
    autoGenerate: true,
    metadata: { source: 'onboarding-workbook', sourceRow: input.sourceRow },
  }))

  const generatedEntries = buildEntriesFromRules(rules, householdId, horizonMonths).map((entry) => ({
    ...entry,
    metadata: { ...entry.metadata, source: 'onboarding-workbook' },
  }))

  const entries = payload.entries.map((input) => ({
    id: makeId('entry'),
    householdId,
    ruleId: null,
    accountId: lookupReference(input.accountName, accountByName, 'A conta', input.sourceRow),
    categoryId: lookupReference(input.categoryName, categoryByName, 'A categoria', input.sourceRow),
    title: input.title,
    description: 'Importado pelo modelo inicial',
    amount: input.amount,
    kind: input.kind,
    dueDate: input.dueDate,
    competenceDate: input.dueDate,
    installmentIndex: input.installmentIndex,
    installmentTotal: input.installmentTotal,
    status: input.status,
    origin: 'imported' as const,
    excludeFromCalc: false,
    metadata: { source: 'onboarding-workbook', sourceRow: input.sourceRow },
    createdAt: now,
    updatedAt: now,
  }))

  return {
    accounts,
    categories,
    rules,
    entries: [...generatedEntries, ...entries],
    summary: {
      accounts: accounts.length,
      categories: categories.length,
      rules: rules.length,
      generatedEntries: generatedEntries.length,
      entries: entries.length,
    },
  }
}

const makeImportPreview = (
  prepared: PreparedOnboardingImport,
  hasExistingData: boolean
): OnboardingImportPreview => ({
  ...prepared.summary,
  canImport: !hasExistingData,
  warnings: hasExistingData
    ? ['A importação inicial só pode ser usada em uma conta sem dados para evitar duplicações.']
    : [],
})

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
    const autoEntries = state.entries.filter((e) => e.origin === 'auto' && e.metadata?.generatedFromRule)
    const preservedStatus = new Map<string, FinanceEntry['status']>()
    for (const e of autoEntries) {
      if (e.ruleId) preservedStatus.set(`${e.ruleId}__${e.dueDate}`, e.status)
    }
    state.entries = state.entries.filter((e) => !(e.origin === 'auto' && e.metadata?.generatedFromRule))
    const generated = buildEntriesFromRules(state.rules, DEFAULT_HOUSEHOLD_ID, state.settings.horizonMonths)
    const withPreservedStatus = generated.map(e => ({
      ...e,
      status: preservedStatus.get(`${e.ruleId}__${e.dueDate}`) ?? e.status
    }))
    state.entries.push(...withPreservedStatus)
    state.entries.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return withPreservedStatus.length
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
      notificationTime: payload.notificationTime ?? state.settings.notificationTime,
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

  async previewOnboardingImport(payload) {
    const state = await getMemoryState()
    const prepared = prepareOnboardingImport(payload, DEFAULT_HOUSEHOLD_ID, state.settings.horizonMonths)
    return makeImportPreview(prepared, hasFinancialData(state))
  },

  async importOnboardingWorkbook(payload) {
    const state = await getMemoryState()
    const prepared = prepareOnboardingImport(payload, DEFAULT_HOUSEHOLD_ID, state.settings.horizonMonths)
    const preview = makeImportPreview(prepared, hasFinancialData(state))
    if (!preview.canImport) {
      throw new Error(preview.warnings[0])
    }

    state.accounts = [...state.accounts, ...prepared.accounts]
    state.categories = [...state.categories, ...prepared.categories]
    state.rules = [...state.rules, ...prepared.rules]
    state.entries = [...state.entries, ...prepared.entries].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    state.settings = {
      ...state.settings,
      onboarding: {
        ...state.settings.onboarding,
        status: 'completed',
        completedSteps: ['import-workbook', 'accounts', 'fixed-items'],
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    }

    return preview
  },

  async saveOnboarding(onboarding) {
    const state = await getMemoryState()
    state.settings = {
      ...state.settings,
      onboarding,
      updatedAt: new Date().toISOString(),
    }
    return state.settings
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
      readHouseholdRows(client, 'accounts', householdId).then(data => ({ data, error: null })),
      readHouseholdRows(client, 'categories', householdId).then(data => ({ data, error: null })),
      readHouseholdRows(client, 'rules', householdId).then(data => ({ data, error: null })),
      readHouseholdRows(client, 'entries', householdId).then(data => ({ data, error: null })),
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
    await saveFinanceBatch(client, householdId, 'entries', upserts, deletes)
    return (await readHouseholdRows(client, 'entries', householdId)).map(mapEntryFromRow)
  },

  async rebuildRules() {
    const client = getSupabaseClient()

    const { data: settingsRows, error: settingsError } = await client
      .from('household_settings')
      .select('*')
      .eq('id', householdId)
      .single()
    if (settingsError) throw settingsError

    const rulesRows = await readHouseholdRows(client, 'rules', householdId)

    // Preserve status the user already set (e.g. salary marked as received)
    const existingAuto = (await readHouseholdRows(client, 'entries', householdId))
      .filter(row => row.origin === 'auto' && row.metadata?.generatedFromRule)
    const preservedStatus = new Map<string, string>()
    for (const row of existingAuto ?? []) {
      if (row.rule_id && row.due_date) {
        preservedStatus.set(`${row.rule_id}__${row.due_date}`, row.status)
      }
    }

    const settings = mapSettingFromRow(settingsRows)
    const rules = (rulesRows ?? []).map(mapRuleFromRow)
    const generated = buildEntriesFromRules(rules, householdId, settings.horizonMonths)

    const withPreservedStatus = generated.map(e => ({
      ...e,
      status: (preservedStatus.get(`${e.ruleId}__${e.dueDate}`) ?? e.status) as FinanceEntry['status']
    }))

    await saveFinanceBatch(client, householdId, 'entries', withPreservedStatus, (existingAuto ?? []).map(row => row.id))

    return withPreservedStatus.length
  },

  async reseedEntries() {
    throw createError({ statusCode: 403, statusMessage: 'Restaurar dados de demonstração só está disponível no modo local.' })
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
      ...(payload.notificationTime ? { notification_time: payload.notificationTime } : {}),
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
        return entry
      })
      .filter(Boolean)

    if (rows.length > 0) {
      await saveFinanceBatch(client, householdId, 'entries', rows as FinanceEntry[], [])
    }

    return { inserted: rows.length, warnings }
  },

  async previewOnboardingImport(payload) {
    const snapshot = await this.bootstrap()
    const prepared = prepareOnboardingImport(payload, householdId, snapshot.settings.horizonMonths)
    return makeImportPreview(prepared, hasFinancialData(snapshot))
  },

  async importOnboardingWorkbook(payload) {
    const snapshot = await this.bootstrap()
    const prepared = prepareOnboardingImport(payload, householdId, snapshot.settings.horizonMonths)
    const preview = makeImportPreview(prepared, hasFinancialData(snapshot))
    if (!preview.canImport) {
      throw new Error(preview.warnings[0])
    }

    const client = getSupabaseClient()
    const { error } = await client.rpc('import_onboarding_workbook', {
      p_household_id: householdId,
      p_accounts: prepared.accounts.map(mapAccountToRow),
      p_categories: prepared.categories.map(mapCategoryToRow),
      p_rules: prepared.rules.map(mapRuleToRow),
      p_entries: prepared.entries.map(mapEntryToRow),
    })
    if (error) throw error
    return preview
  },

  async saveOnboarding(onboarding) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('household_settings')
      .update({ onboarding_state: onboarding, updated_at: new Date().toISOString() })
      .eq('id', householdId)
      .select('*')
      .single()
    if (error) throw error
    return mapSettingFromRow(data)
  },

  async saveRules(upserts, deletes) {
    const client = getSupabaseClient()
    await saveFinanceBatch(client, householdId, 'rules', upserts, deletes)
    return (await readHouseholdRows(client, 'rules', householdId)).map(mapRuleFromRow)
  },

  async saveAccounts(upserts, deletes) {
    const client = getSupabaseClient()
    await saveFinanceBatch(client, householdId, 'accounts', upserts, deletes)
    return (await readHouseholdRows(client, 'accounts', householdId)).map(mapAccountFromRow)
  },

  async getWishItems() {
    const client = getSupabaseClient()
    return (await readHouseholdRows(client, 'wish_items', householdId)).map(mapWishItemFromRow)
  },

  async saveWishItems(upserts, deletes) {
    const client = getSupabaseClient()
    await saveFinanceBatch(client, householdId, 'wish_items', upserts, deletes)
    return (await readHouseholdRows(client, 'wish_items', householdId)).map(mapWishItemFromRow)
  },
})

export const getRepository = (householdId: string = DEFAULT_HOUSEHOLD_ID): Repository => {
  const config = useRuntimeConfig()
  const hasSupabase = Boolean(config.supabaseUrl) && Boolean(config.supabaseServiceKey)
  return hasSupabase ? makeSupabaseRepo(householdId) : makeMemoryRepo()
}
