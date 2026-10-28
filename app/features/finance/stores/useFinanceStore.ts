import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { applyFilters, buildCardBreakdown, buildCashflowSeries, buildCategoryBreakdown, buildExpensePaymentCycles, buildHeatmap, buildProjection, computeKpis, excludeBenefitEntries } from '#shared/finance'
import { DARK_COLORS, DEFAULT_DASHBOARD_CONFIG } from '#shared/constants'
import { createDefaultOnboardingState } from '#shared/onboarding'
import { normalizeUiTheme, type UiThemePreferences } from '#shared/uiTheme'
import { useFinanceUiTheme } from '~/features/finance/composables/useFinanceUiTheme'
import { syncFinanceWidgetSnapshot } from '~/features/finance/utils/financeWidget'
import { assertJavaLabBrowserOrigin, financeStorageKey, javaLabActive } from '#shared/javaLab'
import { combineJavaLabBatches, createJavaLabAdapter } from '#shared/javaLabAdapter'
import type { JavaLabRequest } from '#shared/javaLabAdapter'
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
  OnboardingImportPayload,
  OnboardingImportPreview,
  OnboardingState,
  ThemeMode,
  WishItem
} from '#shared/types'

const defaultSettings = (): HouseholdSettings => ({
  id: 'household-main',
  currency: 'BRL',
  timezone: 'America/Sao_Paulo',
  themeMode: 'system',
  densityMode: 'compact',
  periodMode: 'due_date',
  horizonMonths: 18,
  notificationDays: [3, 1],
  notificationTime: '09:00',
  onboarding: createDefaultOnboardingState(),
  colorTokens: { ...DARK_COLORS },
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
  const javaLab = javaLabActive(runtime.public.javaLab, import.meta.dev)
  const storageKey = (key: string) => financeStorageKey(javaLab && key === 'finance-offline-queue'
    ? `${key}:${useAuth().user.value?.id ?? 'anonymous'}:${settings.value.id}` : key, javaLab)
  const storage = () => javaLab ? sessionStorage : localStorage
  const route = useRoute()
  const uiThemeRuntime = useFinanceUiTheme()
  const uiThemeSaving = ref(false)

  const loading = ref(false)
  const initialized = ref(false)
  const error = ref<string | null>(null)
  const editKey = ref<string>(runtime.public.defaultEditKey)

  const settings = ref<HouseholdSettings>(defaultSettings())
  const accounts = ref<Account[]>([])
  const categories = ref<Category[]>([])
  const rules = ref<FinanceRule[]>([])
  const entries   = ref<FinanceEntry[]>([])
  const wishItems = ref<WishItem[]>([])
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
  const syncingOfflineQueue = ref(false)

  const filteredEntries = computed(() => applyFilters(entries.value, filters.value))

  const cashableEntries = computed(() => excludeBenefitEntries(filteredEntries.value, accounts.value))

  const allCashableEntries = computed(() => excludeBenefitEntries(entries.value, accounts.value))

  const monthlyKpis = computed(() => computeKpis(filteredEntries.value, accounts.value))

  const expensePaymentCycles = computed(() => buildExpensePaymentCycles(entries.value, accounts.value, new Date(), settings.value.timezone))

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

  const requestJava: JavaLabRequest = async <T>(path: string, options = {}): Promise<T> => {
    if (!import.meta.client) throw new Error('Use o navegador exclusivo do laboratório Java.')
    assertJavaLabBrowserOrigin(window.location.origin)
    if (Capacitor.isNativePlatform()) throw new Error('O laboratório Java está disponível somente no navegador local.')
    const auth = useAuth()
    const session = auth.getSessionKey()
    const token = await auth.getAccessToken()
    if (!token) throw new Error('Entre na sua conta local para continuar.')
    if (session !== auth.getSessionKey()) throw new Error('A sessão local mudou. Carregue os dados novamente.')
    try {
      const response = await $fetch<T>(path, { ...options, credentials: 'same-origin', headers: { authorization: `Bearer ${token}` } }) as T
      if (session !== auth.getSessionKey()) throw new Error('A sessão local mudou. Carregue os dados novamente.')
      return response
    } catch (error) {
      console.error('Falha ao acessar a API local do laboratório.', { status: (error as { response?: { status?: number } }).response?.status })
      throw new Error('Não foi possível concluir no laboratório. Confira se o backend local está em execução e tente novamente.')
    }
  }
  const javaApi = createJavaLabAdapter(requestJava)

  const fetchApi = async <T>(
    path: string,
    options: { method?: 'GET' | 'POST'; body?: any } = {}
  ): Promise<T> => {
    if (javaLab) return javaApi<T>(path, options)
    const apiBaseUrl = runtime.public.apiBaseUrl as string
    const url = apiBaseUrl ? new URL(path, apiBaseUrl).toString() : path
    const accessToken = await useAuth().getAccessToken()
    const response = await $fetch(url, {
      method: options.method ?? 'GET',
      body: options.body,
      headers: {
        'x-edit-key': editKey.value,
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
      }
    })
    return response as T
  }

  const loadWishItems = async (): Promise<WishItem[]> => {
    const response = await fetchApi<{ items: WishItem[] }>('/api/wishlist')
    wishItems.value = response.items
    return wishItems.value
  }
  const saveWishItemsBatch = async (batch: { upserts: Partial<WishItem>[]; deletes: string[] }): Promise<WishItem[]> => {
    const response = await fetchApi<{ items: WishItem[] }>('/api/wishlist/batch', { method: 'POST', body: batch })
    wishItems.value = response.items
    return wishItems.value
  }

  const LEGACY_THEME_MODES = new Set(['eva', 'eva_01', 'cyberpunk', 'arasaka'])
  const DARK_THEMES = new Set(['dark'])

  const normalizeThemeMode = (mode: string): ThemeMode => {
    if (LEGACY_THEME_MODES.has(mode)) return 'dark'
    if (mode === 'light' || mode === 'dark' || mode === 'custom' || mode === 'system') return mode
    return 'system'
  }

  const normalizeSettings = (nextSettings: HouseholdSettings): HouseholdSettings => ({
    ...nextSettings,
    themeMode: normalizeThemeMode(nextSettings.themeMode),
    dashboardConfig: { ...DEFAULT_DASHBOARD_CONFIG, ...nextSettings.dashboardConfig, uiTheme: normalizeUiTheme(nextSettings.dashboardConfig?.uiTheme) }
  })

  const resolveEffectiveTheme = (): Exclude<ThemeMode, 'system'> => {
    const mode = normalizeThemeMode(settings.value.themeMode)
    if (mode !== settings.value.themeMode) {
      settings.value.themeMode = mode
    }
    if (mode !== 'system') {
      return mode
    }
    const prefersDark = import.meta.client && window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  }

  // Variáveis sobrescritas inline quando o tema é 'custom'.
  const CUSTOM_VARS = [
    '--ds-color-brand-primary', '--ds-color-brand-primary-dim', '--ds-color-brand-primary-light',
    '--ds-color-brand-accent', '--ds-color-state-success', '--ds-color-state-success-light',
    '--ds-color-state-danger', '--ds-color-state-danger-light', '--ds-color-state-warning',
    '--ds-color-state-warning-light', '--accent-light',
    '--ui-primary', '--ui-secondary', '--ui-success', '--ui-error', '--ui-bg', '--ui-bg-elevated'
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

    settings.value.themeMode = normalizeThemeMode(settings.value.themeMode)

    if (settings.value.themeMode === 'custom') {
      const c = settings.value.colorTokens
      const light = isLightHex(c.background)
      root.dataset.theme = light ? 'light' : 'dark'
      root.classList.toggle('dark', !light)
      uiThemeRuntime.apply(settings.value.dashboardConfig.uiTheme, light ? 'light' : 'dark')
      for (const [token, value] of Object.entries({ '--ui-primary': c.primary, '--ui-secondary': c.accent, '--ui-success': c.positive, '--ui-error': c.negative, '--ui-bg': c.background, '--ui-bg-elevated': c.card })) root.style.setProperty(token, value)
      return
    }

    const effective = resolveEffectiveTheme()
    root.dataset.theme = effective
    root.classList.toggle('dark', DARK_THEMES.has(effective))
    uiThemeRuntime.apply(settings.value.dashboardConfig.uiTheme, effective === 'dark' ? 'dark' : 'light')
  }

  const setThemeMode = (mode: ThemeMode) => {
    settings.value.themeMode = mode
    // Standard modes use the preset palette. Keep arbitrary legacy colors for
    // the next time Custom is opened instead of replacing the saved draft.
    applyTheme()
  }

  const loadOfflineQueue = () => {
    if (!process.client) {
      return
    }
    const raw = storage().getItem(storageKey('finance-offline-queue'))
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
    storage().setItem(storageKey('finance-offline-queue'), JSON.stringify(offlineQueue.value))
  }

  const pushOfflineBatch = (batch: EntryBatchRequest) => {
    offlineQueue.value.push(batch)
    persistOfflineQueue()
  }

  const flushOfflineQueue = async () => {
    if (!process.client || !navigator.onLine || offlineQueue.value.length === 0 || syncingOfflineQueue.value) {
      return
    }

    syncingOfflineQueue.value = true
    try {
      if (javaLab) {
        const pending = offlineQueue.value.length
        const batch = combineJavaLabBatches(offlineQueue.value as { upserts: Record<string, unknown>[]; deletes: string[] }[])
        await fetchApi('/api/entries/batch', { method: 'POST', body: batch })
        offlineQueue.value.splice(0, pending)
        persistOfflineQueue()
        await bootstrap()
        return
      }
      while (offlineQueue.value.length) {
        const batch = offlineQueue.value[0]!
        await fetchApi<{ entries: FinanceEntry[] }>('/api/entries/batch', { method: 'POST', body: batch })
        // Only remove a batch after the server acknowledges it. Failed batches remain retryable.
        offlineQueue.value.shift()
        persistOfflineQueue()
      }
      await bootstrap()
    } finally {
      syncingOfflineQueue.value = false
    }
  }

  const initEditKey = () => {
    if (!process.client) {
      return
    }

    const queryKey = typeof route.query.key === 'string' ? route.query.key : null
    const saved = storage().getItem(storageKey('finance-edit-key'))
    editKey.value = queryKey ?? saved ?? runtime.public.defaultEditKey
    storage().setItem(storageKey('finance-edit-key'), editKey.value)
  }

  const setEditKey = (value: string) => {
    editKey.value = value.trim()
    if (process.client) {
      storage().setItem(storageKey('finance-edit-key'), editKey.value)
    }
  }

  const syncWidgetSnapshot = async () => {
    if (javaLab) return
    if (!process.client || !Capacitor.isNativePlatform()) {
      return
    }

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const periodMode = filters.value.periodMode ?? settings.value.periodMode
    const currentMonthEntries = entries.value.filter((entry) => {
      const sourceDate = periodMode === 'competence' ? entry.competenceDate : entry.dueDate
      return sourceDate.startsWith(currentMonth)
    })

    const currentMonthKpis = computeKpis(currentMonthEntries, accounts.value)
    await syncFinanceWidgetSnapshot({
      kpis: currentMonthKpis,
      entries: entries.value,
      accounts: accounts.value,
      currency: settings.value.currency || 'BRL',
    })
  }

  const bootstrap = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchApi<BootstrapResponse>('/api/bootstrap')
      settings.value = normalizeSettings(response.settings)
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
      void syncWidgetSnapshot()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao carregar dados'
      throw err
    } finally {
      loading.value = false
    }
  }

  const saveEntriesBatch = async (batch: EntryBatchRequest) => {
    if (javaLab && syncingOfflineQueue.value) throw new Error('Aguarde a sincronização local antes de salvar outra alteração.')
    if (process.client && !navigator.onLine) {
      pushOfflineBatch(batch)
      for (const entry of batch.upserts) {
        if (!entry.id) {
          continue
        }
        const index = entries.value.findIndex((item) => item.id === entry.id)
        if (index >= 0) {
          entries.value[index] = { ...entries.value[index], ...entry } as FinanceEntry
        } else if (entry.title != null && entry.amount != null && entry.dueDate && entry.competenceDate && entry.kind) {
          entries.value.push(entry as FinanceEntry)
        }
      }
      if (batch.deletes.length > 0) {
        entries.value = entries.value.filter((entry) => !batch.deletes.includes(entry.id))
      }
      void syncWidgetSnapshot()
      return
    }

    const response = await fetchApi<{ entries: FinanceEntry[] }>('/api/entries/batch', {
      method: 'POST',
      body: batch
    })
    entries.value = response.entries
    void syncWidgetSnapshot()
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
    settings.value = normalizeSettings(response.settings)
    applyTheme()
  }

  const saveDashboard = async () => {
    const response = await fetchApi<{ settings: HouseholdSettings }>('/api/settings/dashboard', {
      method: 'POST',
      body: {
        periodMode: filters.value.periodMode,
        notificationTime: settings.value.notificationTime,
        dashboardConfig: settings.value.dashboardConfig
      }
    })
    settings.value = normalizeSettings(response.settings)
    applyTheme()
    void syncWidgetSnapshot()
  }

  const saveUiTheme = async (preferences: UiThemePreferences) => {
    if (uiThemeSaving.value) return
    const previous = {
      preferences: normalizeUiTheme(settings.value.dashboardConfig.uiTheme),
      mode: settings.value.themeMode,
      colors: { ...settings.value.colorTokens }
    }
    const leavingCustom = previous.mode === 'custom'
    uiThemeSaving.value = true
    settings.value.dashboardConfig.uiTheme = normalizeUiTheme(preferences)
    if (leavingCustom) settings.value.themeMode = 'system'
    applyTheme()
    try {
      // Use the existing theme endpoint first so a reload cannot reactivate
      // inline Custom overrides over the selected official preset.
      if (leavingCustom) await fetchApi('/api/settings/theme', {
        method: 'POST',
        body: { themeMode: 'system', densityMode: settings.value.densityMode, colorTokens: previous.colors }
      })
      await saveDashboard()
    } catch (cause) {
      settings.value.dashboardConfig.uiTheme = previous.preferences
      settings.value.themeMode = previous.mode
      settings.value.colorTokens = previous.colors
      applyTheme()
      if (leavingCustom) {
        try {
          await fetchApi('/api/settings/theme', {
            method: 'POST',
            body: { themeMode: previous.mode, densityMode: settings.value.densityMode, colorTokens: previous.colors }
          })
        } catch (rollbackCause) {
          throw new Error('Não foi possível salvar o tema nem confirmar a restauração no servidor. A aparência anterior foi restaurada neste aparelho; tente novamente para sincronizar.', { cause: rollbackCause })
        }
      }
      throw cause
    } finally {
      uiThemeSaving.value = false
    }
  }

  const saveAccount = async (account: Partial<Account>) => {
    const response = await fetchApi<{ accounts: Account[] }>('/api/accounts/batch', {
      method: 'POST',
      body: { upserts: [account], deletes: [] }
    })
    accounts.value = response.accounts
    void syncWidgetSnapshot()
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
    if (javaLab) return
    if (!process.client) {
      return
    }
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions()
      if (status.display === 'prompt') await LocalNotifications.requestPermissions()
      return
    }
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const notifyUpcoming = () => {
    if (javaLab) return
    if (Capacitor.isNativePlatform()) {
      void scheduleUpcomingNotifications()
      return
    }
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
        body: `${upcoming.length} conta(s) em ate 3 dias. Total R$ ${total.toFixed(2)}`,
        icon: '/icon-192-v2.png'
      })
    }
  }

  const previewOnboardingImport = async (payload: OnboardingImportPayload) => {
    return await fetchApi<OnboardingImportPreview>('/api/onboarding/import/preview', {
      method: 'POST',
      body: payload
    })
  }

  const importOnboardingWorkbook = async (payload: OnboardingImportPayload) => {
    const response = await fetchApi<{ summary: OnboardingImportPreview }>('/api/onboarding/import', {
      method: 'POST',
      body: payload
    })
    await bootstrap()
    return response.summary
  }

  const saveOnboarding = async (onboarding: OnboardingState) => {
    const response = await fetchApi<{ settings: HouseholdSettings }>('/api/onboarding/state', {
      method: 'POST',
      body: { onboarding }
    })
    settings.value = normalizeSettings(response.settings)
  }

  const scheduleUpcomingNotifications = async () => {
    if (javaLab) return
    if (!process.client || !Capacitor.isNativePlatform()) return
    const permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') return
    await LocalNotifications.cancel({ notifications: Array.from({ length: 90 }, (_, id) => ({ id: 700000 + id })) })
    const [hour, minute] = settings.value.notificationTime.split(':').map(Number)
    const notificationHour = Number.isFinite(hour) ? Number(hour) : 9
    const notificationMinute = Number.isFinite(minute) ? Number(minute) : 0
    const notifications = entries.value
      .filter(entry => entry.kind === 'expense' && entry.status !== 'paid')
      .filter(entry => {
        const due = new Date(`${entry.dueDate}T00:00:00`)
        return due >= new Date() && due <= new Date(Date.now() + 90 * 86400000)
      })
      .slice(0, 90)
      .map((entry, index) => {
        const at = new Date(`${entry.dueDate}T00:00:00`)
        at.setHours(notificationHour, notificationMinute, 0, 0)
        return { id: 700000 + index, title: 'Vencimento próximo', body: `${entry.title} vence hoje`, schedule: { at }, extra: { entryId: entry.id } }
      })
    if (notifications.length) await LocalNotifications.schedule({ notifications })
  }

  const resetState = () => {
    settings.value    = defaultSettings()
    accounts.value    = []
    categories.value  = []
    rules.value       = []
    entries.value     = []
    wishItems.value   = []
    warnings.value    = []
    kpis.value        = { totalIncome: 0, totalExpense: 0, net: 0, pendingAmount: 0, upcoming7Days: 0, cardsUsedPercent: 0 }
    filters.value     = defaultFilters()
    offlineQueue.value = []
    syncingOfflineQueue.value = false
    initialized.value = false
    error.value       = null
    applyTheme()
  }

  const boot = async () => {
    initEditKey()
    if (!javaLab) loadOfflineQueue()
    await bootstrap()
    if (javaLab) {
      loadOfflineQueue()
      await flushOfflineQueue()
    }
    if (process.client) {
      window.removeEventListener('online', retryOfflineQueue)
      window.addEventListener('online', retryOfflineQueue)
    }
  }

  const retryOfflineQueue = () => {
    void flushOfflineQueue().catch(() => { error.value = 'Há alterações aguardando sincronização. Elas continuam salvas neste dispositivo.' })
  }

  return {
    javaLab,
    storageKey,
    loading,
    initialized,
    error,
    editKey,
    settings,
    accounts,
    categories,
    rules,
    entries,
    wishItems,
    loadWishItems,
    saveWishItemsBatch,
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
    saveUiTheme,
    uiThemeSaving,
    importCsv,
    previewOnboardingImport,
    importOnboardingWorkbook,
    saveOnboarding,
    requestNotifications,
    notifyUpcoming,
    monthlyKpis,
    expensePaymentCycles,
    applyTheme,
    setThemeMode,
    flushOfflineQueue,
    scheduleUpcomingNotifications
  }
})
