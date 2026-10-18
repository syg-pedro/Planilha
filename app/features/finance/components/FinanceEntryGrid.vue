<template>
  <UCard class="ledger" :ui="{ body: 'p-0 sm:p-0' }">
    <ul v-if="entries.length" class="ledger__list" aria-label="Lançamentos do período">
      <li
        v-for="entry in sortedEntries"
        :key="entry.id"
        class="ledger__row"
        :class="{ 'ledger__row--saved': highlighted.includes(entry.id) }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          class="ledger__description"
          :aria-label="`Editar ${entry.title}`"
          @click="$emit('edit', entry)"
        >
          <strong>{{ entry.title }}</strong
          ><small
            >{{ formatDate(dateMode === 'competence' ? entry.competenceDate : entry.dueDate) }} ·
            {{ accountName(entry)
            }}<template v-if="entry.installmentTotal">
              · {{ entry.installmentIndex }}/{{ entry.installmentTotal }}</template
            ><template v-if="excluded(entry)"> · fora do saldo</template></small
          >
        </UButton>
        <div class="ledger__amount" :class="{ ledger__income: entry.kind === 'income' }">
          <strong>{{ format(entry.amount) }}</strong
          ><FinanceEntryStatusBadge :entry="entry" />
        </div>
        <UButton
          :color="entry.status === 'paid' ? 'neutral' : 'primary'"
          :variant="entry.status === 'paid' ? 'outline' : 'solid'"
          :icon="entry.status === 'paid' ? 'i-lucide-undo-2' : 'i-lucide-check'"
          class="finance-control ledger__status"
          :disabled="busy"
          :aria-label="`${entry.status === 'paid' ? entry.kind === 'income' ? 'Desfazer recebimento' : 'Desfazer pagamento' : entry.kind === 'income' ? 'Receber' : 'Pagar'}: ${entry.title}`"
          @click="$emit('toggle', entry)"
          >{{
            entry.status === 'paid' ? 'Desfazer' : entry.kind === 'income' ? 'Receber' : 'Pagar'
          }}</UButton
        >
      </li>
    </ul>
    <BaseEmptyState
      v-else
      icon="grid"
      title="Nenhum lançamento encontrado"
      body="Ajuste o período ou os filtros para encontrar seus lançamentos."
    />
    <p class="ledger__count">
      {{ entries.length }} {{ entries.length === 1 ? 'lançamento exibido' : 'lançamentos exibidos' }} · Toque
      na descrição para editar.
    </p>
  </UCard>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { Account, FinanceEntry, PeriodMode } from '#shared/types'
import { sortFinanceListEntries } from '#shared/financeQuery'
import { useCurrency } from '../composables/useCurrency'
import FinanceEntryStatusBadge from './FinanceEntryStatusBadge.vue'
const props = withDefaults(
  defineProps<{
    entries: FinanceEntry[]
    accounts: Account[]
    dateMode: PeriodMode
    busy?: boolean
    highlighted?: string[]
  }>(),
  { busy: false, highlighted: () => [] }
)
defineEmits<{ edit: [entry: FinanceEntry]; toggle: [entry: FinanceEntry] }>()
const { format } = useCurrency()
const { formatDate } = useDateFormat()
const sortedEntries = computed(() => sortFinanceListEntries(props.entries, props.dateMode))
const accountName = (entry: FinanceEntry) =>
  props.accounts.find((account) => account.id === entry.accountId)?.name ?? 'Sem conta'
const excluded = (entry: FinanceEntry) =>
  entry.excludeFromCalc ||
  props.accounts.some((account) => account.id === entry.accountId && account.type === 'benefit')
</script>
<style scoped>
.ledger__list {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
}
.ledger__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px 110px;
  align-items: center;
  gap: 16px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
}
.ledger__row:last-child {
  border-bottom: 0;
}
.ledger__description {
  display: grid;
  gap: 4px;
  min-width: 0;
  background: none;
  border: 0;
  text-align: left;
  font: inherit;
  color: var(--text);
  cursor: pointer;
  padding: 4px 0;
}
.ledger__description strong {
  font-size: 13px;
  overflow-wrap: anywhere;
}
.ledger__description small {
  color: var(--text3);
  font-size: 11px;
}
.ledger__amount {
  display: grid;
  justify-items: end;
  gap: 4px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.ledger__amount strong {
  font-size: 13px;
}
.ledger__income strong {
  color: var(--success);
}
.ledger__status {
  justify-content: center;
}
.ledger__row--saved {
  animation: ds-saved-row 600ms ease-out;
}
.ledger__count {
  font-size: 11px;
  color: var(--text3);
  margin: 8px 14px;
}
@media (max-width: 767px) {
  .ledger__row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    padding: 7px 10px;
  }
  .ledger__description {
    grid-column: 1;
    grid-row: 1 / span 2;
  }
  .ledger__amount {
    grid-column: 2;
    grid-row: 1;
  }
  .ledger__status {
    grid-column: 2;
    grid-row: 2;
    justify-self: end;
    min-width: 104px;
    min-height: 44px;
    padding: 6px 12px;
  }
}
</style>
