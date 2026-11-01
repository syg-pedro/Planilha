<template>
<div class="space-y-4">
    <header><h2 class="text-base font-semibold text-highlighted">Contas e cartões</h2><p class="mt-1 text-xs text-muted">Limites e compromissos estimados pelos lançamentos cadastrados, inclusive parcelas futuras. Não é uma consulta ao banco.</p></header>
    <UCard variant="subtle"><div class="flex flex-wrap items-center justify-between gap-4"><div><p class="text-xs text-muted">Uso total dos cartões</p><p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">{{ fmt(totalPending) }} <span class="text-sm font-normal text-muted">/ {{ fmt(totalLimit) }}</span></p><p class="mt-1 text-xs text-muted">{{ plural(activeAccountCount, 'conta ativa', 'contas ativas') }} · {{ totalUsagePercent.toFixed(0) }}% do limite</p></div><BaseButton @click="openNew"><BaseIcon name="plus" :size="14" /> Nova conta</BaseButton></div><UProgress class="mt-4" :model-value="totalUsagePercent" :max="100" :color="totalUsagePercent >= 90 ? 'error' : 'primary'" size="sm" aria-label="Uso do limite total dos cartões" /></UCard>
    <section v-if="creditCards.length" class="space-y-3"><h3 class="text-sm font-medium text-highlighted">Cartões de crédito</h3><div class="grid gap-3 md:grid-cols-2">
      <UCard v-for="card in creditCards" :key="card.id" class="min-w-0" :title="card.name" :description="card.owner || 'Sem titular'">
        <div class="flex items-center justify-between gap-3"><span class="text-xs text-muted">{{ cardLast4(card) ? `Final ${cardLast4(card)}` : '' }}</span><BaseButton variant="ghost" size="sm" :aria-label="`Editar ${card.name}`" @click="openEdit(card)"><BaseIcon name="edit" :size="15" /> Editar</BaseButton></div>
        <dl class="mt-3 grid grid-cols-2 gap-3 text-xs"><div><dt class="text-muted">Fatura vence</dt><dd class="mt-1 font-medium text-highlighted">{{ card.dueDay ? `Dia ${card.dueDay}` : 'Não cadastrado' }}</dd></div><div class="text-right"><dt class="text-muted">Disponível estimado</dt><dd class="mt-1 text-base font-semibold tabular-nums" :class="available(card) != null && available(card)! < 0 ? 'text-error' : 'text-highlighted'">{{ available(card) == null ? 'Sem limite' : fmt(available(card)!) }}</dd><dd v-if="available(card) != null && available(card)! < 0" class="mt-0.5 font-medium text-error">Acima do limite</dd></div></dl>
        <UProgress class="mt-4" :model-value="Math.min(100, usagePercent(card))" :max="100" :color="usagePercent(card) >= 90 ? 'error' : usagePercent(card) >= 70 ? 'warning' : 'primary'" size="sm" :aria-label="`Uso do limite de ${card.name}`" />
        <template #footer><p class="text-xs text-muted">Comprometido {{ fmt(pendingForCard(card.id)) }} em {{ plural(pendingCountForCard(card.id), 'despesa pendente', 'despesas pendentes') }}<template v-if="card.limitTotal != null"> · Limite {{ fmt(card.limitTotal) }}</template></p></template>
      </UCard>
    </div></section>
    <UCard v-if="bankAccounts.length" title="Outras contas" :ui="{ body: 'p-0 sm:p-0' }"><div v-for="acc in bankAccounts" :key="acc.id" class="flex flex-wrap items-center gap-3 border-b border-default px-4 py-3 last:border-0"><BaseIcon name="budget" :size="20" /><div class="min-w-0 flex-1"><p class="text-sm font-medium text-highlighted">{{ acc.name }}</p><p class="text-xs text-muted">{{ typeLabel(acc.type) }}{{ acc.owner ? ` · ${acc.owner}` : '' }}</p></div><UBadge color="neutral" variant="subtle" size="md">{{ typeLabel(acc.type) }}</UBadge><BaseButton variant="ghost" size="sm" :aria-label="`Editar ${acc.name}`" @click="openEdit(acc)">Editar</BaseButton></div></UCard>
    <BaseEmptyState v-if="!store.accounts.length" icon="card" title="Nenhuma conta cadastrada" body="Adicione um cartão ou conta bancária para começar." />
    <UAlert v-if="saveError" color="error" variant="soft" title="Não foi possível salvar" :description="saveError" />
    <AccountEditorSheet :open="sheetOpen" :account="selectedAccount" :busy="saving" :error="saveError" @close="sheetOpen = false" @save="onSave" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onActivated, onDeactivated } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import AccountEditorSheet from '~/features/finance/components/AccountEditorSheet.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'
