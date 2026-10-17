<template>
  <BaseModal
    :open="open"
    title="Editar conta"
    :subtitle="account?.name || 'Dados da conta e do cartão.'"
    :busy="busy"
    :max-width="520"
    @close="emit('close')"
  >
    <form
      :id="formId"
      ref="form"
      novalidate
      class="ds-form-grid account-editor"
      @submit.prevent="onSave"
    >
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
          v-model="draft.name"
          label="Nome da conta"
          placeholder="Ex.: Nubank, Sicredi…"
          :error="errors.name"
          required
          autofocus
        />
        <div class="ds-form-row">
          <BaseInput
            v-model="draft.owner"
            label="Responsável"
            placeholder="Nome do titular"
            autocomplete="name"
          />
          <BaseDropdown v-model="draft.type" label="Tipo" :disabled="busy"
            ><option value="bank">Conta bancária</option>
            <option value="credit_card">Cartão de crédito</option>
            <option value="benefit">Benefício (VR/VA)</option>
            <option value="external">Externo</option></BaseDropdown
          >
        </div>
        <template v-if="draft.type === 'credit_card'">
          <BaseInput
            v-model="draft.limitTotal"
            label="Limite total (R$)"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            placeholder="Opcional"
            :error="errors.limitTotal"
          />
          <div class="ds-form-row">
            <BaseInput
              v-model.number="draft.closingDay"
              label="Dia de fechamento"
              type="number"
              inputmode="numeric"
              min="1"
              max="31"
              step="1"
              placeholder="Ex.: 25"
              :error="errors.closingDay"
            />
            <BaseInput
              v-model.number="draft.dueDay"
              label="Dia de vencimento"
              type="number"
              inputmode="numeric"
              min="1"
              max="31"
              step="1"
              placeholder="Ex.: 5"
              :error="errors.dueDay"
            />
          </div>
        </template>
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
    <template #footer
      ><div class="ds-form-actions">
        <BaseButton variant="ghost" :disabled="busy" @click="emit('close')"
          >Cancelar</BaseButton
        ><BaseButton
          type="submit"
          :form="formId"
          variant="primary"
          :loading="busy"
          >{{ busy ? 'Salvando…' : 'Salvar' }}</BaseButton
        >
      </div></template
    >
  </BaseModal>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, useId, watch } from 'vue'
import type { Account } from '#shared/types'
import BaseButton from '~/components/base/BaseButton.vue'
import BaseDropdown from '~/components/base/BaseDropdown.vue'
import BaseInput from '~/components/base/BaseInput.vue'
import BaseModal from '~/components/base/BaseModal.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    account: Account | null
    busy?: boolean
    error?: string
  }>(),
  { busy: false, error: '' },
)
const emit = defineEmits<{
  (event: 'close'): void
  (event: 'save', value: Partial<Account>): void
}>()
const formId = `account-${useId()}`
const form = ref<HTMLFormElement | null>(null)
const localError = ref('')
const errors = reactive<Record<string, string>>({})
const draft = reactive({
  id: '',
  name: '',
  owner: '',
  type: 'bank' as Account['type'],
  limitTotal: '' as string | number,
  closingDay: null as number | string | null,
  dueDay: null as number | string | null,
})
watch(
  [() => props.account, () => props.open],
  ([account, open]) => {
    if (!open) return
    for (const key of Object.keys(errors)) Reflect.deleteProperty(errors, key)
    localError.value = ''
    Object.assign(draft, {
      id: account?.id ?? '',
      name: account?.name ?? '',
      owner: account?.owner ?? '',
      type: account?.type ?? 'bank',
      limitTotal: account?.limitTotal ?? '',
      closingDay: account?.closingDay ?? null,
      dueDay: account?.dueDay ?? null,
    })
  },
  { immediate: true },
)
async function onSave() {
  if (props.busy) return
  for (const key of Object.keys(errors)) Reflect.deleteProperty(errors, key)
  localError.value = ''
  if (!draft.id)
    localError.value =
      'Nenhuma conta selecionada. Feche e abra o editor novamente.'
  if (!draft.name.trim()) errors.name = 'Informe o nome da conta.'
  const limitTotal = draft.limitTotal === '' ? null : Number(draft.limitTotal)
  const day = (value: number | string | null) =>
    value == null || value === '' ? null : Number(value)
  const closingDay = day(draft.closingDay)
  const dueDay = day(draft.dueDay)
  if (draft.type === 'credit_card') {
    if (limitTotal != null && (!Number.isFinite(limitTotal) || limitTotal < 0))
      errors.limitTotal = 'Informe um limite igual ou maior que zero.'
    for (const [field, value] of [
      ['closingDay', closingDay],
      ['dueDay', dueDay],
    ] as const) {
      if (
        value != null &&
        (!Number.isInteger(value) || value < 1 || value > 31)
      )
        errors[field] = 'Use um dia entre 1 e 31.'
    }
  }
  if (Object.keys(errors).length || localError.value) {
    await nextTick()
    form.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }
  emit('save', {
    id: draft.id,
    name: draft.name.trim(),
    owner: draft.owner.trim(),
    type: draft.type,
    limitTotal: draft.type === 'credit_card' ? limitTotal : null,
    closingDay: draft.type === 'credit_card' ? closingDay : null,
    dueDay: draft.type === 'credit_card' ? dueDay : null,
  })
}
</script>

<style scoped>
.account-editor fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
@media (max-width: 360px) {
  .account-editor :deep(.ds-form-row) {
    grid-template-columns: 1fr;
  }
}
</style>
