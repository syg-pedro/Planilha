import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { applyFilters, buildCardBreakdown, buildCashflowSeries, buildCategoryBreakdown, buildHeatmap, buildProjection, computeKpis, excludeBenefitEntries } from '#shared/finance'
import { DEFAULT_COLORS, DEFAULT_DASHBOARD_CONFIG, THEME_PRESETS } from '#shared/constants'
import type {
  Account,
  BootstrapResponse,
  Category,
  DashboardFilters,
  EntryBatchRequest,
  FinanceEntry,
  FinanceKpis,
  FinanceRule,
  HouseholdSettings,
  ThemeMode
} from '#shared/types'

const defaultSettings = (): HouseholdSettings => ({
  id: 'household-main',
  currency: 'BRL',
  timezone: 'America/Sao_Paulo',
  themeMode: 'light',
  densityMode: 'compact',
  periodMode: 'due_date',
  horizonMonths: 18,
  notificationDays: [3, 1],
  colorTokens: { ...DEFAULT_COLORS },
  dashboardConfig: { ...DEFAULT_DASHBOARD_CONFIG },
  updatedAt: new Date().toISOString()
})

const defaultFilters = (): DashboardFilters => ({
  range: 'month',
  periodMode: 'due_date',
  categoryIds: [],
  accountIds: []
})