import { sumMoney } from '#shared/matrix'
import type { Account } from '#shared/types'

const store = useFinanceStore()
const route = useRoute()
const router = useRouter()
const saveError = ref('')
const saving = ref(false)
const currency = useCurrency()
const fmt = (v: number) => currency.format(v)

// ─── account groups ──────────────────────────────────────────────────────────

// Cartões mais próximos (ou acima) do limite aparecem primeiro.
const creditCards  = computed(() => store.accounts.filter(a => a.type === 'credit_card' && a.active !== false)
  .sort((a, b) => usagePercent(b) - usagePercent(a)))
const bankAccounts = computed(() => store.accounts.filter(a => a.type !== 'credit_card' && a.active !== false))

const activeAccountCount = computed(() => store.accounts.filter(a => a.active !== false).length)

// ─── pending calculations ────────────────────────────────────────────────────

const pendingForCard = (accountId: string) =>
  sumMoney(store.entries.filter(e => e.accountId === accountId && e.kind === 'expense' && e.status !== 'paid').map(e => e.amount))

const pendingCountForCard = (accountId: string) =>
  store.entries.filter(e => e.accountId === accountId && e.kind === 'expense' && e.status !== 'paid').length

const available = (card: Account) => card.limitTotal == null ? null : sumMoney([card.limitTotal, -pendingForCard(card.id)])
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

const usagePercent = (card: Account) =>
  card.limitTotal && card.limitTotal > 0
    ? (pendingForCard(card.id) / card.limitTotal) * 100
    : 0

const totalLimit   = computed(() => sumMoney(creditCards.value.map(card => card.limitTotal ?? 0)))
const totalPending = computed(() => sumMoney(creditCards.value.map(card => pendingForCard(card.id))))

const totalUsagePercent = computed(() =>
  totalLimit.value > 0 ? Math.min(100, (totalPending.value / totalLimit.value) * 100) : 0
)

// ─── card presentation helpers ──────────────────────────────────────────────

/** Extrai os 4 últimos dígitos presentes no nome da conta ("Itaú final 8235"); vazio quando não há. */
const cardLast4 = (card: Account) => {
  const digits = (card.name.match(/\d/g) ?? []).join('')
  return digits.length >= 4 ? digits.slice(-4) : ''
}

// ─── type helpers ────────────────────────────────────────────────────────────

const typeLabel = (type: Account['type']) =>
  ({ bank: 'Banco', credit_card: 'Cartão', benefit: 'Benefício', external: 'Externo' })[type] ?? type

// ─── editor ──────────────────────────────────────────────────────────────────

const sheetOpen      = ref(false)
const selectedAccount = ref<Account | null>(null)

const openEdit = (acc: Account) => {
  selectedAccount.value = { ...acc }
  sheetOpen.value = true
}

const openNew = () => {
  selectedAccount.value = {
    id:          crypto.randomUUID(),
    householdId: store.settings.id,
    name:        '',
    owner:       '',
    type:        'credit_card',
    limitTotal:  null,
    closingDay:  null,
    dueDay:      null,
    active:      true,
  }
  sheetOpen.value = true
}

const onSave = async (account: Partial<Account>) => {
  if (saving.value) return
  saving.value = true
  saveError.value = ''
  try {
    await store.saveAccount(account)
    sheetOpen.value = false
    selectedAccount.value = null
  } catch { saveError.value = 'Não foi possível salvar a conta. Confira os dados e tente novamente.' }
  finally { saving.value = false }
}
let consumingNewQuery = false
const openFromQuery = async () => {
  if (route.path !== '/contas' || route.query.new !== '1' || consumingNewQuery) return
  consumingNewQuery = true
  openNew()
  const query = { ...route.query }; delete query.new
  try { await router.replace({ query }) } finally { consumingNewQuery = false }
}
onMounted(openFromQuery)
onActivated(openFromQuery)
onDeactivated(() => { sheetOpen.value = false })
watch(() => route.fullPath, openFromQuery)
</script>
