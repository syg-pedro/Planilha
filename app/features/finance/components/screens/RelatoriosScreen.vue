<template>
<div class="space-y-4">
    <p class="text-xs text-muted">Valores cadastrados por {{ store.settings.periodMode === 'competence' ? 'competência' : 'vencimento' }}. Benefícios e itens fora do cálculo não entram. Sobra prevista não é saldo bancário.</p>
    <UTabs :model-value="period" :items="reportTabs" :content="false" size="sm" aria-label="Período do relatório" @update:model-value="setReportPeriod" />
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4"><BaseKpiCard icon="income" label="Receita total" :value="fmt(kpis.income)" color="var(--success)" /><BaseKpiCard icon="expense" label="Despesa total" :value="fmt(kpis.expense)" color="var(--danger)" /><BaseKpiCard icon="balance" label="Sobra prevista" :value="fmt(kpis.net)" :color="kpis.net < 0 ? 'var(--danger)' : 'var(--success)'" /><BaseKpiCard icon="goal" label="Taxa de poupança" :value="fmtPct(kpis.savingsRate)" :color="savingsColor" /></div>
    <div class="grid gap-4 lg:grid-cols-2">
      <UCard title="Despesas por categoria" :description="periodLabel"><BaseEmptyState v-if="!categoryRows.length" icon="expense" title="Sem despesas" body="Nenhuma despesa no período selecionado." /><div v-else class="space-y-4"><div v-for="row in categoryRows" :key="row.id"><div class="mb-2 flex flex-wrap justify-between gap-2 text-xs"><span class="font-medium text-highlighted">{{ row.name }}</span><span class="tabular-nums text-muted">{{ fmt(row.amount) }} · {{ Math.round(row.pct) }}%</span></div><UProgress :model-value="Math.min(100, row.pct)" :max="100" :color="row.color" size="sm" :aria-label="`Proporção de ${row.name}`" /></div></div></UCard>
      <UCard title="Por pessoa" description="Sobra prevista por titular da conta"><BaseEmptyState v-if="!personRows.length" icon="income" title="Sem dados" body="Nenhum lançamento no período." /><div v-else class="divide-y divide-default"><div v-for="person in personRows" :key="person.name" class="flex justify-between gap-3 py-3 text-sm"><span>{{ person.name }}</span><strong class="tabular-nums" :class="person.net < 0 ? 'text-error' : 'text-success'">{{ fmt(person.net) }}</strong></div></div><template #footer><BaseButton variant="secondary" @click="exportCsv">Exportar CSV</BaseButton></template></UCard>
    </div>
    <UCard title="Comparativo mensal" description="Receitas e despesas cadastradas"><BaseEmptyState v-if="!cashflowChart.length" icon="reports" title="Sem dados" body="Nenhum lançamento no período." /><BaseBarChart v-else :data="cashflowChart" :height="150" :currency="store.settings.currency || 'BRL'" /></UCard>
    <UCard title="Resumo mensal" :description="`${cashflowChart.length} meses`" :ui="{ body: 'p-0 sm:p-0' }"><UTable :data="cashflowTable" :columns="reportColumns" :ui="{ th: 'px-3 py-2 text-xs', td: 'px-3 py-2 text-xs' }"><template #label-cell="{ row }"><span class="font-medium text-highlighted">{{ row.original.label }}</span><UBadge v-if="row.original.isCurrentMonth" class="ml-2" size="md" variant="subtle">Atual</UBadge></template><template #income-cell="{ row }"><span class="text-success tabular-nums">{{ fmt(row.original.income) }}</span></template><template #expense-cell="{ row }"><span class="text-error tabular-nums">{{ fmt(row.original.expense) }}</span></template><template #net-cell="{ row }"><span class="tabular-nums" :class="row.original.net < 0 ? 'text-error' : 'text-success'">{{ fmt(row.original.net) }}</span></template></UTable></UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { buildCashflowSeries, buildCategoryBreakdown, computeKpis } from '#shared/finance'
import { sumMoney } from '#shared/matrix'
import BaseBarChart   from '~/components/base/BaseBarChart.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

import { filterReportEntries, financialToday, type ReportPeriod } from './auxiliaryFinancialViews'

