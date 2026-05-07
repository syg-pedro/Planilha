<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <BasePanel v-if="isVisible('cashflow')" title="Fluxo de caixa">
      <VChart class="h-72" :option="cashflowOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('projection')" title="Projecao de saldo (18 meses)">
      <VChart class="h-72" :option="projectionOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('category')" title="Despesas por categoria">
      <VChart class="h-72" :option="categoryOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('cards')" title="Despesas por conta/cartao">
      <VChart class="h-72" :option="cardOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('limits')" title="Utilizacao de limites">
      <VChart class="h-72" :option="limitOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('heatmap')" title="Heatmap de despesas por dia">
      <VChart class="h-72" :option="heatmapOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('upcoming')" title="Proximos vencimentos" class="lg:col-span-2">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase tracking-wide ds-text-muted">
              <th class="py-2">Data</th>
              <th class="py-2">Titulo</th>
              <th class="py-2">Conta</th>
              <th class="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in upcomingEntries"
              :key="item.id"
              class="border-t"
              :style="{ borderColor: 'var(--ds-color-border-default)' }"
            >
              <td class="py-2">{{ formatDate(item.dueDate) }}</td>
              <td class="py-2">{{ item.title }}</td>
              <td class="py-2">{{ accountLabel(item.accountId) }}</td>
              <td class="py-2 text-right font-medium">{{ currency.format(item.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BasePanel>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'

const store = useFinanceStore()
const currency = useCurrency()
const { formatDate } = useDateFormat()
const chartTextColor = 'var(--ds-color-text-muted)'
const chartGridLine = 'color-mix(in srgb, var(--ds-color-border-default) 72%, transparent)'
const tooltipTheme = {
  backgroundColor: 'color-mix(in srgb, var(--ds-color-surface-card) 96%, transparent)',
  borderColor: 'var(--ds-color-border-strong)',
  textStyle: { color: 'var(--ds-color-text-primary)' }
}

const heatmapColors = computed(() => {
  if (store.settings.themeMode === 'dark') {
    return ['#0f172a', '#14b8a6', '#22c55e', '#f59e0b']
  }
  if (store.settings.themeMode === 'eva_01') {
    return ['#1b1430', '#6f3cc3', '#7cff2b', '#fde047']
  }
  return ['#dbeafe', '#60a5fa', '#0ea5e9', '#0f766e']
})

const isVisible = (id: string) => store.settings.dashboardConfig.visibleWidgets.includes(id)

const categoryOption = computed(() => {
  const data = Object.entries(store.chartData.category).map(([categoryId, total]) => ({
    name: store.categoryMap.get(categoryId)?.name ?? 'Sem categoria',
    value: total
  }))

  return {
    tooltip: { ...tooltipTheme, trigger: 'item' },
    legend: { top: 0, textStyle: { color: chartTextColor } },
    series: [
      {
        type: 'pie',
        radius: ['42%', '70%'],
        data
      }
    ]
  }
})

const cashflowOption = computed(() => {
  const data = store.chartData.cashflow
  return {
    tooltip: { ...tooltipTheme, trigger: 'axis' },
    legend: { top: 0, textStyle: { color: chartTextColor } },
    xAxis: { type: 'category', data: data.map((item) => item.month), axisLabel: { color: chartTextColor } },
    yAxis: { type: 'value', axisLabel: { color: chartTextColor }, splitLine: { lineStyle: { color: chartGridLine } } },
    series: [
      { name: 'Receitas', type: 'bar', data: data.map((item) => item.income), itemStyle: { color: 'var(--ds-color-state-success)' } },
      { name: 'Despesas', type: 'bar', data: data.map((item) => item.expense), itemStyle: { color: 'var(--ds-color-state-danger)' } },
      { name: 'Saldo', type: 'line', smooth: true, data: data.map((item) => item.net), itemStyle: { color: 'var(--ds-color-brand-primary)' } }
    ]
  }
})

const projectionOption = computed(() => {
  const data = store.chartData.projection
  return {
    tooltip: { ...tooltipTheme, trigger: 'axis' },
    xAxis: { type: 'category', data: data.map((item) => item.month), axisLabel: { color: chartTextColor } },
    yAxis: { type: 'value', axisLabel: { color: chartTextColor }, splitLine: { lineStyle: { color: chartGridLine } } },
    series: [
      {
        type: 'line',
        smooth: true,
        areaStyle: {},
        data: data.map((item) => item.balance),
        itemStyle: { color: 'var(--ds-color-brand-primary)' }
      }
    ]
  }
})

const cardOption = computed(() => {
  const breakdown = store.chartData.cards
  const labels = Object.keys(breakdown).map((id) => store.accountMap.get(id)?.name ?? 'Sem conta')
  return {
    tooltip: { ...tooltipTheme, trigger: 'axis' },
    xAxis: { type: 'category', data: labels, axisLabel: { color: chartTextColor } },
    yAxis: { type: 'value', axisLabel: { color: chartTextColor }, splitLine: { lineStyle: { color: chartGridLine } } },
    series: [
      {
        type: 'bar',
        data: Object.values(breakdown),
        itemStyle: { color: 'var(--ds-color-brand-accent)' }
      }
    ]
  }
})

const limitOption = computed(() => ({
  series: [
    {
      type: 'gauge',
      progress: { show: true, width: 16 },
      axisLine: { lineStyle: { width: 16 } },
      detail: { valueAnimation: true, formatter: '{value}%' },
      data: [{ value: Number(store.kpis.cardsUsedPercent.toFixed(1)), name: 'Uso de limite' }]
    }
  ]
}))

const heatmapOption = computed(() => {
  const groupedMonths = [...new Set(store.chartData.heatmap.map((item) => item.month))]
  const points = store.chartData.heatmap.map((item) => [groupedMonths.indexOf(item.month), item.day - 1, item.value])

  return {
    tooltip: {
      ...tooltipTheme,
      formatter: (params: { data: [number, number, number] }) => {
        const month = groupedMonths[params.data[0]]
        return `${month} / dia ${params.data[1] + 1}: R$ ${params.data[2].toFixed(2)}`
      }
    },
    xAxis: { type: 'category', data: groupedMonths, axisLabel: { color: chartTextColor } },
    yAxis: { type: 'category', data: Array.from({ length: 31 }, (_, i) => String(i + 1)), axisLabel: { color: chartTextColor } },
    visualMap: {
      min: 0,
      max: Math.max(...store.chartData.heatmap.map((item) => item.value), 100),
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: chartTextColor },
      inRange: { color: heatmapColors.value }
    },
    textStyle: { color: chartTextColor },
    series: [
      {
        type: 'heatmap',
        data: points,
        emphasis: {
          itemStyle: {
            borderColor: '#334155',
            borderWidth: 1
          }
        }
      }
    ]
  }
})

const upcomingEntries = computed(() =>
  [...store.filteredEntries]
    .filter((entry) => entry.kind === 'expense' && entry.status !== 'paid')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 12)
)

const accountLabel = (accountId: string | null) => {
  if (!accountId) return 'Sem conta'
  return store.accountMap.get(accountId)?.name ?? 'Sem conta'
}
</script>