export const useFinanceStore = defineStore('finance', () => {
  const runtime = useRuntimeConfig()
  const route = useRoute()

  const loading = ref(false)
  const initialized = ref(false)
  const error = ref<string | null>(null)
  const editKey = ref<string>(runtime.public.defaultEditKey)

  const settings = ref<HouseholdSettings>(defaultSettings())
  const accounts = ref<Account[]>([])
  const categories = ref<Category[]>([])
  const rules = ref<FinanceRule[]>([])
  const entries   = ref<FinanceEntry[]>([])
  const warnings  = ref<string[]>([])
  const kpis = ref<FinanceKpis>({
    totalIncome: 0,
    totalExpense: 0,
    net: 0,
    pendingAmount: 0,
    upcoming7Days: 0,
    cardsUsedPercent: 0
  })

  const filters = ref<DashboardFilters>(defaultFilters())
  const offlineQueue = ref<EntryBatchRequest[]>([])

  const filteredEntries = computed(() => applyFilters(entries.value, filters.value))

  const cashableEntries = computed(() => excludeBenefitEntries(filteredEntries.value, accounts.value))

  const allCashableEntries = computed(() => excludeBenefitEntries(entries.value, accounts.value))

  const monthlyKpis = computed(() => computeKpis(filteredEntries.value, accounts.value))

  const categoryMap = computed(() => {
    const map = new Map<string, Category>()
    for (const category of categories.value) {
      map.set(category.id, category)
    }
    return map
  })

  const accountMap = computed(() => {
    const map = new Map<string, Account>()
    for (const account of accounts.value) {
      map.set(account.id, account)
    }
    return map
  })

  const chartData = computed(() => ({
    cashflow: buildCashflowSeries(cashableEntries.value, filters.value.periodMode),
    projection: buildProjection(cashableEntries.value, filters.value.periodMode),
    category: buildCategoryBreakdown(cashableEntries.value),
    cards: buildCardBreakdown(cashableEntries.value),
    heatmap: buildHeatmap(cashableEntries.value)
  }))

  const fetchApi = async <T>(
    path: string,
    options: { method?: 'GET' | 'POST'; body?: any } = {}
  ): Promise<T> => {
    const response = await $fetch(path, {
      method: options.method ?? 'GET',
      body: options.body,
      headers: { 'x-edit-key': editKey.value }
    })
    return response as T
  }

  const resolveEffectiveTheme = (): Exclude<ThemeMode, 'system'> => {
    if (settings.value.themeMode !== 'system') {
      return settings.value.themeMode
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  }

  const DARK_THEMES = new Set(['dark', 'cyberpunk', 'arasaka'])

  // Variáveis sobrescritas inline quando o tema é 'custom'.
  const CUSTOM_VARS = [
    '--ds-color-brand-primary', '--ds-color-brand-primary-dim', '--ds-color-brand-primary-light',
    '--ds-color-brand-accent', '--ds-color-state-success', '--ds-color-state-success-light',
    '--ds-color-state-danger', '--ds-color-state-danger-light', '--ds-color-state-warning',
    '--ds-color-state-warning-light', '--accent-light'
  ]

  const isLightHex = (hex: string): boolean => {
    const h = hex.replace('#', '')
    if (h.length < 6) return true
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) > 140
  }

  const applyTheme = () => {
    if (!process.client) {
      return
    }

    const root = document.documentElement

    // Limpa quaisquer overrides inline de execuções anteriores
    for (const v of CUSTOM_VARS) root.style.removeProperty(v)

    if (settings.value.themeMode === 'custom') {
      const c = settings.value.colorTokens
      const light = isLightHex(c.background)
      root.dataset.theme = light ? 'light' : 'dark'
      root.classList.toggle('dark', !light)

      const mix = (hex: string, pct: number, base: string) => `color-mix(in srgb, ${hex} ${pct}%, ${base})`
      root.style.setProperty('--ds-color-brand-primary', c.primary)
      root.style.setProperty('--ds-color-brand-primary-dim', mix(c.primary, 16, 'transparent'))
      root.style.setProperty('--ds-color-brand-primary-light', mix(c.primary, 16, 'var(--ds-color-surface-card)'))
      root.style.setProperty('--ds-color-brand-accent', c.accent)
      root.style.setProperty('--ds-color-state-success', c.positive)
      root.style.setProperty('--ds-color-state-success-light', mix(c.positive, 16, 'var(--ds-color-surface-card)'))
      root.style.setProperty('--ds-color-state-danger', c.negative)
      root.style.setProperty('--ds-color-state-danger-light', mix(c.negative, 16, 'var(--ds-color-surface-card)'))
      root.style.setProperty('--ds-color-state-warning', c.accent)
      root.style.setProperty('--ds-color-state-warning-light', mix(c.accent, 16, 'var(--ds-color-surface-card)'))
      root.style.setProperty('--accent-light', mix(c.accent, 16, 'var(--ds-color-surface-card)'))
      return
    }

    const effective = resolveEffectiveTheme()
    root.dataset.theme = effective
    root.classList.toggle('dark', DARK_THEMES.has(effective))
  }

  const setThemeMode = (mode: ThemeMode) => {
    settings.value.themeMode = mode
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      settings.value.colorTokens = { ...THEME_PRESETS[prefersDark ? 'dark' : 'light'] }
    } else {
      settings.value.colorTokens = { ...THEME_PRESETS[mode] }
    }
    applyTheme()
  }

  const loadOfflineQueue = () => {
    if (!process.client) {
      return
    }
    const raw = localStorage.getItem('finance-offline-queue')
    if (!raw) {
      return
    }
    try {
      offlineQueue.value = JSON.parse(raw)
    } catch {
      offlineQueue.value = []
    }
  }

  const persistOfflineQueue = () => {
    if (!process.client) {
      return
    }
    localStorage.setItem('finance-offline-queue', JSON.stringify(offlineQueue.value))
  }

  const pushOfflineBatch = (batch: EntryBatchRequest) => {
    offlineQueue.value.push(batch)
    persistOfflineQueue()
  }

  const flushOfflineQueue = async () => {
    if (!process.client || !navigator.onLine || offlineQueue.value.length === 0) {
      return
    }

    const pending = [...offlineQueue.value]
    offlineQueue.value = []
    persistOfflineQueue()

    for (const batch of pending) {
      await fetchApi<{ entries: FinanceEntry[] }>('/api/entries/batch', {
        method: 'POST',
        body: batch
      })
    }

    await bootstrap()
  }

  const initEditKey = () => {
    if (!process.client) {
      return
    }

    const queryKey = typeof route.query.key === 'string' ? route.query.key : null
    const saved = localStorage.getItem('finance-edit-key')
    editKey.value = queryKey ?? saved ?? runtime.public.defaultEditKey
    localStorage.setItem('finance-edit-key', editKey.value)
  }

  const setEditKey = (value: string) => {
    editKey.value = value.trim()
    if (process.client) {
      localStorage.setItem('finance-edit-key', editKey.value)
    }
  }

  const bootstrap = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchApi<BootstrapResponse>('/api/bootstrap')
      settings.value = response.settings
      accounts.value = response.accounts
      categories.value = response.categories
      rules.value = response.rules
      entries.value   = response.entries
      warnings.value  = response.warnings
      kpis.value = response.kpis
      filters.value.periodMode = response.settings.periodMode
      if (!filters.value.range) {
        filters.value.range = response.settings.dashboardConfig.defaultRange
      }
      applyTheme()
      initialized.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao carregar dados'
      throw err
    } finally {
      loading.value = false
    }
  }

  const saveEntriesBatch = async (batch: EntryBatchRequest) => {
    if (process.client && !navigator.onLine) {
      pushOfflineBatch(batch)
      for (const entry of batch.upserts) {
        if (!entry.id) {
          continue
        }
        const index = entries.value.findIndex((item) => item.id === entry.id)
        if (index >= 0) {
          entries.value[index] = { ...entries.value[index], ...entry } as FinanceEntry
        }
      }
      if (batch.deletes.length > 0) {
        entries.value = entries.value.filter((entry) => !batch.deletes.includes(entry.id))
      }
      return
    }

    const response = await fetchApi<{ entries: FinanceEntry[] }>('/api/entries/batch', {
      method: 'POST',
      body: batch
    })
    entries.value = response.entries
  }

  const rebuildRules = async () => {
    await fetchApi('/api/rules/rebuild', { method: 'POST' })
    await bootstrap()
  }

  const reseedEntries = async () => {
    await fetchApi('/api/entries/reseed', { method: 'POST' })
    await bootstrap()
  }

  const saveTheme = async () => {
    const response = await fetchApi<{ settings: HouseholdSettings }>('/api/settings/theme', {
      method: 'POST',
      body: {
        themeMode: settings.value.themeMode,
        densityMode: settings.value.densityMode,
        colorTokens: settings.value.colorTokens
      }
    })
    settings.value = response.settings
    applyTheme()
  }

  const saveDashboard = async () => {
    const response = await fetchApi<{ settings: HouseholdSettings }>('/api/settings/dashboard', {
      method: 'POST',
      body: {
        periodMode: filters.value.periodMode,
        dashboardConfig: settings.value.dashboardConfig
      }
    })
    settings.value = response.settings
  }

  const saveAccount = async (account: Partial<Account>) => {
    const response = await fetchApi<{ accounts: Account[] }>('/api/accounts/batch', {
      method: 'POST',
      body: { upserts: [account], deletes: [] }
    })
    accounts.value = response.accounts
  }

  const saveRules = async (upserts: Partial<FinanceRule>[], deletes: string[]) => {
    const response = await fetchApi<{ rules: FinanceRule[] }>('/api/rules/batch', {
      method: 'POST',
      body: { upserts, deletes }
    })
    rules.value = response.rules
  }

  const importCsv = async (csvText: string, accountId: string | null) => {
    await fetchApi('/api/import/csv', {
      method: 'POST',
      body: { csvText, accountId }
    })
    await bootstrap()
  }

  const requestNotifications = async () => {
    if (!process.client || !('Notification' in window)) {
      return
    }
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const notifyUpcoming = () => {
    if (!process.client || !('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const today = new Date()
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 3)

    const upcoming = entries.value.filter((entry) => {
      if (entry.kind !== 'expense' || entry.status === 'paid') {
        return false
      }
      const due = new Date(`${entry.dueDate}T00:00:00.000Z`)
      return due >= start && due <= end
    })

    if (upcoming.length > 0) {
      const total = upcoming.reduce((sum, entry) => sum + entry.amount, 0)
      new Notification('Vencimentos proximos', {
        body: `${upcoming.length} conta(s) em ate 3 dias. Total R$ ${total.toFixed(2)}`
      })
    }
  }

  const resetState = () => {
    settings.value    = defaultSettings()
    accounts.value    = []
    categories.value  = []
    rules.value       = []
    entries.value     = []
    warnings.value    = []
    kpis.value        = { totalIncome: 0, totalExpense: 0, net: 0, pendingAmount: 0, upcoming7Days: 0, cardsUsedPercent: 0 }
    filters.value     = defaultFilters()
    offlineQueue.value = []
    initialized.value = false
    error.value       = null
  }

  const boot = async () => {
    initEditKey()
    loadOfflineQueue()
    await bootstrap()
    if (process.client) {
      window.addEventListener('online', flushOfflineQueue)
    }
  }

  return {
    loading,
    initialized,
    error,
    editKey,
    settings,
    accounts,
    categories,
    rules,
    entries,
    warnings,
    kpis,
    filters,
    chartData,
    filteredEntries,
    cashableEntries,
    allCashableEntries,
    categoryMap,
    accountMap,
    offlineQueue,
    setEditKey,
    bootstrap,
    boot,
    resetState,
    saveEntriesBatch,
    saveAccount,
    saveRules,
    rebuildRules,
    reseedEntries,
    saveTheme,
    saveDashboard,
    importCsv,
    requestNotifications,
    notifyUpcoming,
    monthlyKpis,
    applyTheme,
    setThemeMode,
    flushOfflineQueue
  }
})
