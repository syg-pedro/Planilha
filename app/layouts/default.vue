<template>
  <UDashboardGroup unit="px" :persistent="false" storage-key="planilha-workspace" class="app-shell" :class="{ 'app-shell--mobile': isMobile, 'app-shell--keyboard': keyboardOpen }">
    <a class="app-skip-link" href="#main-content">Ir para o conteúdo</a>
    <UDashboardSidebar v-if="!isMobile" id="navigation" v-model:collapsed="collapsed" collapsible :default-size="216" :min-size="216" :max-size="280" :collapsed-size="64" :toggle="false" :ui="sidebarUi" aria-label="Menu principal">
      <template #header>
        <UButton :to="linkTo('planilha')" icon="i-lucide-grid-2x2" :label="collapsed ? undefined : 'Planilha'" :square="collapsed" color="primary" variant="link" size="lg" aria-label="Planilha, página principal" class="w-full justify-start" />
      </template>
      <UNavigationMenu :items="primaryMenu" :collapsed="collapsed" tooltip orientation="vertical" as="nav" aria-label="Principal" :ui="navigationUi">
        <template #list-trailing>
          <UCollapsible v-model:open="secondaryOpen" class="mt-2">
            <UButton icon="i-lucide-menu" :label="collapsed ? undefined : 'Mais ferramentas'" :trailing-icon="collapsed ? undefined : 'i-lucide-chevron-down'" color="neutral" variant="ghost" :square="collapsed" block :aria-label="collapsed ? 'Mais ferramentas' : undefined" class="min-h-10 justify-start" @click="expandSidebar" />
            <template #content>
              <UNavigationMenu v-if="!collapsed" :items="secondaryMenu" orientation="vertical" as="div" aria-label="Mais ferramentas" :ui="{ ...navigationUi, root: 'mt-1 ms-2 border-s border-default ps-2' }" />
            </template>
          </UCollapsible>
        </template>
      </UNavigationMenu>
      <template #footer>
        <UNavigationMenu :items="settingsMenu" :collapsed="collapsed" tooltip orientation="vertical" as="nav" aria-label="Preferências" :ui="navigationUi" />
        <UButton :icon="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'" :label="collapsed ? undefined : 'Recolher menu'" :aria-label="collapsed ? 'Expandir menu' : 'Recolher menu'" :square="collapsed" color="neutral" variant="ghost" class="min-h-10 w-full justify-start" @click="collapsed = !collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel id="workspace" :ui="{ root: 'min-h-0 h-full flex-1', body: 'min-h-0 gap-0 p-0 sm:p-0 overflow-y-auto' }">
      <template #header>
        <header ref="headerElement" class="app-header">
          <UDashboardNavbar :title="currentItemLabel" :toggle="false" :ui="{ root: 'h-12 px-3 sm:px-4 gap-2', title: 'text-base' }">
            <template #right>
              <UButton :to="linkTo('alerts')" icon="i-lucide-bell" color="neutral" variant="ghost" :aria-label="alertCount ? `Alertas: ${alertCount} ativo(s)` : 'Alertas'" title="Alertas" class="app-header-action relative">
                <template v-if="alertCount" #trailing><UBadge :label="alertCount > 99 ? '99+' : alertCount" color="error" size="sm" class="absolute -top-0.5 -end-0.5 min-w-4 justify-center px-1" /></template>
              </UButton>
              <UButton icon="i-lucide-circle-help" color="neutral" variant="ghost" title="Ajuda desta tela" aria-label="Ajuda desta tela" class="app-header-action" @click="helpMenuOpen = true" />
            </template>
          </UDashboardNavbar>
        </header>
      </template>
      <template #body>
        <main id="main-content" class="app-content" :class="{ 'app-content--planilha': activeScreen === 'planilha' }" tabindex="-1"><slot /></main>
      </template>
    </UDashboardPanel>

    <div v-if="isMobile && !keyboardOpen" ref="bottomNavigationElement" class="app-mobile-bar">
      <UNavigationMenu :items="bottomMenu" orientation="horizontal" as="nav" aria-label="Principal" :ui="bottomNavigationUi" />
    </div>

    <BaseModal :open="moreOpen" title="Mais" subtitle="Ferramentas e preferências" @close="moreOpen = false">
      <UNavigationMenu :items="mobileMoreMenu" orientation="vertical" as="nav" aria-label="Mais ferramentas" :ui="{ ...navigationUi, link: 'min-h-11 px-3 py-2 text-sm' }" />
      <USeparator class="my-3" />
      <UButton icon="i-lucide-log-out" label="Sair da conta" color="error" variant="ghost" block class="min-h-11 justify-start" @click="logout()" />
    </BaseModal>
    <BaseModal :open="helpMenuOpen" :title="`Ajuda · ${currentItemLabel}`" @close="helpMenuOpen = false">
      <UNavigationMenu :items="contextHelpMenu" orientation="vertical" as="nav" aria-label="Tópicos de ajuda" :ui="{ ...navigationUi, link: 'min-h-11 px-3 py-2 text-sm', linkLabel: 'whitespace-normal' }" />
      <USeparator class="my-3" />
      <UButton icon="i-lucide-book-open" label="Abrir central de ajuda" variant="soft" block class="min-h-11 justify-start" @click="openHelp()" />
    </BaseModal>
  </UDashboardGroup>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import { App } from '@capacitor/app'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import BaseModal from '~/components/base/BaseModal.vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useFinanceNavigation } from '~/features/finance/composables/useFinanceNavigation'
