<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6"
    @click.self="emit('close')"
  >
    <BasePanel class="w-full max-w-2xl" title="Editar lancamento" subtitle="Ajuste os dados e salve para atualizar dashboard, planilha e calendario.">
      <div class="grid gap-3 md:grid-cols-2">
        <BaseInput v-model="draft.title" label="Descricao" placeholder="Ex.: Mercado" />

        <BaseSelect v-model="draft.kind" label="Tipo">
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </BaseSelect>

        <BaseInput v-model="draft.amount" label="Valor" type="number" placeholder="0.00" />

        <BaseSelect v-model="draft.status" label="Status">
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="review">Revisar</option>
        </BaseSelect>

        <BaseInput v-model="draft.dueDate" label="Vencimento" placeholder="dd/MM/yyyy" />
        <BaseInput v-model="draft.competenceDate" label="Competencia" placeholder="dd/MM/yyyy" />

        <BaseSelect v-model="draft.accountId" label="Conta">
          <option value="">Sem conta</option>
          <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
        </BaseSelect>

        <BaseSelect v-model="draft.categoryId" label="Categoria">
          <option value="">Sem categoria</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </BaseSelect>
      </div>

      <BaseTextarea v-model="draft.description" class="mt-3" :rows="3" label="Observacoes" placeholder="Notas opcionais" />

      <div class="mt-4 flex flex-wrap justify-end gap-2">
        <BaseButton variant="ghost" @click="emit('close')">Cancelar</BaseButton>
        <BaseButton v-if="entry" variant="danger" @click="onDelete">Excluir</BaseButton>
        <BaseButton variant="primary" @click="onSave">Salvar</BaseButton>
      </div>
    </BasePanel>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Account, Category, FinanceEntry } from '#shared/types'

const props = defineProps<{
  open: boolean
  entry: FinanceEntry | null
  accounts: Account[]
  categories: Category[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', value: Partial<FinanceEntry>): void
  (e: 'delete', id: string): void
}>()

const { formatDate, toIsoDate } = useDateFormat()

const draft = reactive({
  id: '',
  title: '',
  description: '',
  amount: '0',
  kind: 'expense',
  status: 'pending',
  dueDate: '',
  competenceDate: '',
  accountId: '',
  categoryId: ''
})

watch(
  () => props.entry,
  (entry) => {
    if (!entry) return
    draft.id = entry.id
    draft.title = entry.title
    draft.description = entry.description
    draft.amount = String(entry.amount)
    draft.kind = entry.kind
    draft.status = entry.status
    draft.dueDate = formatDate(entry.dueDate)
    draft.competenceDate = formatDate(entry.competenceDate)
    draft.accountId = entry.accountId ?? ''
    draft.categoryId = entry.categoryId ?? ''
  },
  { immediate: true }
)

const onSave = () => {
  const amount = Number.parseFloat(draft.amount)
  const dueDate = toIsoDate(draft.dueDate)
  const competenceDate = toIsoDate(draft.competenceDate)

  if (!draft.id || Number.isNaN(amount) || !dueDate || !competenceDate) {
    return
  }

  emit('save', {
    id: draft.id,
    title: draft.title.trim() || 'Lancamento',
    description: draft.description,
    amount,
    kind: draft.kind === 'income' ? 'income' : 'expense',
    status: draft.status === 'paid' || draft.status === 'review' ? draft.status : 'pending',
    dueDate,
    competenceDate,
    accountId: draft.accountId || null,
    categoryId: draft.categoryId || null
  })
}

const onDelete = () => {
  if (!draft.id) return
  emit('delete', draft.id)
}
</script>
