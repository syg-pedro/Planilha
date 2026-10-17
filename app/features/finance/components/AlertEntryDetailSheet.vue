<template>
  <BaseModal :open="open && Boolean(entry)" :title="entry?.title || 'Detalhes do lançamento'" @close="emit('close')"><div v-if="entry" class="space-y-4"><UAlert v-if="alertTitle" :color="alertTone === 'danger' ? 'error' : alertTone || 'warning'" variant="subtle" :title="alertTitle" /><div class="flex flex-wrap items-center justify-between gap-3"><strong class="text-2xl font-semibold tabular-nums" :class="entry.kind === 'income' ? 'text-success' : 'text-error'">{{ entry.kind === 'income' ? '+' : '-' }}{{ currency.format(entry.amount) }}</strong><UBadge :color="entry.status === 'paid' ? 'success' : entry.status === 'review' ? 'error' : 'warning'" variant="subtle">{{ statusLabel }}</UBadge></div><dl class="divide-y divide-default text-sm"><div v-for="field in detailFields" :key="field[0]" class="flex justify-between gap-4 py-3"><dt class="text-muted">{{ field[0] }}</dt><dd class="text-right text-highlighted">{{ field[1] }}</dd></div></dl><UAlert v-if="confirmingDelete" color="warning" variant="subtle" description="Excluir este lançamento definitivamente?" /></div><template #footer><div v-if="entry" class="flex w-full flex-wrap justify-end gap-2"><template v-if="confirmingDelete"><BaseButton variant="secondary" @click="confirmingDelete = false">Cancelar</BaseButton><BaseButton variant="danger" @click="emit('delete', entry.id); confirmingDelete = false">Confirmar exclusão</BaseButton></template><template v-else><BaseButton variant="danger" class="mr-auto" @click="confirmingDelete = true">Excluir</BaseButton><BaseButton variant="secondary" @click="emit('edit', entry)">Editar</BaseButton><BaseButton v-if="entry.status === 'pending' && entry.kind === 'expense'" @click="emit('pay', entry.id)">Marcar como pago</BaseButton></template></div></template></BaseModal>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Account, Category, FinanceEntry } from '#shared/types'

const props = defineProps<{
  open: boolean
  entry: FinanceEntry | null
  accounts: Account[]
  categories: Category[]
  alertTitle?: string
  alertTone?: 'danger' | 'warning' | 'info' | 'success'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'pay' | 'delete', id: string): void
  (e: 'edit', entry: FinanceEntry): void
}>()

const currency = useCurrency()
const { formatDate } = useDateFormat()
const confirmingDelete = ref(false)
const statusLabel = computed(() => props.entry?.status === 'paid' ? (props.entry.kind === 'income' ? 'Recebido' : 'Pago') : props.entry?.status === 'review' ? 'Revisar' : 'Pendente')
const detailFields = computed(() => {
  const entry = props.entry
  if (!entry) return []
  const rows = [['Vencimento', formatDate(entry.dueDate)], ['Competência', formatDate(entry.competenceDate)]]
  const account = props.accounts.find(item => item.id === entry.accountId)
  const category = props.categories.find(item => item.id === entry.categoryId)
  if (account) rows.push(['Conta', account.name])
  if (category) rows.push(['Categoria', category.name])
  if (entry.installmentIndex && entry.installmentTotal) rows.push(['Parcela', `${entry.installmentIndex}/${entry.installmentTotal}`])
  if (entry.description) rows.push(['Observações', entry.description])
  return rows
})
watch(() => [props.open, props.entry?.id], () => { confirmingDelete.value = false })
</script>
