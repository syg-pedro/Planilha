<template>
  <section>
    <FinanceSyncStatus />
    <BasePanel v-if="store.error" title="Erro" class="ds-alert-error text-sm">{{ store.error }}</BasePanel>
    <BasePanel v-if="store.warnings.length > 0" title="Avisos" class="ds-alert-warning text-sm">
      <ul class="list-disc space-y-1 pl-5">
        <li v-for="warning in store.warnings" :key="warning">{{ warning }}</li>
      </ul>
    </BasePanel>

    <div v-if="store.loading" class="space-y-4">
      <div v-for="n in 3" :key="n" class="h-32 animate-pulse rounded-sm border-2 shadow-panel" :style="{ background: 'var(--surface2)', borderColor: 'var(--border)' }" />
    </div>

    <transition v-else name="fade-slide" mode="out-in">
      <DashboardScreen    v-if="activeScreen === 'dashboard'"    key="dashboard"    @navigate="goTo" />
      <MatrizScreen       v-else-if="activeScreen === 'planilha'"      key="planilha"     />
      <AssinaturasScreen  v-else-if="activeScreen === 'subscriptions'" key="subscriptions"/>
      <DividasScreen          v-else-if="activeScreen === 'debts'"    key="debts"    />
      <CartoesScreen        v-else-if="activeScreen === 'cartoes'"  key="cartoes"  />
      <ListaDeDesejosScreen v-else-if="activeScreen === 'wishlist'" key="wishlist" />
      <PlanejamentoScreen v-else-if="activeScreen === 'planning'"      key="planning"     />
      <RelatoriosScreen   v-else-if="activeScreen === 'reports'"       key="reports"      />
      <AlertasScreen      v-else-if="activeScreen === 'alerts'"        key="alerts"        @navigate="goTo" />
      <PrimeirosPassosScreen v-else-if="activeScreen === 'onboarding'" key="onboarding" @navigate="goTo" />
      <AjudaScreen        v-else-if="activeScreen === 'help'"          key="help"         />
      <ChangelogScreen    v-else-if="activeScreen === 'changelog'"     key="changelog"    />
      <DesignSystemScreen v-else-if="activeScreen === 'design-system'" key="design-system"/>
      <ConfiguracoesScreen v-else-if="activeScreen === 'config'"       key="config"       @navigate="goTo" />
      <div v-else key="empty" style="text-align: center; padding: 60px 20px">
        <p style="font-size: 15px; font-weight: 700; color: var(--text)">Em desenvolvimento</p>
        <p style="font-size: 13px; color: var(--text3); margin-top: 6px">Este módulo estará disponível em breve.</p>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import FinanceSyncStatus from '~/features/finance/components/FinanceSyncStatus.vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
const MatrizScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/MatrizScreen.vue'))
const DashboardScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/DashboardScreen.vue'))
const AssinaturasScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/AssinaturasScreen.vue'))
const DividasScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/DividasScreen.vue'))
const PlanejamentoScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/PlanejamentoScreen.vue'))
const RelatoriosScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/RelatoriosScreen.vue'))
const AlertasScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/AlertasScreen.vue'))
const PrimeirosPassosScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/PrimeirosPassosScreen.vue'))
const DesignSystemScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/DesignSystemScreen.vue'))
const ConfiguracoesScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/ConfiguracoesScreen.vue'))
const CartoesScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/CartoesScreen.vue'))
const ListaDeDesejosScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/ListaDeDesejosScreen.vue'))
const AjudaScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/AjudaScreen.vue'))
const ChangelogScreen = defineAsyncComponent(() => import('~/features/finance/components/screens/ChangelogScreen.vue'))

const store = useFinanceStore()
const activeScreen = useState('finance-screen', () => 'dashboard')

const goTo = (screen: string) => { activeScreen.value = screen }
</script>
