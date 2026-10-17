<template>
  <div class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><BaseKpiCard icon="debt" label="Saldo devedor total" :value="fmt(summary.totalPending)" color="var(--danger)" :sub="`${debtGroups.length} compromisso(s)`" /><BaseKpiCard icon="calendar" label="Parcelas este mês" :value="fmt(summary.thisMonth)" color="var(--warning)" sub="Vencimento mês atual" /><BaseKpiCard icon="check" label="Parcelas pagas" :value="`${summary.paidCount}/${summary.totalCount}`" color="var(--success)" sub="Total de parcelas" /><BaseKpiCard icon="expense" label="Total parcelado" :value="fmt(summary.totalAmount)" color="var(--primary)" sub="Valor original" /></div>
    <BaseEmptyState v-if="debtGroups.length === 0" icon="debt" title="Nenhuma dívida ou parcela" body="Lançamentos com mais de uma parcela aparecem aqui automaticamente." />
    <div class="space-y-3"><UCard v-for="group in debtGroups" :key="group.key" data-testid="debt-group" :title="group.title" :description="`${group.accountName} · ${group.catName}`"><div class="space-y-3"><div class="flex flex-wrap items-center justify-between gap-3"><p class="text-sm text-muted">Parcela: <strong class="text-highlighted">{{ fmt(group.installmentAmount) }}</strong> · Restante: <strong class="text-error">{{ fmt(group.pendingAmount) }}</strong></p><UBadge :color="group.paidCount === group.totalCount ? 'success' : 'neutral'" variant="subtle">{{ group.paidCount === group.totalCount ? 'Quitado' : `${group.paidCount}/${group.totalCount} pagas` }}</UBadge></div><UProgress :model-value="group.paidCount" :max="group.totalCount" :color="group.paidCount === group.totalCount ? 'success' : 'primary'" aria-label="Parcelas pagas" /><UCollapsible :open="expandedGroups.includes(group.key)" @update:open="toggleGroup(group.key)"><BaseButton variant="ghost" class="w-full justify-between">{{ expandedGroups.includes(group.key) ? 'Recolher parcelas' : 'Ver parcelas' }}<BaseIcon name="chevron_down" :size="16" /></BaseButton><template #content><div class="mt-3 divide-y divide-default"><div v-for="entry in group.entries" :key="entry.id" class="flex flex-wrap items-center gap-3 py-3"><div class="min-w-0 flex-1"><p class="text-sm font-medium text-highlighted">Parcela {{ entry.installmentIndex }}/{{ entry.installmentTotal }}</p><p class="text-xs text-muted">{{ fmtDate(entry.dueDate) }}</p></div><strong class="text-sm tabular-nums" :class="entry.status === 'paid' ? 'text-success' : 'text-error'">{{ fmt(entry.amount) }}</strong><UBadge :color="entry.status === 'paid' ? 'success' : isOverdue(entry.dueDate) ? 'error' : 'warning'" variant="subtle">{{ entry.status === 'paid' ? (entry.kind === 'income' ? 'Recebido' : 'Pago') : isOverdue(entry.dueDate) ? 'Vencida' : 'Pendente' }}</UBadge><div class="flex gap-2" data-testid="debt-installment-actions"><BaseButton v-if="entry.status !== 'paid'" variant="secondary" @click="quickPay(entry.id)">{{ entry.kind === 'income' ? 'Receber' : 'Pagar' }}</BaseButton><BaseButton variant="ghost" @click="openEditor(entry)">Editar</BaseButton></div></div></div></template></UCollapsible></div><template v-if="group.accountId" #footer><BaseButton variant="ghost" @click="openAccountEditor(group.accountId)">Editar conta ou cartão</BaseButton></template></UCard></div>
    <FinanceEntryEditorModal :open="editorOpen" :entry="selectedEntry" :accounts="store.accounts" :categories="store.categories" @close="closeEditor" @save="saveEntry" @delete="deleteEntry" />
    <AccountEditorSheet :open="accountSheetOpen" :account="selectedAccount" @close="accountSheetOpen = false" @save="saveAccount" />
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { sumMoney } from '#shared/matrix'
import { financialToday } from './auxiliaryFinancialViews'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useDateFormat } from '~/composables/useDateFormat'
import BaseKpiCard           from '~/components/base/BaseKpiCard.vue'
import BaseIcon              from '~/components/base/BaseIcon.vue'
import BaseEmptyState        from '~/components/base/BaseEmptyState.vue'
import FinanceEntryEditorModal from '~/features/finance/components/FinanceEntryEditorModal.vue'
import AccountEditorSheet      from '~/features/finance/components/AccountEditorSheet.vue'
import type { Account, FinanceEntry } from '#shared/types'

