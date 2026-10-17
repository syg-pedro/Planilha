<template>
  <section class="finance-workspace">
    <UAlert v-if="store.error" title="Não foi possível concluir" :description="store.error" icon="i-lucide-circle-alert" color="error" variant="soft" role="alert" class="mb-3" />
    <UAccordion v-if="store.warnings.length" :items="warningItems" class="mb-3" :ui="{ trigger: 'text-sm py-2', body: 'text-sm text-muted' }">
      <template #body><ul class="list-disc space-y-1 ps-5"><li v-for="warning in store.warnings" :key="warning">{{ warning }}</li></ul></template>
    </UAccordion>
    <UProgress v-if="store.loading && !store.initialized" aria-label="Carregando seus dados" class="my-4" />
    <Transition name="fade-slide" mode="out-in">
      <KeepAlive :max="16">
        <component :is="currentScreen" :key="activeScreen" @navigate="goTo" />
      </KeepAlive>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useFinanceNavigation } from '~/features/finance/composables/useFinanceNavigation'
import { ALL_NAV_ITEMS, type FinanceScreenId } from '~/features/finance/constants/ui'
import FinanceScreenLoading from './FinanceScreenLoading.vue'
import FinanceScreenError from './FinanceScreenError.vue'

const store = useFinanceStore()
const warningItems = computed(() => [{ label: `${store.warnings.length} aviso(s) da importação inicial`, value: 'warnings', icon: 'i-lucide-triangle-alert' }])
const { activeScreen, goTo } = useFinanceNavigation()
const screen = (loader: () => Promise<{ default: Component }>) => defineAsyncComponent({ loader, delay: 180, timeout: 30_000, loadingComponent: FinanceScreenLoading, errorComponent: FinanceScreenError })
const screens = {
  planilha: screen(() => import('../screens/MatrizScreen.vue')),
  dashboard: screen(() => import('../screens/DashboardScreen.vue')),
  cartoes: screen(() => import('../screens/CartoesScreen.vue')),
  reports: screen(() => import('../screens/RelatoriosScreen.vue')),
  planning: screen(() => import('../screens/PlanejamentoScreen.vue')),
  debts: screen(() => import('../screens/DividasScreen.vue')),
  subscriptions: screen(() => import('../screens/AssinaturasScreen.vue')),
  wishlist: screen(() => import('../screens/ListaDeDesejosScreen.vue')),
  alerts: screen(() => import('../screens/AlertasScreen.vue')),
  onboarding: screen(() => import('../screens/PrimeirosPassosScreen.vue')),
  help: screen(() => import('../screens/AjudaScreen.vue')),
  changelog: screen(() => import('../screens/ChangelogScreen.vue')),
  config: screen(() => import('../screens/ConfiguracoesScreen.vue')),
  'design-system': screen(() => import('../screens/DesignSystemScreen.vue')),
} satisfies Record<FinanceScreenId, ReturnType<typeof defineAsyncComponent>>
const currentScreen = computed(() => screens[activeScreen.value])
useHead({ title: () => `${ALL_NAV_ITEMS.find(item => item.id === activeScreen.value)?.label ?? 'Planilha'} · Planilha` })
</script>

<style scoped>
.finance-workspace { min-width: 0; }
</style>
