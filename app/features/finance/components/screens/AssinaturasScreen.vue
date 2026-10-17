<template>
  <div class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-2"><UCard title="Total mensal"><p class="text-xl font-semibold tabular-nums text-primary">{{ fmt(summary.monthly) }}</p></UCard><UCard title="Projeção anual"><p class="text-xl font-semibold tabular-nums text-highlighted">{{ fmt(summary.annual) }}</p></UCard></div>
    <div class="flex flex-wrap items-center justify-between gap-3"><p class="text-sm text-muted">{{ summary.count }} ativa(s) · Próximos 7 dias: <strong class="text-highlighted">{{ fmt(summary.next7) }}</strong></p><div class="flex flex-wrap gap-2"><BaseInput v-model="search" placeholder="Buscar assinatura..." aria-label="Buscar assinatura" /><BaseButton @click="openModal(null)"><BaseIcon name="plus" :size="16" /> Nova assinatura</BaseButton></div></div>
    <BaseEmptyState v-if="subscriptionRows.length === 0" icon="subscription" title="Nenhuma assinatura" body="Adicione assinaturas e serviços recorrentes para acompanhar seus gastos mensais."><BaseButton @click="openModal(null)">Adicionar assinatura</BaseButton></BaseEmptyState>
    <div v-else class="grid gap-3 md:grid-cols-2"><UCard v-for="row in visibleRows" :key="row.rule.id" :title="row.rule.title" :description="`Próxima cobrança ${row.nextCharge}`"><p class="text-xl font-semibold tabular-nums text-highlighted">{{ fmt(row.rule.amount) }}<span class="ml-2 text-xs font-normal text-muted">{{ fmt(row.rule.amount * 12) }} / ano</span></p><p v-if="row.metaLine" class="mt-2 text-sm text-muted">{{ row.metaLine }}</p><template #footer><div class="flex justify-end gap-2"><BaseButton variant="ghost" :aria-label="`Editar ${row.rule.title}`" @click="openModal(row.rule)"><BaseIcon name="edit" :size="16" /> Editar</BaseButton><BaseButton variant="danger" :aria-label="`Excluir ${row.rule.title}`" @click="deleteRule(row.rule)">Excluir</BaseButton></div></template></UCard></div>
    <BaseModal :open="showModal" :busy="saving" :title="editingRule ? 'Editar assinatura' : 'Nova assinatura'" @close="closeModal"><div class="space-y-4"><BaseInput v-model="form.title" label="Nome do serviço" placeholder="Ex.: Netflix, Spotify…" required /><BaseInput v-model="form.description" label="Descrição (opcional)" /><div class="grid gap-3 sm:grid-cols-2"><BaseInput v-model.number="form.amount" label="Valor (R$)" type="number" inputmode="decimal" min="0" step="0.01" required /><BaseInput v-model.number="form.dueDay" label="Dia de vencimento" type="number" inputmode="numeric" min="1" max="31" placeholder="Ex.: 5" /><BaseDropdown v-model="form.categoryId" label="Categoria"><option value="">Sem categoria</option><option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option></BaseDropdown><BaseDropdown v-model="form.accountId" label="Conta"><option value="">Sem conta</option><option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option></BaseDropdown></div><UAlert v-if="errorMsg" color="error" variant="subtle" :description="errorMsg" /></div><template #footer><div class="flex w-full justify-end gap-2"><BaseButton variant="ghost" :disabled="saving" @click="closeModal">Cancelar</BaseButton><BaseButton :loading="saving" :disabled="!form.title.trim() || form.amount <= 0" @click="saveSubscription">{{ editingRule ? 'Salvar' : 'Criar' }}</BaseButton></div></template></BaseModal>
    <BaseModal :open="deleteConfirm.open" :busy="deleting" title="Excluir assinatura" @close="deleteConfirm.open = false"><UAlert color="warning" variant="subtle" :title="deleteConfirm.title" description="Esta ação remove a regra e todos os lançamentos automáticos futuros associados." /><template #footer><div class="flex w-full justify-end gap-2"><BaseButton variant="ghost" :disabled="deleting" @click="deleteConfirm.open = false">Cancelar</BaseButton><BaseButton variant="danger" :loading="deleting" @click="confirmDelete">Excluir</BaseButton></div></template></BaseModal>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { sumMoney } from '#shared/matrix'
import { financialToday, nextMonthlyDueDate } from './auxiliaryFinancialViews'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { makeId } from '#shared/id'
import type { FinanceRule } from '#shared/types'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseModal      from '~/components/base/BaseModal.vue'
import BaseButton     from '~/components/base/BaseButton.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)

