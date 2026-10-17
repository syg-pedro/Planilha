<template>
  <UCard as="section" :aria-label="label">
    <div class="period-summary">
      <div><span class="text-xs text-muted">Receitas previstas</span><strong class="font-semibold tabular-nums text-highlighted">{{ format(totals.income) }}</strong></div>
      <div><span class="text-xs text-muted">Despesas previstas</span><strong class="font-semibold tabular-nums text-highlighted">{{ format(totals.expense) }}</strong></div>
      <div><span class="text-xs text-muted">Sobra prevista</span><strong class="font-semibold tabular-nums" :class="totals.net < 0 ? 'text-error' : 'text-success'">{{ format(totals.net) }}</strong></div>
      <UCollapsible v-model:open="moreOpen" class="period-summary__more" :class="{ 'period-summary__more--open': moreOpen }">
        <UButton color="neutral" variant="link" size="xs" trailing-icon="i-lucide-chevron-down">Mais totais</UButton>
        <template #content>
          <dl class="mt-3 flex flex-wrap gap-5 text-sm"><div><dt class="text-muted">A pagar</dt><dd class="font-medium">{{ format(totals.pendingExpense) }}</dd></div><div><dt class="text-muted">A receber</dt><dd class="font-medium">{{ format(totals.pendingIncome) }}</dd></div><div><dt class="text-muted">Resultado quitado</dt><dd class="font-medium">{{ format(totals.settledNet) }}</dd></div></dl>
          <p class="mt-3 text-xs text-muted">Sobra prevista considera os lançamentos cadastrados; não é saldo bancário. Benefícios e itens excluídos ficam fora desses totais.</p>
        </template>
      </UCollapsible>
    </div>
  </UCard>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useCurrency } from '../composables/useCurrency'
defineProps<{
  totals: {
    income: number
    expense: number
    net: number
    pendingExpense: number
    pendingIncome: number
    settledNet: number
  }
  label: string
}>()
const { format } = useCurrency()
const moreOpen = ref(false)
</script>
<style scoped>
.period-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; align-items: center; gap: var(--ds-space-5); }
.period-summary > div { display: grid; gap: 4px; }
.period-summary__more--open { grid-column: 1 / -1; }
@media (max-width: 767px) {
  .period-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px 8px; }
  .period-summary strong { font-size: 14px; overflow-wrap: anywhere; }
  .period-summary span { font-size: 10px; }
  .period-summary__more { grid-column: 1 / -1; }
}
</style>
