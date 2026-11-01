<template>
  <UCard as="section" :aria-label="label" :ui="{ body: 'p-3 sm:p-4' }">
    <div class="period-summary">
      <UCard
        role="group"
        aria-label="Falta pagar"
        class="period-summary__pending"
        :class="totals.pendingExpense > 0 ? 'bg-warning/10 ring-warning/30' : 'bg-success/10 ring-success/30'"
        :ui="{ body: 'p-3 sm:p-3' }"
      >
        <div class="flex items-center gap-2 text-sm font-semibold text-highlighted">
          <BaseIcon
            :name="totals.pendingExpense > 0 ? 'clock' : 'check'"
            :size="18"
            :color="totals.pendingExpense > 0 ? 'var(--ui-warning)' : 'var(--ui-success)'"
            aria-hidden="true"
          />
          Falta pagar
        </div>
        <strong
          role="status"
          aria-label="Valor que falta pagar"
          aria-live="polite"
          aria-atomic="true"
          class="period-summary__pending-value tabular-nums text-highlighted"
        >{{ format(totals.pendingExpense) }}</strong>
        <p class="text-xs text-muted">
          {{ totals.pendingExpense > 0 ? 'Despesas ainda não pagas' : 'Nenhuma despesa pendente' }}{{ period ? ` em ${period}` : '' }}.
        </p>
      </UCard>
      <dl class="period-summary__metrics">
        <div>
          <dt class="text-xs text-muted">Receitas previstas</dt>
          <dd class="font-semibold tabular-nums text-highlighted">{{ format(totals.income) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">Despesas previstas</dt>
          <dd class="font-semibold tabular-nums text-highlighted">{{ format(totals.expense) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">Sobra prevista{{ period ? ` · ${period}` : '' }}</dt>
          <dd class="font-semibold tabular-nums" :class="totals.net < 0 ? 'text-error' : 'text-success'">{{ format(totals.net) }}</dd>
        </div>
      </dl>
      <UCollapsible v-model:open="moreOpen" class="period-summary__more" :class="{ 'period-summary__more--open': moreOpen }">
        <UButton color="neutral" variant="link" size="xs" trailing-icon="i-lucide-chevron-down">Mais totais</UButton>
        <template #content>
          <dl class="mt-3 flex flex-wrap gap-5 text-sm"><div><dt class="text-muted">A receber</dt><dd class="font-medium">{{ format(totals.pendingIncome) }}</dd></div><div><dt class="text-muted">Resultado quitado</dt><dd class="font-medium">{{ format(totals.settledNet) }}</dd></div></dl>
          <p class="mt-3 text-xs text-muted">Falta pagar é o total de despesas do período menos os valores já pagos.</p>
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
  /** Período coberto pelos totais, para não confundir com o total de outras telas. */
  period?: string
}>()
const { format } = useCurrency()
const moreOpen = ref(false)
</script>
<style scoped>
.period-summary { display: grid; grid-template-columns: minmax(200px, 1fr) minmax(0, 2.5fr) auto; align-items: center; gap: var(--ds-space-6); }
.period-summary__pending { min-width: 0; }
.period-summary__pending-value { display: block; margin-block: var(--ds-space-2); font-size: clamp(24px, 2.2vw, 30px); line-height: 1.15; font-weight: 700; overflow-wrap: anywhere; }
.period-summary__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ds-space-5); }
.period-summary__metrics > div { display: grid; min-width: 0; gap: var(--ds-space-1); }
.period-summary__metrics dd { overflow-wrap: anywhere; }
.period-summary__more { justify-self: end; }
.period-summary__more--open { grid-column: 1 / -1; justify-self: stretch; }
@media (min-width: 768px) and (max-width: 1100px) {
  .period-summary { grid-template-columns: minmax(180px, 1fr) minmax(0, 2fr); }
  .period-summary__more { grid-column: 1 / -1; }
}
@media (max-width: 767px) {
  .period-summary { grid-template-columns: minmax(0, 1fr); gap: var(--ds-space-5); }
  .period-summary__pending-value { font-size: 28px; }
  .period-summary__metrics { gap: var(--ds-space-3); }
  .period-summary__metrics dd { font-size: 14px; }
  .period-summary__metrics dt { font-size: 11px; }
  .period-summary__more { grid-column: 1 / -1; }
}
</style>
