<template>
  <UChart
    type="bar"
    :data="data"
    index="month"
    :categories="categories"
    :height="height"
    :format="formatValue"
    :legend="false"
    :y-axis="false"
    :grid="false"
    :ui="{ base: 'transition-none' }"
    aria-label="Receitas e despesas por mês"
  />
</template>
<script setup lang="ts">
import { computed } from 'vue'
interface BarDataPoint {
  month: string
  income?: number
  expense?: number
  current?: boolean
}
const props = withDefaults(
  defineProps<{
    data: BarDataPoint[]
    height?: number
    colorIncome?: string
    colorExpense?: string
    currency?: string
  }>(),
  {
    height: 120,
    colorIncome: 'var(--success)',
    colorExpense: 'var(--danger)',
    currency: 'BRL',
  },
)
const categories = computed(() => [
  { key: 'income' as const, label: 'Receitas', color: props.colorIncome },
  { key: 'expense' as const, label: 'Despesas', color: props.colorExpense },
])
const formatter = computed(
  () =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: props.currency,
    }),
)
const formatValue = (value: number) => formatter.value.format(value)
</script>
