import { upcomingNotifications } from '#shared/notifications'
import { useFinanceTheme } from '../composables/useFinanceTheme'
import { defineStore } from 'pinia'
import { computed, ref, onScopeDispose, watch } from 'vue'
import { useOfflineQueue } from '../composables/useOfflineQueue'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { applyFilters, buildCardBreakdown, buildCashflowSeries, buildCategoryBreakdown, buildHeatmap, buildProjection, computeKpis, excludeBenefitEntries } from '#shared/finance'
import { DARK_COLORS, DEFAULT_DASHBOARD_CONFIG } from '#shared/constants'
import { createDefaultOnboardingState } from '#shared/onboarding'
import { syncFinanceWidgetSnapshot } from '~/features/finance/utils/financeWidget'
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
  WishItem
} from '#shared/types'

const defaultSettings = (): HouseholdSettings => ({
  id: 'household-main',
  currency: 'BRL',
  timezone: 'America/Sao_Paulo',
  themeMode: 'dark',
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
  const route = useRoute()
  const auth = useAuth()
  let sessionGeneration = 0

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
  const offline = useOfflineQueue(() => localStorage)
  const offlineQueue = offline.queue
  const syncError = offline.syncError
  const syncing = offline.syncing

  const filteredEntries = computed(() => applyFilters(entries.value, filters.value, new Date(), settings.value.timezone))

  const cashableEntries = computed(() => excludeBenefitEntries(filteredEntries.value, accounts.value))

  const allCashableEntries = computed(() => excludeBenefitEntries(entries.value, accounts.value))

  const monthlyKpis = computed(() => computeKpis(filteredEntries.value, accounts.value, new Date(), settings.value.timezone))

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
    const apiBaseUrl = runtime.public.apiBaseUrl as string
    const url = apiBaseUrl ? new URL(path, apiBaseUrl).toString() : path
    const version = sessionGeneration
    const accessToken = await auth.getAccessToken()
    if (version !== sessionGeneration) throw new Error('A sessão mudou. Tente novamente.')
    const response = await $fetch(url, {
      method: options.method ?? 'GET',
      body: options.body,
      headers: {
        'x-edit-key': editKey.value,
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
      }
    }).catch((error: { statusCode?: number }) => {
      const status = error.statusCode
      throw new Error(status === 401 ? 'Sua sessão expirou. Entre novamente para continuar.'
        : status === 403 ? 'Você não tem permissão para alterar este registro.'
        : status === 400 ? 'Confira os campos informados e tente novamente.'
        : status && status >= 500 ? 'O serviço está indisponível no momento. Tente novamente.'
        : 'Não foi possível conectar. Verifique sua conexão e tente novamente.')
    })
    if (version !== sessionGeneration) throw new Error('A sessão mudou. Tente novamente.')
    return response as T
  }

  const { normalizeSettings, applyTheme, setThemeMode } = useFinanceTheme(settings)
  const applyPendingEntries = () => {
    for (const batch of offlineQueue.value) {
      for (const patch of batch.upserts) {
        const index = entries.value.findIndex(entry => entry.id === patch.id)
        if (index >= 0) entries.value[index] = { ...entries.value[index], ...patch } as FinanceEntry
        else entries.value.push({
          householdId: settings.value.id, title: 'Lançamento', description: '', amount: 0,
          kind: 'expense', status: 'pending', origin: 'manual', ruleId: null, accountId: null, categoryId: null,
          dueDate: new Date().toISOString().slice(0, 10), competenceDate: patch.dueDate ?? new Date().toISOString().slice(0, 10),
          installmentIndex: null, installmentTotal: null, metadata: null, excludeFromCalc: false,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...patch,
        } as FinanceEntry)
      }
      entries.value = entries.value.filter(entry => !batch.deletes.includes(entry.id))
    }
  }
  const flushOfflineQueue = async () => {
    if (!import.meta.client || !navigator.onLine) return
    await offline.flush(async batch => {
      const response = await fetchApi<{ entries: FinanceEntry[] }>('/api/entries/batch', { method: 'POST', body: batch })
      entries.value = response.entries
    })
    applyPendingEntries()
    void syncWidgetSnapshot()
  }
  const discardPendingEntries = async () => {
    offline.discard()
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

  const syncWidgetSnapshot = async () => {
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
    const version = sessionGeneration
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
      if (version !== sessionGeneration) throw err
      error.value = err instanceof Error ? err.message : 'Falha ao carregar dados'
      throw err
    } finally {
      if (version === sessionGeneration) loading.value = false
    }
  }

  const saveEntriesBatch = async (batch: EntryBatchRequest) => {
    const stableBatch = { ...batch, upserts: batch.upserts.map(entry => ({ ...entry, id: entry.id ?? crypto.randomUUID() })) }
    if (!import.meta.client) throw new Error('Salve os lançamentos pelo aplicativo.')
    try { offline.enqueue(stableBatch) }
    catch (error) { syncError.value = error instanceof Error ? error.message : 'Não foi possível guardar as alterações locais.'; throw error }
    applyPendingEntries()
    await flushOfflineQueue()
    if (syncError.value) throw new Error(syncError.value)
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
    void syncWidgetSnapshot()
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
        icon: '/icon-192.png'
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
    if (!process.client || !Capacitor.isNativePlatform()) return
    const permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') return
    await LocalNotifications.cancel({ notifications: Array.from({ length: 90 }, (_, id) => ({ id: 700000 + id })) })
    const notifications = upcomingNotifications(entries.value, settings.value.notificationDays, settings.value.notificationTime, settings.value.timezone)
      .map((item, index) => ({ id: 700000 + index, title: item.title, body: item.body, schedule: { at: item.at }, extra: { entryId: item.entryId } }))
    if (notifications.length) await LocalNotifications.schedule({ notifications })
  }

  let notificationTask = Promise.resolve()
  watch([entries, () => settings.value.notificationTime], () => {
    if (!import.meta.client || !Capacitor.isNativePlatform()) return
    notificationTask = notificationTask.then(() => scheduleUpcomingNotifications()).catch(() => { /* OS permissions can change at any time. */ })
  }, { deep: true })

  const resetState = () => {
    sessionGeneration++
    offline.reset()
    settings.value    = defaultSettings()
    accounts.value    = []
    categories.value  = []
    rules.value       = []
    entries.value     = []
    warnings.value    = []
    kpis.value        = { totalIncome: 0, totalExpense: 0, net: 0, pendingAmount: 0, upcoming7Days: 0, cardsUsedPercent: 0 }
    filters.value     = defaultFilters()
    initialized.value = false
    error.value       = null
  }

  let bootTask: Promise<void> | null = null
  let bootGeneration = -1
  const boot = () => {
    if (bootTask && bootGeneration === sessionGeneration) return bootTask
    const version = sessionGeneration
    bootGeneration = version
    const task = runBoot().finally(() => {
      if (bootTask === task) bootTask = null
    })
    bootTask = task
    return task
  }

  const runBoot = async () => {
    const version = sessionGeneration
    initEditKey()
    await bootstrap()
    if (version !== sessionGeneration) return
    if (import.meta.client) {
      offline.load(`${auth.user.value?.id ?? 'demo'}:${settings.value.id}`)
      if (localStorage.getItem('finance-offline-queue')) warnings.value.push('Existem pendências antigas sem identificação de família. Elas foram preservadas e não serão enviadas automaticamente.')
      applyPendingEntries()
      await flushOfflineQueue()
    }
    if (process.client) {
      window.addEventListener('online', flushOfflineQueue)
    }
  }

  onScopeDispose(() => {
    if (import.meta.client) window.removeEventListener('online', flushOfflineQueue)
    offline.reset()
  })

  const getWishItems = () => fetchApi<{ items: WishItem[] }>('/api/wishlist')
  const saveWishItems = (upserts: Partial<WishItem>[], deletes: string[]) => fetchApi<{ items: WishItem[] }>('/api/wishlist/batch', { method: 'POST', body: { upserts, deletes } })
  const getHousehold = () => fetchApi<{ householdId: string; members: { userId: string; email: string; role: string; joinedAt: string }[]; invitations: { id: string; email: string; role: string; expiresAt: string; createdAt: string }[] }>('/api/me/household')
  const createInvitation = (email: string) => fetchApi<{ token: string }>('/api/invitations/create', { method: 'POST', body: { email } })

  const acceptInvitation = async (token: string) => {
    await fetchApi('/api/invitations/accept', { method: 'POST', body: { token } })
    resetState()
    await boot()
  }

  return {
    acceptInvitation, getWishItems, saveWishItems, getHousehold, createInvitation,
    syncError, syncing, discardPendingEntries,
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
    previewOnboardingImport,
    importOnboardingWorkbook,
    saveOnboarding,
    requestNotifications,
    notifyUpcoming,
    monthlyKpis,
    applyTheme,
    setThemeMode,
    flushOfflineQueue,
    scheduleUpcomingNotifications
  }
})
