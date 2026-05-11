<template>
  <section>
    <BasePanel v-if="store.error" title="Erro" class="ds-alert-error text-sm">{{ store.error }}</BasePanel>
    <BasePanel v-if="store.warnings.length > 0" title="Avisos de importacao inicial" class="ds-alert-warning text-sm">
      <ul class="list-disc space-y-1 pl-5">
        <li v-for="warning in store.warnings" :key="warning">{{ warning }}</li>
      </ul>
    </BasePanel>

    <div v-if="store.loading" class="space-y-4">
      <div v-for="n in 3" :key="n" class="h-32 animate-pulse rounded-2xl border" :style="{ background: 'var(--surface2)', borderColor: 'var(--border)' }" />
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
      <DesignSystemScreen v-else-if="activeScreen === 'design-system'" key="design-system"/>
      <ConfiguracoesScreen v-else-if="activeScreen === 'config'"       key="config"       />
      <div v-else key="empty" style="text-align: center; padding: 60px 20px">
        <p style="font-size: 15px; font-weight: 700; color: var(--text)">Em desenvolvimento</p>
        <p style="font-size: 13px; color: var(--text3); margin-top: 6px">Este módulo estará disponível em breve.</p>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import MatrizScreen        from '~/features/finance/components/screens/MatrizScreen.vue'
import DashboardScreen     from '~/features/finance/components/screens/DashboardScreen.vue'
import AssinaturasScreen   from '~/features/finance/components/screens/AssinaturasScreen.vue'
import DividasScreen       from '~/features/finance/components/screens/DividasScreen.vue'
import PlanejamentoScreen  from '~/features/finance/components/screens/PlanejamentoScreen.vue'
import RelatoriosScreen    from '~/features/finance/components/screens/RelatoriosScreen.vue'
import AlertasScreen       from '~/features/finance/components/screens/AlertasScreen.vue'
import DesignSystemScreen  from '~/features/finance/components/screens/DesignSystemScreen.vue'
import ConfiguracoesScreen    from '~/features/finance/components/screens/ConfiguracoesScreen.vue'
import CartoesScreen         from '~/features/finance/components/screens/CartoesScreen.vue'
import ListaDeDesejosScreen  from '~/features/finance/components/screens/ListaDeDesejosScreen.vue'

const store = useFinanceStore()
const activeScreen = useState('finance-screen', () => 'dashboard')

const goTo = (screen: string) => { activeScreen.value = screen }
</script>
