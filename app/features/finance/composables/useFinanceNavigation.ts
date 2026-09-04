import { watch } from 'vue'

const screens = new Set(['dashboard', 'planilha', 'subscriptions', 'debts', 'cartoes', 'wishlist', 'planning', 'reports', 'alerts', 'onboarding', 'help', 'changelog', 'design-system', 'config'])
export const useFinanceNavigation = () => {
  const route = useRoute()
  const router = useRouter()
  const screen = useState('finance-screen', () => 'dashboard')
  watch(() => route.query.screen, value => {
    if (route.path === '/') screen.value = typeof value === 'string' && screens.has(value) ? value : 'dashboard'
  }, { immediate: true })
  watch(screen, value => {
    if (route.path === '/' && value !== (route.query.screen ?? 'dashboard')) {
      void router.push({ query: { ...route.query, screen: screens.has(value) ? value : 'dashboard' } })
    }
  })
  return { screen }
}
