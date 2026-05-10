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
      <FinanceEntryGrid   v-else-if="activeScreen === 'planilha'"      key="planilha"     />
      <OrcamentosScreen   v-else-if="activeScreen === 'budget'"        key="budget"       />
      <MetasScreen        v-else-if="activeScreen === 'goals'"         key="goals"        />
      <AssinaturasScreen  v-else-if="activeScreen === 'subscriptions'" key="subscriptions"/>
      <DividasScreen      v-else-if="activeScreen === 'debts'"         key="debts"        />
      <PatrimonioScreen   v-else-if="activeScreen === 'patrimony'"     key="patrimony"    />
      <PlanejamentoScreen v-else-if="activeScreen === 'planning'"      key="planning"     />
      <CenariosScreen     v-else-if="activeScreen === 'scenarios'"     key="scenarios"    />
      <RelatoriosScreen   v-else-if="activeScreen === 'reports'"       key="reports"      />
      <ConciliacaoScreen  v-else-if="activeScreen === 'reconcile'"     key="reconcile"    />
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
import FinanceEntryGrid    from '~/features/finance/components/FinanceEntryGrid.vue'
import DashboardScreen     from '~/features/finance/components/screens/DashboardScreen.vue'
import OrcamentosScreen    from '~/features/finance/components/screens/OrcamentosScreen.vue'
import MetasScreen         from '~/features/finance/components/screens/MetasScreen.vue'
import AssinaturasScreen   from '~/features/finance/components/screens/AssinaturasScreen.vue'
import DividasScreen       from '~/features/finance/components/screens/DividasScreen.vue'
import PatrimonioScreen    from '~/features/finance/components/screens/PatrimonioScreen.vue'
import PlanejamentoScreen  from '~/features/finance/components/screens/PlanejamentoScreen.vue'
import CenariosScreen      from '~/features/finance/components/screens/CenariosScreen.vue'
import RelatoriosScreen    from '~/features/finance/components/screens/RelatoriosScreen.vue'
import ConciliacaoScreen   from '~/features/finance/components/screens/ConciliacaoScreen.vue'
import AlertasScreen       from '~/features/finance/components/screens/AlertasScreen.vue'
import DesignSystemScreen  from '~/features/finance/components/screens/DesignSystemScreen.vue'
import ConfiguracoesScreen from '~/features/finance/components/screens/ConfiguracoesScreen.vue'

const store = useFinanceStore()
const activeScreen = useState('finance-screen', () => 'dashboard')

const goTo = (screen: string) => { activeScreen.value = screen }
</script>
