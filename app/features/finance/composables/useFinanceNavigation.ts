import { computed } from 'vue'
import type { LocationQueryRaw } from 'vue-router'
import { FINANCE_SCREEN_PATHS, financeScreenForPath, type FinanceScreenId } from '~/features/finance/constants/ui'

/** Real routes with legacy screen IDs at the component boundary. */
export function useFinanceNavigation() {
  const route = useRoute()
  const router = useRouter()
  const activeScreen = computed(() => financeScreenForPath(route.path) ?? 'planilha')
  const linkTo = (screen: string, query: LocationQueryRaw = {}) => {
    const path = FINANCE_SCREEN_PATHS[screen as FinanceScreenId] ?? (screen.startsWith('/') ? screen : '/planilha')
    return { path, query: { ...(route.query.key ? { key: route.query.key } : {}), ...query } }
  }
  const goTo = (screen: string, query: LocationQueryRaw = {}) => router.push(linkTo(screen, query))
  return { activeScreen, goTo, linkTo }
}