const store    = useFinanceStore()
const currency = useCurrency()
const { formatDate } = useDateFormat()
const fmt      = (v: number) => currency.format(v)
const fmtDate  = (d: string) => formatDate(d)

// ─── expand/collapse ─────────────────────────────────────────────────────────

const expandedGroups = ref<string[]>([])
const toggleGroup    = (key: string) => {
  const idx = expandedGroups.value.indexOf(key)
  if (idx >= 0) expandedGroups.value.splice(idx, 1)
  else expandedGroups.value.push(key)
}
const isOverdue = (dueDate: string) => dueDate < financialToday(store.settings.timezone)

// ─── entry editor ────────────────────────────────────────────────────────────

const editorOpen    = ref(false)
const selectedEntry = ref<FinanceEntry | null>(null)

const openEditor  = (entry: FinanceEntry) => { selectedEntry.value = { ...entry }; editorOpen.value = true }
const closeEditor = () => { editorOpen.value = false; selectedEntry.value = null }

const saveEntry = async (entries: Partial<FinanceEntry>[]) => {
  await store.saveEntriesBatch({ upserts: entries, deletes: [] })
  closeEditor()
}

const deleteEntry = async (id: string) => {
  await store.saveEntriesBatch({ upserts: [], deletes: [id] })
  closeEditor()
}

const quickPay = async (id: string) => {
  const entry = store.entries.find(e => e.id === id)
  if (!entry) return
  await store.saveEntriesBatch({ upserts: [{ ...entry, status: 'paid' }], deletes: [] })
}

// ─── account editor ──────────────────────────────────────────────────────────

const accountSheetOpen  = ref(false)
const selectedAccount   = ref<Account | null>(null)

const openAccountEditor = (accountId: string) => {
  selectedAccount.value = store.accountMap.get(accountId) ?? null
  if (selectedAccount.value) accountSheetOpen.value = true
}

const saveAccount = async (account: Partial<Account>) => {
  await store.saveAccount(account)
  accountSheetOpen.value = false
  selectedAccount.value  = null
}

// ─── groups ──────────────────────────────────────────────────────────────────

const debtGroups = computed(() => {
  const installmentEntries = store.entries.filter(
    e => e.installmentTotal != null && e.installmentTotal > 1
  )
  const groupMap = new Map<string, typeof installmentEntries>()
  for (const entry of installmentEntries) {
    const key = JSON.stringify([entry.accountId, entry.ruleId ?? entry.title])
    const existing = groupMap.get(key) ?? []
    existing.push(entry)
    groupMap.set(key, existing)
  }

  return [...groupMap.entries()]
    .map(([key, entries]) => {
      const sorted        = [...entries].sort((a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0))
      const first         = sorted[0]!
      const paidCount     = sorted.filter(e => e.status === 'paid').length
      const totalCount    = sorted.length
      const totalAmount   = sumMoney(sorted.map(entry => entry.amount))
      const pendingAmount = sumMoney(sorted.filter(entry => entry.status !== 'paid').map(entry => entry.amount))
      const cat           = first.categoryId ? store.categoryMap.get(first.categoryId) : null
      const acc           = first.accountId  ? store.accountMap.get(first.accountId)  : null
      return {
        key,
        title:         first.title,
        catName:       cat?.name  ?? '—',
        accountName:   acc?.name  ?? '—',
        accountId:     first.accountId ?? null,
        entries:       sorted,
        paidCount,
        totalCount,
        totalAmount,
        pendingAmount,
        installmentAmount: totalCount > 0 ? totalAmount / totalCount : 0
      }
    })
    .filter(g => g.pendingAmount > 0 || g.paidCount < g.totalCount)
    .sort((a, b) => b.pendingAmount - a.pendingAmount)
})

const summary = computed(() => {
  const currentMonth = financialToday(store.settings.timezone).slice(0, 7)
  const allGroups    = debtGroups.value
  return {
    totalPending:  sumMoney(allGroups.map(group => group.pendingAmount)),
    totalAmount:   sumMoney(allGroups.map(group => group.totalAmount)),
    paidCount:     allGroups.reduce((s, g) => s + g.paidCount, 0),
    totalCount:    allGroups.reduce((s, g) => s + g.totalCount, 0),
    thisMonth:     sumMoney(allGroups.flatMap(group => group.entries).filter(entry => entry.status !== 'paid' && entry.dueDate.startsWith(currentMonth)).map(entry => entry.amount))
  }
})
</script>
