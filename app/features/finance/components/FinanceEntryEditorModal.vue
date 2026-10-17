<template>
  <BaseModal
    :open="open"
    :title="entry && !creating ? 'Editar lançamento' : 'Novo lançamento'"
    :subtitle="
      creating
        ? 'Preencha os dados principais. Os demais são opcionais.'
        : 'Altere os dados deste lançamento.'
    "
    :busy="busy"
    :max-width="560"
    @close="emit('close')"
  >
    <form
      :id="formId"
      ref="form"
      novalidate
      class="ds-form-grid entry-editor"
      @submit.prevent="onSave"
    >
      <slot name="context" />
      <UAlert
        v-if="error || localError"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        color="error"
        :description="error || localError"
      />
      <fieldset class="ds-form-grid" :disabled="busy">
        <BaseInput
          v-model="draft.title"
          label="Descrição"
          placeholder="Ex.: Mercado, Salário…"
          :error="errors.title"
          required
          autocomplete="off"
          autofocus
        />
        <div class="ds-form-row">
          <BaseInput
            v-model="draft.amount"
            label="Valor (R$)"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            placeholder="0,00"
            :error="errors.amount"
            required
          />
          <BaseInput
            v-model="draft.dueDate"
            :label="draft.kind === 'income' ? 'Recebimento' : 'Vencimento'"
            type="date"
            :disabled="busy"
            :error="errors.dueDate"
            required
          />
        </div>
        <div class="ds-form-row">
          <BaseDropdown v-model="draft.kind" label="Tipo" :disabled="busy"
            ><option value="expense">Despesa</option>
            <option value="income">Receita</option></BaseDropdown
          >
          <BaseDropdown v-model="draft.status" label="Status" :disabled="busy"
            ><option value="pending">Pendente</option>
            <option value="paid">
              {{ draft.kind === 'income' ? 'Recebido' : 'Pago' }}
            </option>
            <option value="review">Revisar</option></BaseDropdown
          >
        </div>
        <div class="ds-form-row">
          <BaseDropdown v-model="draft.accountId" label="Conta" :disabled="busy"
            ><option value="">Sem conta</option>
            <option
              v-for="account in accounts"
              :key="account.id"
              :value="account.id"
            >
              {{ account.name }}
            </option></BaseDropdown
          >
          <BaseDropdown
            v-model="draft.categoryId"
            label="Categoria"
            :disabled="busy"
            ><option value="">Sem categoria</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option></BaseDropdown
          >
        </div>
        <UCollapsible
          v-model:open="detailsOpen"
          :disabled="busy"
          class="entry-editor__details"
        >
          <UButton
            color="neutral"
            variant="ghost"
            class="finance-control w-full justify-between"
            >Mais detalhes<template #trailing
              ><BaseIcon
                name="chevron_down"
                :size="16"
                :class="{ 'rotate-180': detailsOpen }" /></template
          ></UButton>
          <template #content>
            <div class="ds-form-grid entry-editor__advanced">
              <BaseInput
                v-model="draft.competenceDate"
                label="Competência"
                type="date"
                :disabled="busy"
                hint="Data usada no planejamento por competência."
                :error="errors.competenceDate"
                @update:model-value="competenceTouched = true"
              />
              <BaseInput
                v-if="allowRecurrence"
                v-model.number="draft.recurrence"
                label="Repetir por quantos meses?"
                type="number"
                inputmode="numeric"
                min="1"
                max="120"
                step="1"
                :hint="
                  Number(draft.recurrence) > 1
                    ? `Cria ${draft.recurrence} lançamentos, um por mês. Os seguintes ficam pendentes.`
                    : '1 = somente este mês.'
                "
                :error="errors.recurrence"
              />
              <div v-if="isInstallment" class="ds-form-row">
                <BaseInput
                  v-model.number="draft.installmentIndex"
                  label="Parcela nº"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  step="1"
                  :error="errors.installmentIndex"
                />
                <BaseInput
                  v-model.number="draft.installmentTotal"
                  label="Total de parcelas"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  step="1"
                  :error="errors.installmentTotal"
                />
              </div>
              <UCheckbox
                v-model="draft.excludeFromCalc"
                label="Excluir dos totais"
                description="Para valores informativos, como benefícios."
                :disabled="busy"
              />
              <BaseTextarea
                v-model="draft.description"
                label="Observações"
                :rows="2"
                placeholder="Informações opcionais…"
              />
            </div>
          </template>
        </UCollapsible>
      </fieldset>
      <UAlert
        v-if="Object.keys(errors).length"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        color="error"
        description="Revise os campos indicados para salvar."
      />
    </form>
    <template #footer>
      <div class="entry-editor__footer">
        <BaseButton
          v-if="entry && !creating"
          variant="danger"
          :disabled="busy"
          @click="onDelete"
          >Excluir</BaseButton
        >
        <span class="entry-editor__spacer" />
        <BaseButton variant="ghost" :disabled="busy" @click="emit('close')"
          >Cancelar</BaseButton
        >
        <BaseButton
          type="submit"
          :form="formId"
          variant="primary"
          :loading="busy"
          >{{ busy ? 'Salvando…' : 'Salvar' }}</BaseButton
        >
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, useId, watch } from 'vue'
import type { Account, Category, FinanceEntry } from '#shared/types'
import BaseButton from '~/components/base/BaseButton.vue'
import BaseDropdown from '~/components/base/BaseDropdown.vue'
import BaseInput from '~/components/base/BaseInput.vue'
import BaseModal from '~/components/base/BaseModal.vue'
import BaseTextarea from '~/components/base/BaseTextarea.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    entry: FinanceEntry | null
    accounts: Account[]
    categories: Category[]
    allowRecurrence?: boolean
    creating?: boolean
    busy?: boolean
    error?: string
  }>(),
  { allowRecurrence: false, creating: false, busy: false, error: '' },
)
const emit = defineEmits<{
  (event: 'close'): void
  (event: 'save', value: Partial<FinanceEntry>[]): void
  (event: 'delete', id: string): void
}>()
const { toIsoDate } = useDateFormat()
const formId = `entry-${useId()}`
const form = ref<HTMLFormElement | null>(null)
const detailsOpen = ref(false)
const competenceTouched = ref(false)
const localError = ref('')
const errors = reactive<Record<string, string>>({})
const draft = reactive({
  id: '',
  title: '',
  description: '',
  amount: '0' as string | number,
  kind: 'expense',
  status: 'pending',
  dueDate: '',
  competenceDate: '',
  accountId: '',
  categoryId: '',
  installmentIndex: null as number | string | null,
  installmentTotal: null as number | string | null,
  excludeFromCalc: false,
  recurrence: 1 as number | string,
})
const isInstallment = computed(
  () => draft.installmentIndex != null || draft.installmentTotal != null,
)
function clearErrors() {
  for (const key of Object.keys(errors)) Reflect.deleteProperty(errors, key)
  localError.value = ''
}
watch(
  [() => props.entry, () => props.open],
  ([entry, open]) => {
    if (!open) return
    clearErrors()
    const today = new Date()
    const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    Object.assign(draft, {
      id: entry?.id ?? (props.creating ? crypto.randomUUID() : ''),
      title: entry?.title ?? '',
      description: entry?.description ?? '',
      amount: String(entry?.amount ?? ''),
      kind: entry?.kind ?? 'expense',
      status: entry?.status ?? 'pending',
      dueDate: entry?.dueDate ?? todayDate,
      competenceDate: entry?.competenceDate ?? entry?.dueDate ?? todayDate,
      accountId: entry?.accountId ?? '',
      categoryId: entry?.categoryId ?? '',
      installmentIndex: entry?.installmentIndex ?? null,
      installmentTotal: entry?.installmentTotal ?? null,
      excludeFromCalc: entry?.excludeFromCalc ?? false,
      recurrence: 1,
    })
    competenceTouched.value = Boolean(
      entry && entry.competenceDate !== entry.dueDate,
    )
    detailsOpen.value = Boolean(
      draft.description ||
      draft.excludeFromCalc ||
      isInstallment.value ||
      draft.competenceDate !== draft.dueDate,
    )
  },
  { immediate: true },
)
watch(
  () => draft.dueDate,
  (date) => {
    if (props.creating && !competenceTouched.value) draft.competenceDate = date
  },
)
// Clamp only the day when copying into shorter months, preserving the original date and values.
function shiftIsoMonths(iso: string, add: number): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  const lastDay = new Date(Date.UTC(year, month + add, 0)).getUTCDate()
  return new Date(Date.UTC(year, month - 1 + add, Math.min(day, lastDay)))
    .toISOString()
    .slice(0, 10)
}
async function showValidation() {
  if (
    errors.competenceDate ||
    errors.recurrence ||
    errors.installmentIndex ||
    errors.installmentTotal
  )
    detailsOpen.value = true
  await nextTick()
  const invalid = form.value?.querySelector<HTMLElement>(
    '[aria-invalid="true"]',
  )
  ;(invalid?.querySelector<HTMLElement>('[role="spinbutton"][contenteditable="true"]') ?? invalid)?.focus()
  invalid?.scrollIntoView({ block: 'nearest' })
}
function onSave() {
  if (props.busy) return
  clearErrors()
  const amount = String(draft.amount).trim() === '' ? NaN : Number(draft.amount)
  const dueDate = toIsoDate(draft.dueDate)
  const competenceDate = toIsoDate(draft.competenceDate)
  const recurrence = props.allowRecurrence ? Number(draft.recurrence) : 1
  if (!draft.title.trim()) errors.title = 'Informe uma descrição.'
  if (!Number.isFinite(amount) || amount < 0)
    errors.amount = 'Informe um valor igual ou maior que zero.'
  if (!dueDate) errors.dueDate = 'Informe uma data válida.'
  if (!competenceDate) errors.competenceDate = 'Informe uma competência válida.'
  if (!Number.isInteger(recurrence) || recurrence < 1 || recurrence > 120)
    errors.recurrence = 'Use um número inteiro entre 1 e 120.'
  const installmentIndex =
    draft.installmentIndex == null || draft.installmentIndex === ''
      ? null
      : Number(draft.installmentIndex)
  const installmentTotal =
    draft.installmentTotal == null || draft.installmentTotal === ''
      ? null
      : Number(draft.installmentTotal)
  if (isInstallment.value) {
    if (
      installmentIndex == null ||
      !Number.isInteger(installmentIndex) ||
      installmentIndex < 1
    )
      errors.installmentIndex = 'Informe o número da parcela.'
    if (
      installmentTotal == null ||
      !Number.isInteger(installmentTotal) ||
      installmentTotal < 1
    )
      errors.installmentTotal = 'Informe o total de parcelas.'
    if (
      installmentIndex != null &&
      installmentTotal != null &&
      installmentIndex > installmentTotal
    )
      errors.installmentIndex = 'A parcela não pode superar o total.'
  }
  if (!draft.id)
    localError.value =
      'Nenhum lançamento selecionado. Feche e abra o editor novamente.'
  if (
    Object.keys(errors).length ||
    localError.value ||
    !dueDate ||
    !competenceDate
  ) {
    void showValidation()
    return
  }
  const shared = {
    title: draft.title.trim(),
    description: draft.description,
    amount,
    kind: draft.kind === 'income' ? ('income' as const) : ('expense' as const),
    accountId: draft.accountId || null,
    categoryId: draft.categoryId || null,
    installmentIndex,
    installmentTotal,
    excludeFromCalc: draft.excludeFromCalc,
  }
  const status: FinanceEntry['status'] =
    draft.status === 'paid' || draft.status === 'review'
      ? draft.status
      : 'pending'
  const entries: Partial<FinanceEntry>[] = [
    { ...shared, id: draft.id, status, dueDate, competenceDate },
  ]
  for (let index = 1; index < recurrence; index++)
    entries.push({
      ...shared,
      id: crypto.randomUUID(),
      status: 'pending',
      dueDate: shiftIsoMonths(dueDate, index),
      competenceDate: shiftIsoMonths(competenceDate, index),
    })
  emit('save', entries)
}
function onDelete() {
  if (props.busy) return
  if (!draft.id) {
    localError.value = 'Nenhum lançamento selecionado para excluir.'
    return
  }
  emit('delete', draft.id)
}
</script>

<style scoped>
.entry-editor fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.entry-editor__details {
  padding-top: var(--ds-space-3);
  border-top: var(--border-width) solid var(--border);
}
.entry-editor__advanced {
  margin-top: var(--ds-space-3);
}
.entry-editor__footer {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
}
.entry-editor__spacer {
  flex: 1;
}
@media (max-width: 360px) {
  .entry-editor :deep(.ds-form-row) {
    grid-template-columns: 1fr;
  }
}
</style>
