<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <BasePanel v-if="isVisible('cashflow')" title="Fluxo de caixa">
      <VChart class="h-64 sm:h-72" :option="cashflowOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('projection')" title="Projecao de saldo (18 meses)">
      <VChart class="h-64 sm:h-72" :option="projectionOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('category')" title="Despesas por categoria">
      <VChart class="h-64 sm:h-72" :option="categoryOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('cards')" title="Despesas por conta/cartao">
      <VChart class="h-64 sm:h-72" :option="cardOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('limits')" title="Utilizacao de limites">
      <VChart class="h-64 sm:h-72" :option="limitOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('heatmap')" title="Heatmap de despesas por dia">
      <VChart class="h-64 sm:h-72" :option="heatmapOption" autoresize />
    </BasePanel>

    <BasePanel v-if="isVisible('upcoming')" title="Proximos vencimentos" class="lg:col-span-2">
      <div class="overflow-x-auto">
        <table class="min-w-[560px] text-xs sm:min-w-full sm:text-sm">
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
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'

const store = useFinanceStore()
const currency = useCurrency()
const { formatDate } = useDateFormat()

const chartTextColor = 'var(--ds-color-text-muted)'
const chartGridLine = 'color-mix(in srgb, var(--ds-color-border-default) 72%, transparent)'
const isMobile = ref(false)
const axisLabelConfig = computed(() => ({
  color: chartTextColor,
  fontSize: isMobile.value ? 10 : 12
}))
const compactGrid = computed(() =>
  isMobile.value
    ? { left: 34, right: 10, top: 42, bottom: 26 }
    : { left: 48, right: 18, top: 42, bottom: 30 }
)

const tooltipTheme = {
  backgroundColor: 'color-mix(in srgb, var(--ds-color-surface-card) 96%, transparent)',
  borderColor: 'var(--ds-color-border-strong)',
  textStyle: { color: 'var(--ds-color-text-primary)' }
}

const palette = computed(() => {
  if (store.settings.themeMode === 'dark') {
    return {
      primary: '#2dd4bf',
      accent: '#f59e0b',
      success: '#22c55e',
      danger: '#f43f5e',
      sequence: ['#2dd4bf', '#60a5fa', '#f59e0b', '#f97316', '#a78bfa', '#22c55e'],
      heatmap: ['#0f172a', '#0ea5e9', '#14b8a6', '#22c55e', '#f59e0b']
    }
  }
  if (store.settings.themeMode === 'eva_01') {
    return {
      primary: '#7c3aed',
      accent: '#7cff2b',
      success: '#44d62c',
      danger: '#ff5a5f',
      sequence: ['#7c3aed', '#7cff2b', '#fde047', '#38bdf8', '#fb7185', '#a78bfa'],
      heatmap: ['#1b1430', '#5b21b6', '#7c3aed', '#7cff2b', '#fde047']
    }
  }
  return {
    primary: '#0f766e',
    accent: '#f59e0b',
    success: '#16a34a',
    danger: '#dc2626',
    sequence: ['#0f766e', '#0ea5e9', '#f59e0b', '#ef4444', '#6366f1', '#16a34a'],
    heatmap: ['#dbeafe', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0f766e']
  }
})

const isVisible = (id: string) => store.settings.dashboardConfig.visibleWidgets.includes(id)

const monthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-')
  if (!year || !month) return monthKey
  return `${month}/${year}`
}

const categoryOption = computed(() => {
  const fallbackPalette = palette.value.sequence
  const data = Object.entries(store.chartData.category).map(([categoryId, total], index) => {
    const category = store.categoryMap.get(categoryId)
    return {
      name: category?.name ?? 'Sem categoria',
      value: total,
      itemStyle: {
        color: category?.color ?? fallbackPalette[index % fallbackPalette.length]
      }
    }
  })

  return {
    color: fallbackPalette,
    tooltip: { ...tooltipTheme, trigger: 'item' },
    legend: { top: 0, textStyle: axisLabelConfig.value },
    series: [
      {
        type: 'pie',
        radius: ['40%', '72%'],
        center: ['50%', '56%'],
        itemStyle: { borderColor: 'var(--ds-color-surface-card)', borderWidth: 2 },
        label: axisLabelConfig.value,
        data
      }
    ]
  }
})

const cashflowOption = computed(() => {
  const data = store.chartData.cashflow
  return {
    tooltip: { ...tooltipTheme, trigger: 'axis' },
    legend: { top: 0, textStyle: axisLabelConfig.value },
    grid: compactGrid.value,
    xAxis: {
      type: 'category',
      data: data.map((item) => monthLabel(item.month)),
      axisLabel: axisLabelConfig.value
    },
    yAxis: {
      type: 'value',
      axisLabel: axisLabelConfig.value,
      splitLine: { lineStyle: { color: chartGridLine } }
    },
    series: [
      {
        name: 'Receitas',
        type: 'bar',
        barMaxWidth: 26,
        data: data.map((item) => item.income),
        itemStyle: { color: palette.value.success }
      },
      {
        name: 'Despesas',
        type: 'bar',
        barMaxWidth: 26,
        data: data.map((item) => item.expense),
        itemStyle: { color: palette.value.danger }
      },
      {
        name: 'Saldo',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: data.map((item) => item.net),
        lineStyle: { width: 3, color: palette.value.primary },
        areaStyle: {
          color: `color-mix(in srgb, ${palette.value.primary} 25%, transparent)`
        },
        itemStyle: { color: palette.value.primary }
      }
    ]
  }
})

