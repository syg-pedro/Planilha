<template>
  <div class="space-y-4">
    <UCard><div class="flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-3"><BaseButton variant="ghost" aria-label="Mês anterior" @click="prev">‹</BaseButton><h2 class="text-base font-semibold text-highlighted">{{ MONTHS[viewMonth] }} {{ viewYear }}</h2><BaseButton variant="ghost" aria-label="Próximo mês" @click="next">›</BaseButton></div><div class="flex flex-wrap gap-3 text-sm tabular-nums"><span class="text-success">↑ {{ fmt(monthIncome) }}</span><span class="text-error">↓ {{ fmt(monthExpense) }}</span><strong :class="monthIncome - monthExpense >= 0 ? 'text-success' : 'text-error'">= {{ fmt(monthIncome - monthExpense) }}</strong></div></div></UCard>
    <UCard :ui="{ body: 'p-0 sm:p-0' }"><div class="grid grid-cols-7"><div v-for="day in DAYS_SHORT" :key="day" class="border-b border-default p-2 text-center text-xs font-medium text-muted">{{ day }}</div><div v-for="i in firstDayOfMonth" :key="`empty-${i}`" class="min-h-20 border-b border-r border-default bg-muted/30 sm:min-h-28" /><div v-for="day in daysInMonth" :key="day" class="min-h-20 border-b border-r border-default p-1 sm:min-h-28" :class="selectedDay === day ? 'bg-primary/10' : isToday(day) ? 'bg-elevated' : ''"><div class="flex items-center justify-between gap-1"><BaseButton :variant="isToday(day) ? 'primary' : 'ghost'" :aria-label="`${day} de ${MONTHS[viewMonth]}, ${entriesForDay(day).length} lançamento(s)`" :aria-pressed="selectedDay === day" @click="selectedDay = selectedDay === day ? null : day">{{ day }}</BaseButton><span v-if="hasPending(day) || hasPaid(day)" class="size-1.5 shrink-0 rounded-full" :class="hasPending(day) ? 'bg-error' : 'bg-success'" /></div><div class="hidden space-y-1 pt-1 sm:block"><UButton v-for="entry in entriesForDay(day).slice(0, 3)" :key="entry.id" :color="entry.status === 'paid' ? 'success' : 'error'" variant="soft" size="xs" :title="entry.title" class="w-full justify-start truncate" @click="modalEntry = entry">{{ entry.title }}</UButton></div><p v-if="entriesForDay(day).length" class="pt-1 text-center text-[10px] text-muted sm:hidden">{{ entriesForDay(day).length }} item(s)</p><BaseButton v-if="entriesForDay(day).length > 3" variant="ghost" class="hidden sm:inline-flex" @click="selectedDay = day">+{{ entriesForDay(day).length - 3 }}</BaseButton></div></div></UCard>
    <UCard v-if="selectedDay != null" :title="`Lançamentos de ${selectedDay} de ${MONTHS[viewMonth]}`"><div class="divide-y divide-default"><BaseButton v-for="entry in entriesForDay(selectedDay)" :key="entry.id" variant="ghost" class="flex w-full justify-between py-3 text-left" @click="modalEntry = entry"><span class="truncate">{{ entry.title }}</span><strong class="shrink-0 tabular-nums" :class="entry.kind === 'income' ? 'text-success' : 'text-error'">{{ fmt(entry.amount) }}</strong></BaseButton><p v-if="!entriesForDay(selectedDay).length" class="text-sm text-muted">Nenhum lançamento neste dia.</p></div></UCard>
    <BaseModal :open="Boolean(modalEntry)" title="Detalhes do lançamento" @close="modalEntry = null"><dl class="divide-y divide-default text-sm"><div v-for="[label, value] in modalFields" :key="label" class="flex justify-between gap-4 py-3"><dt class="text-muted">{{ label }}</dt><dd class="text-right text-highlighted"><FinanceEntryStatusBadge v-if="label === 'Status' && modalEntry" :entry="modalEntry" /><template v-else>{{ value }}</template></dd></div></dl><template #footer><BaseButton variant="secondary" @click="modalEntry = null">Fechar</BaseButton></template></BaseModal>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import type { FinanceEntry } from '#shared/types'
import FinanceEntryStatusBadge from './FinanceEntryStatusBadge.vue'

const store = useFinanceStore()
const currency = useCurrency()
const fmt = (v: number) => currency.format(v)

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())
const selectedDay = ref<number | null>(null)
const modalEntry = ref<FinanceEntry | null>(null)

const daysInMonth = computed(() => new Date(viewYear.value, viewMonth.value + 1, 0).getDate())
const firstDayOfMonth = computed(() => new Date(viewYear.value, viewMonth.value, 1).getDay())

const prev = () => {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
  selectedDay.value = null
}
const next = () => {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
  selectedDay.value = null
}

const isToday = (day: number) =>
  day === today.getDate() && viewMonth.value === today.getMonth() && viewYear.value === today.getFullYear()

const entriesForDay = (day: number) => {
  const ds = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return store.entries.filter(e => e.dueDate === ds)
}

const hasPending = (day: number) => entriesForDay(day).some(e => e.status !== 'paid')
const hasPaid = (day: number) => entriesForDay(day).some(e => e.status === 'paid')

const monthEntries = computed(() => store.entries.filter(e => {
  const d = new Date(e.dueDate + 'T00:00:00')
  return d.getMonth() === viewMonth.value && d.getFullYear() === viewYear.value
}))
const monthIncome = computed(() => monthEntries.value.filter(e => e.kind === 'income').reduce((s, e) => s + e.amount, 0))
const monthExpense = computed(() => monthEntries.value.filter(e => e.kind === 'expense').reduce((s, e) => s + e.amount, 0))

const modalFields = computed(() => {
  if (!modalEntry.value) return [] as [string, string][]
  const e = modalEntry.value
  const acc = store.accountMap.get(e.accountId ?? '')
  const [y, m, d] = e.dueDate.split('-')
  return [
    ['Descrição', e.title],
    ['Vencimento', `${d}/${m}/${y}`],
    ['Valor', fmt(e.amount)],
    ['Status', ({ paid: 'Pago', pending: 'Pendente', review: 'Revisar' } as Record<string, string>)[e.status] || e.status],
    ['Tipo', e.kind === 'income' ? 'Receita' : 'Despesa'],
    ['Conta', acc?.name || '—']
  ] as [string, string][]
})
</script>