const store  = useFinanceStore()
const currency = useCurrency()
const fmt = (v: number) => currency.format(v)
const fmtPct = (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

const period = ref<ReportPeriod>('month')

const PERIOD_OPTIONS: { id: ReportPeriod; short: string; label: string }[] = [
  { id: 'month',    short: 'Mês',      label: 'Este mês' },
  { id: 'quarter',  short: '3 meses',  label: 'Últimos 3 meses' },
  { id: '6months',  short: '6 meses',  label: 'Últimos 6 meses' },
  { id: 'year',     short: 'Ano',      label: 'Este ano' },
]

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const currentMonthKey = financialToday(store.settings.timezone).slice(0, 7)

const periodLabel = computed(() =>
  PERIOD_OPTIONS.find(o => o.id === period.value)?.label ?? ''
)

const filteredEntries = computed(() => filterReportEntries(store.entries, store.accounts, period.value, store.settings.periodMode, currentMonthKey))

const kpis = computed(() => {
  const values = computeKpis(filteredEntries.value, store.accounts)
  return { income: values.totalIncome, expense: values.totalExpense, net: values.net, savingsRate: values.totalIncome > 0 ? (values.net / values.totalIncome) * 100 : 0 }
})

const savingsColor = computed(() =>
  kpis.value.savingsRate < 0
    ? 'var(--danger)'
    : kpis.value.savingsRate < 10
      ? 'var(--warning)'
      : 'var(--success)'
)

const categoryRows = computed(() => {
  const breakdown = buildCategoryBreakdown(filteredEntries.value)
  const total     = sumMoney(Object.values(breakdown))
  if (total === 0) return []
  return Object.entries(breakdown)
    .map(([catId, amount]) => {
      const cat = store.categoryMap.get(catId)
      return {
        id:     catId,
        name:   cat?.name  ?? 'Sem categoria',
        color:  cat?.color ?? 'var(--primary)',
        amount,
        pct:    (amount / total) * 100
      }
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
})

const cashflowChart = computed(() => {
  const series = buildCashflowSeries(filteredEntries.value, store.settings.periodMode)
  return series.map(s => ({
    month:   MONTH_NAMES[parseInt(s.month.slice(5)) - 1] ?? s.month.slice(5),
    income:  s.income,
    expense: s.expense,
    current: s.month === currentMonthKey
  }))
})

const cashflowTable = computed(() => {
  const series = buildCashflowSeries(filteredEntries.value, store.settings.periodMode)
  return series.map(s => {
    const [y, m] = s.month.split('-')
    return {
      month:          s.month,
      label:          `${MONTH_FULL[parseInt(m!) - 1]} ${y}`,
      income:         s.income,
      expense:        s.expense,
      net:            s.net,
      isCurrentMonth: s.month === currentMonthKey
    }
  }).reverse()
})

const personRows = computed(() => {
  const map = new Map<string, { income: number; expense: number }>()
  for (const entry of filteredEntries.value) {
    const account = entry.accountId ? store.accountMap.get(entry.accountId) : null
    const owner = account?.owner ?? 'Sem titular'
    const cur = map.get(owner) ?? { income: 0, expense: 0 }
    if (entry.kind === 'income') cur.income = sumMoney([cur.income, entry.amount])
    else cur.expense = sumMoney([cur.expense, entry.amount])
    map.set(owner, cur)
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v, net: sumMoney([v.income, -v.expense]) }))
    .sort((a, b) => b.income - a.income)
})

const exportCsv = () => {
  const rows = [['Mês', 'Receitas', 'Despesas', 'Saldo']]
  for (const row of cashflowTable.value) {
    rows.push([row.label, String(row.income.toFixed(2)), String(row.expense.toFixed(2)), String(row.net.toFixed(2))])
  }
  const csv  = rows.map(r => r.join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'relatorio.csv'; a.click()
  URL.revokeObjectURL(url)
}

const reportTabs = PERIOD_OPTIONS.map(option => ({ label: option.short, value: option.id }))
function setReportPeriod(value: string | number) { if (PERIOD_OPTIONS.some(option => option.id === value)) period.value = value as ReportPeriod }
const reportColumns = [
  { accessorKey: 'label', header: 'Mês' },
  { accessorKey: 'income', header: 'Receitas', meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'expense', header: 'Despesas', meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'net', header: 'Sobra prevista', meta: { class: { th: 'text-right', td: 'text-right' } } },
]

</script>
