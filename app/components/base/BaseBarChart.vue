<template>
  <div :style="{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px`, paddingBottom: '20px', position: 'relative' }">
    <div
      v-for="(d, i) in data"
      :key="i"
      style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px"
    >
      <div :style="{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: `${height - 24}px` }">
        <div
          v-if="d.income !== undefined"
          :style="{
            width: '9px',
            height: `${Math.round((d.income / maxVal) * (height - 24))}px`,
            borderRadius: '3px 3px 0 0',
            background: colorIncome,
            opacity: d.current ? 1 : 0.5,
            transition: 'height 0.5s',
            boxShadow: d.current ? `0 0 6px ${colorIncome}` : 'none',
          }"
          :title="`Receita: ${d.income}`"
        />
        <div
          v-if="d.expense !== undefined"
          :style="{
            width: '9px',
            height: `${Math.round((d.expense / maxVal) * (height - 24))}px`,
            borderRadius: '3px 3px 0 0',
            background: colorExpense,
            opacity: d.current ? 1 : 0.5,
            transition: 'height 0.5s',
            boxShadow: d.current ? `0 0 6px ${colorExpense}` : 'none',
          }"
          :title="`Despesa: ${d.expense}`"
        />
      </div>
      <span
        :style="{
          fontSize: '9px',
          color: d.current ? 'var(--text)' : 'var(--text3)',
          fontWeight: d.current ? 700 : 400,
          whiteSpace: 'nowrap',
          position: 'absolute',
          bottom: 0,
        }"
      >{{ d.month }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface BarDataPoint {
  month: string
  income?: number
  expense?: number
  current?: boolean
}

const props = withDefaults(defineProps<{
  data: BarDataPoint[]
  height?: number
  colorIncome?: string
  colorExpense?: string
}>(), {
  height: 120,
  colorIncome: 'var(--success)',
  colorExpense: 'var(--danger)',
})

const maxVal = computed(() =>
  Math.max(...props.data.map(d => Math.max(d.income ?? 0, d.expense ?? 0)), 1)
)
</script>
