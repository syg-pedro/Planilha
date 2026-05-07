<template>
  <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    <article class="ds-kpi-card">
      <p class="text-xs uppercase ds-text-muted">Receitas</p>
      <p class="mt-1 text-2xl font-semibold" :style="{ color: 'var(--ds-color-state-success)' }">{{ currency.format(kpis.totalIncome) }}</p>
    </article>

    <article class="ds-kpi-card">
      <p class="text-xs uppercase ds-text-muted">Despesas</p>
      <p class="mt-1 text-2xl font-semibold" :style="{ color: 'var(--ds-color-state-danger)' }">{{ currency.format(kpis.totalExpense) }}</p>
    </article>

    <article class="ds-kpi-card">
      <p class="text-xs uppercase ds-text-muted">Saldo</p>
      <p class="mt-1 text-2xl font-semibold" :style="{ color: kpis.net >= 0 ? 'var(--ds-color-state-success)' : 'var(--ds-color-state-danger)' }">
        {{ currency.format(kpis.net) }}
      </p>
    </article>

    <article class="ds-kpi-card">
      <p class="text-xs uppercase ds-text-muted">Pendencias</p>
      <p class="mt-1 text-2xl font-semibold">{{ currency.format(kpis.pendingAmount) }}</p>
    </article>

    <article class="ds-kpi-card">
      <p class="text-xs uppercase ds-text-muted">Proximos 7 dias</p>
      <p class="mt-1 text-2xl font-semibold">{{ currency.format(kpis.upcoming7Days) }}</p>
    </article>

    <article class="ds-kpi-card">
      <p class="text-xs uppercase ds-text-muted">Uso limite cartoes</p>
      <p class="mt-1 text-2xl font-semibold">{{ kpis.cardsUsedPercent.toFixed(1) }}%</p>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { FinanceKpis } from '#shared/types'

defineProps<{ kpis: FinanceKpis }>()
const currency = useCurrency()
</script>
