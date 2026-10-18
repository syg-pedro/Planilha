import { computed, nextTick, onActivated, onMounted, onScopeDispose, ref, watch } from 'vue'
import {
  createFinanceQuery,
  financeQueryMonths,
  filterFinanceQuery,
  hasFinanceQueryFilters,
  parseFinanceQuery,
  serializeFinanceQuery
} from '#shared/financeQuery'
import { useFinanceStore } from '../stores/useFinanceStore'

export function usePlanilhaQuery() {
  const store = useFinanceStore()
  const route = useRoute()
  const router = useRouter()
  const compact = ref(import.meta.client && window.matchMedia('(max-width: 767px)').matches)
  let media: MediaQueryList | undefined
  const updateViewport = () => { compact.value = media?.matches ?? false }
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: store.settings.timezone,
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(new Date())
  const todayMonth = `${today.find((part) => part.type === 'year')!.value}-${today.find((part) => part.type === 'month')!.value}`
  const state = useState(`planilha-query:${store.settings.id}`, () => ({
    query: createFinanceQuery(todayMonth, store.settings.periodMode),
    initialized: false
  }))
  const query = computed({
    get: () => state.value.query,
    set: (value) => {
      state.value.query = value
    }
  })
  watch(
    [compact, () => query.value.presentation],
    ([mobile, presentation]) => {
      if (mobile && presentation !== 'list') query.value.presentation = 'list'
    },
    { immediate: true, flush: 'sync' }
  )
  let timer: ReturnType<typeof setTimeout> | undefined
  let applyingRoute = false
  function syncRoute() {
    if (route.path !== '/planilha' || !import.meta.client) return
    // Commands are consumed by the workspace in one navigation; never reinsert them.
    if (route.query.entry || route.query.new) return
    const next = { ...route.query, ...serializeFinanceQuery(query.value) }
    if (Object.entries(next).every(([key, value]) => route.query[key] === value)) return
    void router.replace({ path: '/planilha', query: next })
  }
  watch(
    () => route.fullPath,
    () => {
      if (route.path !== '/planilha') return
      clearTimeout(timer)
      applyingRoute = true
      Object.assign(query.value, parseFinanceQuery(route.query, query.value))
      applyingRoute = false
    },
    { immediate: true, flush: 'sync' }
  )
  watch(
    query,
    () => {
      if (applyingRoute || route.path !== '/planilha' || !import.meta.client) return
      clearTimeout(timer)
      timer = setTimeout(syncRoute, 160)
    },
    { deep: true }
  )
  onMounted(() => {
    media = window.matchMedia('(max-width: 767px)')
    updateViewport()
    media.addEventListener('change', updateViewport)
    if (!state.value.initialized) {
      if (!route.query.range && compact.value) query.value.range = 'month'
      state.value.initialized = true
    }
    void nextTick(syncRoute)
  })
  onActivated(() => void nextTick(syncRoute))
  onScopeDispose(() => {
    clearTimeout(timer)
    media?.removeEventListener('change', updateViewport)
  })
  const months = computed(() => financeQueryMonths(query.value))
  const entries = computed(() => filterFinanceQuery(store.entries, store.accounts, query.value))
  const periodEntries = computed(() =>
    filterFinanceQuery(store.entries, store.accounts, {
      ...query.value,
      search: '',
      kind: 'all',
      status: 'all',
      accountId: ''
    })
  )
  const filtered = computed(() => hasFinanceQueryFilters(query.value))
  function clearFilters() {
    Object.assign(query.value, { search: '', kind: 'all', status: 'all', accountId: '' })
  }
  return { query, months, entries, periodEntries, filtered, todayMonth, clearFilters, compact }
}