const search = ref('')

const today = financialToday(store.settings.timezone)
const nextChargeLabel = (dueDay: number | null) => {
  const date = nextMonthlyDueDate(dueDay, today)
  return date ? new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : 'não definida'
}

const subscriptionRows = computed(() =>
  store.rules
    .filter(r => r.frequency === 'monthly' && r.kind === 'expense')
    .map(rule => {
      const category    = rule.categoryId ? store.categoryMap.get(rule.categoryId) : undefined
      const catName     = category?.name ?? ''
      const accountName = rule.accountId ? (store.accountMap.get(rule.accountId)?.name ?? '—') : '—'
      return {
        rule,
        catName,
        accountName,
        color:      category?.color || 'var(--primary)',
        nextCharge: nextChargeLabel(rule.dueDay),
        metaLine:   [rule.description, catName, accountName === '—' ? '' : accountName].filter(Boolean).join(' · ')
      }
    })
    .sort((a, b) => b.rule.amount - a.rule.amount)
)

const visibleRows = computed(() => {
  if (!search.value.trim()) return subscriptionRows.value
  const q = search.value.toLowerCase()
  return subscriptionRows.value.filter(r => r.rule.title.toLowerCase().includes(q))
})

const summary = computed(() => {
  const rows    = subscriptionRows.value
  const monthly = sumMoney(rows.map(row => row.rule.amount))
  const end = new Date(`${today}T12:00:00Z`); end.setUTCDate(end.getUTCDate() + 7)
  const next7 = sumMoney(rows.filter(row => {
    const due = nextMonthlyDueDate(row.rule.dueDay, today)
    return due !== null && due <= end.toISOString().slice(0, 10)
  }).map(row => row.rule.amount))
  return { count: rows.length, monthly, annual: sumMoney([monthly * 12]), next7 }
})

// Modal
const showModal   = ref(false)
const editingRule = ref<FinanceRule | null>(null)
const saving      = ref(false)
const errorMsg    = ref('')
const form        = ref({
  title:       '',
  description: '',
  amount:      0,
  dueDay:      null as number | null,
  categoryId:  '',
  accountId:   ''
})

const deleteConfirm = ref({ open: false, title: '', id: '' })
const deleting      = ref(false)

const openModal = (rule: FinanceRule | null) => {
  editingRule.value = rule
  errorMsg.value    = ''
  form.value = {
    title:       rule?.title       ?? '',
    description: rule?.description ?? '',
    amount:      rule?.amount      ?? 0,
    dueDay:      rule?.dueDay      ?? null,
    categoryId:  rule?.categoryId  ?? '',
    accountId:   rule?.accountId   ?? ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value   = false
  editingRule.value = null
  errorMsg.value    = ''
}

const saveSubscription = async () => {
  if (!form.value.title.trim() || !Number.isFinite(Number(form.value.amount)) || form.value.amount <= 0) { errorMsg.value = 'Informe o nome e um valor maior que zero.'; return }
  const rawDueDay = form.value.dueDay as number | string | null
  const dueDay = rawDueDay === null || rawDueDay === '' ? null : Number(rawDueDay)
  if (dueDay !== null && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) { errorMsg.value = 'O vencimento deve ser um dia entre 1 e 31.'; return }
  saving.value   = true
  errorMsg.value = ''
  try {
    const now = new Date().toISOString().slice(0, 10)
    const upsert: Partial<FinanceRule> = {
      id:           editingRule.value?.id ?? makeId('rule'),
      title:        form.value.title.trim(),
      description:  form.value.description.trim(),
      amount:       form.value.amount,
      kind:         'expense',
      frequency:    'monthly',
      autoGenerate: true,
      dueDay,
      categoryId:   form.value.categoryId || null,
      accountId:    form.value.accountId  || null,
      startsAt:     editingRule.value?.startsAt ?? now,
      endsAt:       null
    }
    await store.saveRules([upsert], [])
    await store.rebuildRules()
    closeModal()
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Erro ao salvar assinatura'
  } finally {
    saving.value = false
  }
}

const deleteRule = (rule: FinanceRule) => {
  deleteConfirm.value = { open: true, title: rule.title, id: rule.id }
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await store.saveRules([], [deleteConfirm.value.id])
    await store.rebuildRules()
    deleteConfirm.value.open = false
  } finally {
    deleting.value = false
  }
}
</script>
