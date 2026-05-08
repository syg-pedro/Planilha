<template>
  <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    <article
      v-for="card in cards"
      :key="card.label"
      class="ds-kpi-card"
    >
      <!-- Decorative circle -->
      <div
        class="pointer-events-none absolute"
        style="right: -12px; top: -12px; width: 80px; height: 80px; border-radius: 50%"
        :style="{ background: card.color + '22' }"
      />

      <div class="flex items-start justify-between">
        <!-- Icon badge -->
        <div
          class="flex items-center justify-center rounded-[10px]"
          style="width: 36px; height: 36px"
          :style="{ background: card.color + '20', color: card.color }"
        >
          <svg v-if="card.iconKey === 'income'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          <svg v-else-if="card.iconKey === 'expense'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          <svg v-else-if="card.iconKey === 'balance'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <svg v-else-if="card.iconKey === 'pending'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <svg v-else-if="card.iconKey === 'upcoming'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <svg v-else-if="card.iconKey === 'card'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        </div>

        <!-- Trend badge -->
        <span
          v-if="card.trend !== undefined"
          class="rounded-full px-2 text-[11px] font-bold"
          style="padding-top: 2px; padding-bottom: 2px"
          :style="card.trend >= 0
            ? { background: 'var(--ds-color-state-success-light)', color: 'var(--ds-color-state-success)' }
            : { background: 'var(--ds-color-state-danger-light)', color: 'var(--ds-color-state-danger)' }"
        >
          {{ card.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(card.trend) }}%
        </span>
      </div>

      <div class="mt-2.5">
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style="color: var(--ds-color-text-muted); margin-bottom: 3px"
        >
          {{ card.label }}
        </p>
        <p class="text-[22px] font-extrabold leading-tight" :style="{ color: card.color }">
          {{ card.value }}
        </p>
        <p v-if="card.sub" class="mt-1 text-xs" style="color: var(--ds-color-text-muted)">
          {{ card.sub }}
        </p>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FinanceKpis } from '#shared/types'

const props = defineProps<{ kpis: FinanceKpis }>()
const currency = useCurrency()

const cards = computed(() => [
  {
    iconKey: 'income',
    label: 'Receitas do mes',
    value: currency.format(props.kpis.totalIncome),
    color: 'var(--ds-color-state-success)',
    sub: 'Total de entradas',
    trend: undefined,
  },
  {
    iconKey: 'expense',
    label: 'Despesas do mes',
    value: currency.format(props.kpis.totalExpense),
    color: 'var(--ds-color-state-danger)',
    sub: 'Total de saidas',
    trend: undefined,
  },
  {
    iconKey: 'balance',
    label: 'Saldo liquido',
    value: currency.format(props.kpis.net),
    color: props.kpis.net >= 0 ? 'var(--ds-color-state-success)' : 'var(--ds-color-state-danger)',
    sub: props.kpis.net >= 0 ? 'Positivo este mes' : 'Negativo este mes',
    trend: undefined,
  },
  {
    iconKey: 'pending',
    label: 'Em aberto',
    value: currency.format(props.kpis.pendingAmount),
    color: 'var(--ds-color-state-warning)',
    sub: 'Despesas pendentes',
    trend: undefined,
  },
  {
    iconKey: 'upcoming',
    label: 'Proximos 7 dias',
    value: currency.format(props.kpis.upcoming7Days),
    color: 'var(--ds-color-brand-accent)',
    sub: 'Vencimentos proximos',
    trend: undefined,
  },
  {
    iconKey: 'card',
    label: 'Uso dos cartoes',
    value: `${props.kpis.cardsUsedPercent.toFixed(1)}%`,
    color: props.kpis.cardsUsedPercent > 80
      ? 'var(--ds-color-state-danger)'
      : props.kpis.cardsUsedPercent > 60
        ? 'var(--ds-color-state-warning)'
        : 'var(--ds-color-brand-primary)',
    sub: 'Limite utilizado',
    trend: undefined,
  },
])
</script>