import { useFinanceAlerts } from '~/features/finance/composables/useFinanceAlerts'
import { ALL_NAV_ITEMS, PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS, BOTTOM_NAV_ITEMS, SETTINGS_SECTION_ITEMS, financeScreenForPath } from '~/features/finance/constants/ui'
import { helpForScreen } from '~/features/finance/constants/helpContent'

const store = useFinanceStore()
const route = useRoute()
const router = useRouter()
const { logout } = useLogout()
const { activeScreen, goTo, linkTo } = useFinanceNavigation()
const { count: alertCount } = useFinanceAlerts()
const isNativePlatform = Capacitor.isNativePlatform()
const collapsed = ref(false)
const secondaryOpen = ref(false)
const moreOpen = ref(false)
const helpMenuOpen = ref(false)
const isMobile = ref(isNativePlatform)
const keyboardOpen = ref(false)
const headerElement = ref<HTMLElement | null>(null)
const bottomNavigationElement = ref<HTMLElement | null>(null)
const currentItemLabel = computed(() => ALL_NAV_ITEMS.find(item => item.id === activeScreen.value)?.label ?? 'Planilha')
const isSecondaryScreen = computed(() => !BOTTOM_NAV_ITEMS.some(item => item.id === activeScreen.value))
const currentHelpGroup = computed(() => helpForScreen(activeScreen.value))
const helpFocus = useState<{ screenId: string; topicId?: string } | null>('help-focus', () => null)
const legacyScreen = useState<string>('finance-screen', () => activeScreen.value)
const icons: Record<string, string> = {
  grid: 'i-lucide-grid-2x2', dashboard: 'i-lucide-layout-dashboard', card: 'i-lucide-wallet-cards', reports: 'i-lucide-chart-no-axes-combined',
  planning: 'i-lucide-calendar-range', debt: 'i-lucide-landmark', subscription: 'i-lucide-repeat', wishlist: 'i-lucide-heart',
  alerts: 'i-lucide-bell', settings: 'i-lucide-settings', sparkle: 'i-lucide-sparkles', help: 'i-lucide-circle-help', refresh: 'i-lucide-refresh-cw',
}
const navigationUi = { root: 'w-full', link: 'min-h-10 px-3 py-2 text-sm', linkLeadingIcon: 'size-4.5', linkLabel: 'text-sm' }
const sidebarUi = { root: 'flex min-h-0 h-full bg-default', header: 'h-12 px-2', body: 'gap-2 px-2 py-3', footer: 'flex-col items-stretch border-t border-default px-2 py-2' }
const bottomNavigationUi = {
  root: 'h-full w-full gap-0 [&>div]:w-full', list: 'grid grid-cols-4 w-full h-full gap-0', item: 'p-0 min-w-0',
  link: 'h-14 min-h-14 w-full flex-col justify-center gap-1 px-1 py-1',
  linkLeadingIcon: 'size-5', linkLabel: 'text-[11px] leading-3', viewportWrapper: 'hidden',
}
const navigationItem = (item: { id: string; label: string; icon: string }): NavigationMenuItem => ({
  value: item.id, label: item.label, icon: icons[item.icon] ?? 'i-lucide-circle', to: linkTo(item.id), active: activeScreen.value === item.id,
})
const primaryMenu = computed(() => PRIMARY_NAV_ITEMS.map(navigationItem))
const secondaryMenu = computed(() => SECONDARY_NAV_ITEMS.map(navigationItem))
const settingsMenu = computed(() => [navigationItem(SETTINGS_SECTION_ITEMS[0])])
const bottomMenu = computed<NavigationMenuItem[]>(() => [
  ...BOTTOM_NAV_ITEMS.map(navigationItem),
  { value: 'more', label: 'Mais', icon: 'i-lucide-menu', active: moreOpen.value || isSecondaryScreen.value, onSelect: () => { moreOpen.value = true } },
])
const mobileMoreMenu = computed(() => [PRIMARY_NAV_ITEMS[3], ...SECONDARY_NAV_ITEMS, ...SETTINGS_SECTION_ITEMS].map(item => ({ ...navigationItem(item), onSelect: () => { moreOpen.value = false } })))
const contextHelpMenu = computed<NavigationMenuItem[]>(() => (currentHelpGroup.value?.topics ?? []).map(topic => ({ value: topic.id, label: topic.title, icon: 'i-lucide-chevron-right', onSelect: () => openHelp(topic.id) })))

