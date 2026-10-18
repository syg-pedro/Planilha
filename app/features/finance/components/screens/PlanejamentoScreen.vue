<template>
<div class="space-y-4">
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4"><BaseKpiCard icon="income" label="Receita anual estimada" :value="fmt(annualKpis.projectedIncome)" color="var(--success)" /><BaseKpiCard icon="expense" label="Despesa anual estimada" :value="fmt(annualKpis.projectedExpense)" color="var(--warning)" /><BaseKpiCard icon="balance" label="Sobra anual estimada" :value="fmt(annualKpis.projectedNet)" :color="annualKpis.projectedNet >= 0 ? 'var(--success)' : 'var(--danger)'" /><BaseKpiCard icon="warning" label="Meses de risco" :value="`${annualKpis.riskMonths} meses`" color="var(--danger)" sub="Despesa maior que a receita" /></div>
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header><div class="flex flex-wrap items-center justify-between gap-3"><div><h3 class="text-sm font-semibold text-highlighted">Planejamento {{ year }}</h3><p class="mt-1 text-xs text-muted">Por {{ store.settings.periodMode === 'competence' ? 'competência' : 'vencimento' }} · benefícios e itens fora do cálculo não entram.</p></div><div class="flex items-center gap-2"><BaseButton variant="ghost" aria-label="Ano anterior" @click="year--">‹</BaseButton><span class="text-sm font-medium tabular-nums">{{ year }}</span><BaseButton variant="ghost" aria-label="Próximo ano" @click="year++">›</BaseButton></div></div></template>
      <UTable :data="yearRows" :columns="planningColumns" :ui="{ th: 'text-xs px-3 py-2', td: 'text-xs px-3 py-2' }">
        <template #label-cell="{ row }"><span class="font-medium text-highlighted">{{ row.original.label }}</span><UBadge v-if="row.original.isCurrentMonth" class="ml-2" size="xs" variant="subtle">Atual</UBadge></template>
        <template #income-cell="{ row }"><span class="text-success tabular-nums">{{ row.original.hasRecords ? fmt(row.original.income) : '—' }}</span></template>
        <template #expense-cell="{ row }"><span class="text-error tabular-nums">{{ row.original.hasRecords ? fmt(row.original.expense) : '—' }}</span></template>
        <template #net-cell="{ row }"><span :class="row.original.net < 0 ? 'text-error' : 'text-success'" class="tabular-nums">{{ row.original.hasRecords ? fmt(row.original.net) : '—' }}</span></template>
        <template #net-footer><span :class="annualKpis.totalNet < 0 ? 'text-error' : 'text-success'">{{ fmt(annualKpis.totalNet) }}</span></template>
        <template #accumulated-cell="{ row }"><span class="tabular-nums" :class="row.original.accumulated < 0 ? 'text-error' : 'text-default'">{{ row.original.hasRecords ? fmt(row.original.accumulated) : '—' }}</span></template>
        <template #status-cell="{ row }"><UBadge v-if="row.original.hasRecords" :color="row.original.net < 0 ? 'error' : 'success'" variant="subtle" size="xs">{{ row.original.net < 0 ? 'Déficit' : 'Superávit' }}</UBadge><span v-else class="text-muted">Sem registros</span></template>
      </UTable>
    </UCard>
    <UAlert color="info" variant="subtle" title="Como a estimativa é calculada" :description="`A média dos ${annualKpis.recordedMonths} meses com registros é aplicada aos meses sem registros. Não cria lançamentos nem prevê o saldo bancário. A tabela mostra somente valores cadastrados.`" />
    <UCard title="Sobra cadastrada acumulada"><BaseEmptyState v-if="!lineData.length" icon="planning" title="Sem dados" body="Não há lançamentos para o ano selecionado." /><BaseLineChart v-else :data="lineData" :height="100" color="var(--primary)" /></UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { buildAnnualPlan, financialToday } from './auxiliaryFinancialViews'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import BaseKpiCard    from '~/components/base/BaseKpiCard.vue'
import BaseLineChart  from '~/components/base/BaseLineChart.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)

const currentMonthKey = financialToday(store.settings.timezone).slice(0, 7)
const year = ref(Number(currentMonthKey.slice(0, 4)))

const annualPlan = computed(() => buildAnnualPlan(store.entries, store.accounts, year.value, store.settings.periodMode, currentMonthKey))
const yearRows = computed(() => annualPlan.value.rows)
const annualKpis = computed(() => annualPlan.value.totals)

const lineData = computed(() =>
  yearRows.value
    .filter(r => r.hasRecords)
    .map(r => r.accumulated)
)

type PlanningRow = ReturnType<typeof buildAnnualPlan>['rows'][number]
const planningColumns = computed<import('@nuxt/ui').TableColumn<PlanningRow>[]>(() => [
  { accessorKey: 'label', header: 'Mês', footer: `Total ${year.value}` },
  { accessorKey: 'income', header: 'Receitas', footer: fmt(annualKpis.value.totalIncome), meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'expense', header: 'Despesas', footer: fmt(annualKpis.value.totalExpense), meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'net', header: 'Sobra prevista', footer: fmt(annualKpis.value.totalNet), meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'accumulated', header: 'Acumulado', meta: { class: { th: 'text-right', td: 'text-right' } } },
  { id: 'status', header: 'Status' },
])

</script>
