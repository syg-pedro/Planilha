<template>
  <section class="space-y-4">
    <BasePanel>
      <div class="flex flex-wrap items-center gap-2">
        <BaseButton
          v-for="tab in tabs"
          :key="tab.id"
          :variant="activeTab === tab.id ? 'primary' : 'secondary'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </BaseButton>

        <div class="ml-auto grid w-full gap-2 sm:w-auto sm:grid-flow-col">
          <BaseSelect v-model="store.filters.range">
            <option v-for="option in rangeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </BaseSelect>

          <BaseSelect v-model="selectedAccount">
            <option value="">Todas as contas</option>
            <option v-for="account in store.accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
          </BaseSelect>

          <BaseSelect v-model="selectedCategory">
            <option value="">Todas as categorias</option>
            <option v-for="category in store.categories" :key="category.id" :value="category.id">{{ category.name }}</option>
          </BaseSelect>
        </div>
      </div>
    </BasePanel>

    <BasePanel
      v-if="store.error"
      title="Erro"
      class="ds-alert-error text-sm"
    >
      {{ store.error }}
    </BasePanel>

    <BasePanel
      v-if="store.warnings.length > 0"
      title="Avisos de importacao inicial"
      class="ds-alert-warning text-sm"
    >
      <ul class="list-disc space-y-1 pl-5">
        <li v-for="warning in store.warnings" :key="warning">{{ warning }}</li>
      </ul>
    </BasePanel>

    <transition name="fade-slide" mode="out-in">
      <div v-if="activeTab === 'dashboard'" key="dashboard" class="space-y-4">
        <FinanceKpiCards v-if="isWidgetEnabled('kpis')" :kpis="store.kpis" />
        <FinanceCharts />
      </div>

      <FinanceEntryGrid v-else-if="activeTab === 'planilha'" key="grid" />

      <FinanceCalendar v-else-if="activeTab === 'calendario'" key="calendar" />

      <FinanceSettingsPanel v-else key="settings" />
    </transition>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { FINANCE_TABS, RANGE_OPTIONS } from '~/features/finance/constants/ui'
import FinanceKpiCards from '~/features/finance/components/FinanceKpiCards.vue'
import FinanceCharts from '~/features/finance/components/FinanceCharts.vue'
import FinanceEntryGrid from '~/features/finance/components/FinanceEntryGrid.vue'
import FinanceCalendar from '~/features/finance/components/FinanceCalendar.vue'
import FinanceSettingsPanel from '~/features/finance/components/FinanceSettingsPanel.vue'

const store = useFinanceStore()

const tabs = FINANCE_TABS
const rangeOptions = RANGE_OPTIONS

const activeTab = ref<(typeof FINANCE_TABS)[number]['id']>('dashboard')
const selectedAccount = ref('')
const selectedCategory = ref('')

watch(selectedAccount, (value) => {
  store.filters.accountIds = value ? [value] : []
})

watch(selectedCategory, (value) => {
  store.filters.categoryIds = value ? [value] : []
})

const isWidgetEnabled = (id: string) => store.settings.dashboardConfig.visibleWidgets.includes(id)
</script>