// Keep older consumers working while the URL remains the source of truth.
watch(activeScreen, (screen) => {
  legacyScreen.value = screen
  if (SECONDARY_NAV_ITEMS.some(item => item.id === screen)) secondaryOpen.value = true
}, { immediate: true, flush: 'sync' })
watch(legacyScreen, (screen) => {
  if (screen !== activeScreen.value && financeScreenForPath(route.path)) void goTo(screen)
})
watch(() => route.fullPath, () => { moreOpen.value = false; helpMenuOpen.value = false })
watch(() => store.settings.themeMode, () => store.applyTheme(), { immediate: true })
watch(collapsed, value => { if (value) secondaryOpen.value = false })
const expandSidebar = () => { if (collapsed.value) collapsed.value = false }
const openHelp = (topicId?: string) => {
  helpFocus.value = { screenId: activeScreen.value, topicId }
  helpMenuOpen.value = false
  void goTo('help')
}

let viewportObserver: ResizeObserver | undefined
let backButtonListener: PluginListenerHandle | undefined
let mobileMediaQuery: MediaQueryList | undefined
let availableViewportHeight = 0
let previousViewportWidth = 0
const updateViewport = () => {
  isMobile.value = isNativePlatform || window.matchMedia('(max-width: 767px)').matches
  const viewport = window.visualViewport
  const inputFocused = document.activeElement?.matches('input, textarea, select, [contenteditable="true"]') ?? false
  const viewportHeight = viewport?.height ?? window.innerHeight
  if (!inputFocused || Math.abs(window.innerWidth - previousViewportWidth) > 120) availableViewportHeight = viewportHeight
  previousViewportWidth = window.innerWidth
  keyboardOpen.value = isMobile.value && inputFocused && Math.max(window.innerHeight - viewportHeight, availableViewportHeight - viewportHeight) > 140
  const root = document.documentElement
  const bottomHeight = isMobile.value && !keyboardOpen.value ? bottomNavigationElement.value?.getBoundingClientRect().height ?? 56 : 0
  root.style.setProperty('--app-bottom-offset', `${Math.ceil(bottomHeight)}px`)
  root.style.setProperty('--app-header-height', `${headerElement.value?.getBoundingClientRect().height ?? 48}px`)
  root.style.setProperty('--app-viewport-height', `${viewport?.height ?? window.innerHeight}px`)
}
watch([isMobile, keyboardOpen], () => void nextTick(updateViewport))
const handleNativeBack = async () => {
  const backEvent = new Event('finance:back', { cancelable: true })
  if (!window.dispatchEvent(backEvent)) return
  if (helpMenuOpen.value) { helpMenuOpen.value = false; return }
  if (moreOpen.value) { moreOpen.value = false; return }
  if (keyboardOpen.value) { (document.activeElement as HTMLElement | null)?.blur(); return }
  const previous = router.options.history.state.back
  if (typeof previous === 'string' && financeScreenForPath(previous.split('?')[0] ?? '')) router.back()
  else if (activeScreen.value !== 'planilha') await router.replace(linkTo('planilha'))
  else await App.minimizeApp()
}
onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 767px)')
  updateViewport()
  window.addEventListener('resize', updateViewport)
  window.addEventListener('focusin', updateViewport)
  window.addEventListener('focusout', updateViewport)
  window.visualViewport?.addEventListener('resize', updateViewport)
  mobileMediaQuery.addEventListener('change', updateViewport)
  viewportObserver = new ResizeObserver(updateViewport)
  if (headerElement.value) viewportObserver.observe(headerElement.value)
  if (isNativePlatform) void App.addListener('backButton', handleNativeBack).then(listener => { backButtonListener = listener })
})
onUnmounted(() => {
  window.removeEventListener('resize', updateViewport)
  window.removeEventListener('focusin', updateViewport)
  window.removeEventListener('focusout', updateViewport)
  window.visualViewport?.removeEventListener('resize', updateViewport)
  mobileMediaQuery?.removeEventListener('change', updateViewport)
  viewportObserver?.disconnect()
  void backButtonListener?.remove()
  for (const property of ['--app-bottom-offset', '--app-header-height', '--app-viewport-height']) document.documentElement.style.removeProperty(property)
})
</script>

