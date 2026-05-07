<template>
  <section class="space-y-4">
    <BasePanel v-if="store.error" title="Erro" class="ds-alert-error text-sm">{{ store.error }}</BasePanel>
    <BasePanel v-if="store.warnings.length > 0" title="Avisos de importacao inicial" class="ds-alert-warning text-sm">
      <ul class="list-disc space-y-1 pl-5">
        <li v-for="warning in store.warnings" :key="warning">{{ warning }}</li>
      </ul>
    </BasePanel>

    <div v-if="store.loading" class="space-y-4">
      <div
        v-for="n in 3"
        :key="n"
        class="h-32 animate-pulse rounded-2xl border"
        :style="{ background: 'var(--surface2)', borderColor: 'var(--border)' }"
      />
    </div>

    <transition v-else name="fade-slide" mode="out-in">
      <div v-if="activeTab === 'dashboard'" key="dashboard" class="space-y-4">
        <FinanceKpiCards :kpis="store.kpis" />
        <FinanceCharts />
      </div>

      <FinanceEntryGrid v-else-if="activeTab === 'planilha'" key="grid" />

      <FinanceCalendar v-else-if="activeTab === 'calendario'" key="calendar" />

      <FinanceSettingsPanel v-else key="settings" />
    </transition>
  </section>
</template>

<script setup lang="ts">
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import FinanceKpiCards from '~/features/finance/components/FinanceKpiCards.vue'
import FinanceCharts from '~/features/finance/components/FinanceCharts.vue'
import FinanceEntryGrid from '~/features/finance/components/FinanceEntryGrid.vue'
import FinanceCalendar from '~/features/finance/components/FinanceCalendar.vue'
import FinanceSettingsPanel from '~/features/finance/components/FinanceSettingsPanel.vue'

const store = useFinanceStore()
const activeTab = useState('finance-tab', () => 'dashboard')
</script>
