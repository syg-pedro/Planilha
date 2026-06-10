<template>
  <div :style="{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px`, paddingBottom: '20px', position: 'relative' }">
    <div
      v-for="(d, i) in data"
      :key="i"
      style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; position: relative; cursor: default"
      @mouseenter="activeIndex = i"
      @mouseleave="activeIndex = null"
    >
      <div :style="{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: `${height - 24}px` }">
        <div
          v-if="d.income !== undefined"
          :style="{
            width: '9px',
            height: `${Math.round((d.income / maxVal) * (height - 24))}px`,
            borderRadius: '3px 3px 0 0',
            background: colorIncome,
            opacity: activeIndex === i || (activeIndex === null && d.current) ? 1 : 0.5,
            transition: 'height 0.5s, opacity 0.2s',
            boxShadow: d.current ? `0 0 6px ${colorIncome}` : 'none',
          }"
        />
        <div
          v-if="d.expense !== undefined"
          :style="{
            width: '9px',
            height: `${Math.round((d.expense / maxVal) * (height - 24))}px`,
            borderRadius: '3px 3px 0 0',
            background: colorExpense,
            opacity: activeIndex === i || (activeIndex === null && d.current) ? 1 : 0.5,
            transition: 'height 0.5s, opacity 0.2s',
            boxShadow: d.current ? `0 0 6px ${colorExpense}` : 'none',
          }"
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

      <Transition name="bar-tooltip">
        <div v-if="activeIndex === i" class="bar-tooltip">
          <div class="bar-tooltip__title">{{ d.month }}</div>
          <div class="bar-tooltip__row">
            <span class="bar-tooltip__dot" :style="{ background: colorIncome }" />
            <span class="bar-tooltip__label">Receita</span>
            <span class="bar-tooltip__value" :style="{ color: colorIncome }">{{ formatValue(d.income ?? 0) }}</span>
          </div>
          <div class="bar-tooltip__row">
            <span class="bar-tooltip__dot" :style="{ background: colorExpense }" />
            <span class="bar-tooltip__label">Despesa</span>
            <span class="bar-tooltip__value" :style="{ color: colorExpense }">{{ formatValue(d.expense ?? 0) }}</span>
          </div>
          <div class="bar-tooltip__divider" />
          <div class="bar-tooltip__row">
            <span class="bar-tooltip__dot" :style="{ background: result(d) >= 0 ? colorIncome : colorExpense }" />
            <span class="bar-tooltip__label">Resultado</span>
            <span class="bar-tooltip__value" :style="{ color: result(d) >= 0 ? colorIncome : colorExpense }">{{ formatValue(result(d)) }}</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

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
  currency?: string
}>(), {
  height: 120,
  colorIncome: 'var(--success)',
  colorExpense: 'var(--danger)',
  currency: 'BRL',
})

const activeIndex = ref<number | null>(null)

const maxVal = computed(() =>
  Math.max(...props.data.map(d => Math.max(d.income ?? 0, d.expense ?? 0)), 1)
)

const formatter = computed(() =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: props.currency })
)

function formatValue(value: number) {
  return formatter.value.format(value)
}

function result(d: BarDataPoint) {
  return (d.income ?? 0) - (d.expense ?? 0)
}
</script>

<style scoped>
.bar-tooltip {
  position: absolute;
  bottom: calc(100% - 16px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  min-width: 150px;
  padding: 10px 12px;
  background: var(--panel2, var(--panel));
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  backdrop-filter: blur(4px);
}

.bar-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--border);
}

.bar-tooltip__title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 7px;
  text-transform: capitalize;
}

.bar-tooltip__row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.bar-tooltip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bar-tooltip__label {
  font-size: 11px;
  color: var(--text3);
}

.bar-tooltip__value {
  font-size: 11px;
  font-weight: 700;
  margin-left: auto;
  white-space: nowrap;
}

.bar-tooltip__divider {
  height: 1px;
  background: var(--border);
  margin: 7px 0 1px;
}

.bar-tooltip-enter-active,
.bar-tooltip-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.bar-tooltip-enter-from,
.bar-tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