const projectionOption = computed(() => {
  const data = store.chartData.projection
  return {
    tooltip: { ...tooltipTheme, trigger: 'axis' },
    grid: isMobile.value ? { left: 34, right: 10, top: 18, bottom: 26 } : { left: 48, right: 18, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map((item) => monthLabel(item.month)),
      axisLabel: axisLabelConfig.value
    },
    yAxis: {
      type: 'value',
      axisLabel: axisLabelConfig.value,
      splitLine: { lineStyle: { color: chartGridLine } }
    },
    series: [
      {
        name: 'Saldo acumulado',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.map((item) => item.balance),
        lineStyle: { width: 3, color: palette.value.primary },
        itemStyle: { color: palette.value.primary },
        areaStyle: {
          color: `color-mix(in srgb, ${palette.value.primary} 20%, transparent)`
        }
      }
    ]
  }
})

const cardOption = computed(() => {
  const rows = Object.entries(store.chartData.cards)
    .map(([id, value]) => ({ label: store.accountMap.get(id)?.name ?? 'Sem conta', value }))
    .sort((a, b) => b.value - a.value)

  return {
    color: palette.value.sequence,
    tooltip: { ...tooltipTheme, trigger: 'axis' },
    grid: isMobile.value ? { left: 78, right: 10, top: 16, bottom: 18 } : { left: 120, right: 24, top: 16, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLabel: axisLabelConfig.value,
      splitLine: { lineStyle: { color: chartGridLine } }
    },
    yAxis: {
      type: 'category',
      data: rows.map((item) => item.label),
      axisLabel: axisLabelConfig.value
    },
    series: [
      {
        type: 'bar',
        data: rows.map((item) => item.value),
        barMaxWidth: 20,
        itemStyle: {
          borderRadius: [0, 8, 8, 0]
        },
        label: {
          show: true,
          position: 'right',
          color: chartTextColor,
          formatter: ({ value }: { value: number }) => currency.format(Number(value || 0))
        }
      }
    ]
  }
})

const limitOption = computed(() => {
  const cardAccounts = store.accounts.filter((account) => account.type === 'credit_card' && (account.limitTotal ?? 0) > 0)
  const labels = cardAccounts.map((account) => account.name)
  const values = cardAccounts.map((account) => {
    const spent = store.filteredEntries
      .filter((entry) => entry.kind === 'expense' && entry.accountId === account.id)
      .reduce((sum, entry) => sum + entry.amount, 0)
    const limit = account.limitTotal ?? 1
    return Number(((spent / limit) * 100).toFixed(1))
  })

  return {
    tooltip: { ...tooltipTheme, trigger: 'axis' },
    grid: isMobile.value ? { left: 36, right: 10, top: 16, bottom: 20 } : { left: 52, right: 20, top: 16, bottom: 24 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: axisLabelConfig.value
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { ...axisLabelConfig.value, formatter: '{value}%' },
      splitLine: { lineStyle: { color: chartGridLine } }
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 22,
        data: values,
        itemStyle: { color: palette.value.accent },
        markLine: {
          symbol: 'none',
          label: { formatter: '80% alerta', ...axisLabelConfig.value },
          lineStyle: { type: 'dashed', color: palette.value.danger },
          data: [{ yAxis: 80 }]
        }
      }
    ]
  }
})

const heatmapOption = computed(() => {
  const groupedMonths = [...new Set(store.chartData.heatmap.map((item) => item.month))]
  const points = store.chartData.heatmap.map((item) => [groupedMonths.indexOf(item.month), item.day - 1, item.value])

  return {
    tooltip: {
      ...tooltipTheme,
      formatter: (params: { data: [number, number, number] }) => {
        const month = monthLabel(groupedMonths[params.data[0]] ?? '')
        return `${month} / dia ${params.data[1] + 1}: R$ ${params.data[2].toFixed(2)}`
      }
    },
    grid: isMobile.value ? { left: 34, right: 8, top: 16, bottom: 54 } : { left: 52, right: 16, top: 16, bottom: 54 },
    xAxis: {
      type: 'category',
      data: groupedMonths.map(monthLabel),
      axisLabel: axisLabelConfig.value
    },
    yAxis: {
      type: 'category',
      data: Array.from({ length: 31 }, (_, i) => String(i + 1)),
      axisLabel: axisLabelConfig.value
    },
    visualMap: {
      min: 0,
      max: Math.max(...store.chartData.heatmap.map((item) => item.value), 100),
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: axisLabelConfig.value,
      inRange: { color: palette.value.heatmap }
    },
    textStyle: axisLabelConfig.value,
    series: [
      {
        type: 'heatmap',
        data: points,
        itemStyle: { borderRadius: 2 },
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

const updateViewport = () => {
  if (!process.client) return
  isMobile.value = window.innerWidth < 640
}

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
})

onBeforeUnmount(() => {
  if (!process.client) return
  window.removeEventListener('resize', updateViewport)
})
</script>