<style>
.app-shell { --app-content-gap: 16px; min-width: 0; background: var(--ui-bg); color: var(--ui-text); }
html { scroll-padding-top: calc(var(--app-header-height, 48px) + 12px); }
.app-skip-link { position: fixed; z-index: 1100; top: 8px; left: 8px; padding: 10px; transform: translateY(-180%); background: var(--ui-bg); color: var(--ui-text); outline: 2px solid var(--ui-primary); border-radius: var(--ui-radius); }
.app-skip-link:focus { transform: none; }
.app-header { flex-shrink: 0; padding-top: env(safe-area-inset-top, 0px); background: var(--ui-bg); }
.app-header-action { width: 40px; height: 40px; justify-content: center; }
.app-content { width: 100%; max-width: 1200px; margin: 0 auto; padding: var(--app-content-gap); outline: none; }
.app-content--planilha { max-width: none; }
.app-mobile-bar { position: fixed; z-index: 40; inset: auto 0 0; height: calc(56px + env(safe-area-inset-bottom, 0px)); padding: 0 env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); background: var(--ui-bg); border-top: 1px solid var(--ui-border); }
.app-shell--mobile { --app-content-gap: 10px; }
.app-shell--mobile .app-content { padding-bottom: calc(var(--app-bottom-offset, 56px) + var(--app-content-gap)); padding-left: max(var(--app-content-gap), env(safe-area-inset-left, 0px)); padding-right: max(var(--app-content-gap), env(safe-area-inset-right, 0px)); }
.app-shell--mobile .app-header { padding-left: env(safe-area-inset-left, 0px); padding-right: env(safe-area-inset-right, 0px); }
.app-shell--mobile .app-header-action { width: 44px; height: 44px; }
</style>
