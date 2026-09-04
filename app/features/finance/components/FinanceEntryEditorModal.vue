<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="open"
        class="sheet-overlay"
        @click.self="requestClose"
      >
        <div ref="dialogRef" class="sheet-container" role="dialog" aria-modal="true" :aria-label="isNew ? 'Novo lançamento' : 'Editar lançamento'">
          <!-- Handle -->
          <div class="sheet-handle-area" aria-hidden="true">
            <div class="sheet-handle" />
          </div>

          <!-- Header -->
          <div class="sheet-header">
            <div>
              <h2 class="sheet-title">{{ isNew ? 'Novo lançamento' : 'Editar lançamento' }}</h2>
              <p class="sheet-subtitle">{{ draft.title || 'Preencha os dados abaixo' }}</p>
            </div>
            <button aria-label="Fechar editor" class="sheet-close" @click="requestClose">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Body (scrollable) -->
          <div class="sheet-body">

            <!-- Descrição -->
            <div class="field-group">
              <label class="field-label" :for="`${fieldId}-title`">Descrição</label>
              <input
                :id="`${fieldId}-title`" v-model="draft.title" :aria-invalid="!!errors.title" :aria-describedby="errors.title ? `${fieldId}-title-error` : undefined"
                type="text"
                class="field-input"
                placeholder="Ex.: Mercado, Salário..."
              />
            </div>

            <!-- Valor destacado -->
            <div class="field-group">
              <label class="field-label" :for="`${fieldId}-amount`">Valor (R$)</label>
              <div class="amount-wrapper">
                <span class="amount-prefix">R$</span>
                <input
                  :id="`${fieldId}-amount`" v-model="draft.amount" :aria-invalid="!!errors.amount" :aria-describedby="errors.amount ? `${fieldId}-amount-error` : undefined"
                  type="text"
                  inputmode="decimal"
                  class="field-input amount-input"
                  placeholder="0,00"
                />
              </div>
            </div>

            <!-- Tipo + Status -->
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Tipo</label>
                <div class="segmented">
                  <button
                    type="button"
                    class="seg-btn"
                    :class="{ 'seg-active-expense': draft.kind === 'expense' }" :aria-pressed="draft.kind === 'expense'"
                    @click="draft.kind = 'expense'"
                  >
                    <span>↓</span> Despesa
                  </button>
                  <button
                    type="button"
                    class="seg-btn"
                    :class="{ 'seg-active-income': draft.kind === 'income' }" :aria-pressed="draft.kind === 'income'"
                    @click="draft.kind = 'income'"
                  >
                    <span>↑</span> Receita
                  </button>
                </div>
              </div>
              <div class="field-group">
                <label class="field-label" :for="`${fieldId}-status`">Status</label>
                <select :id="`${fieldId}-status`" v-model="draft.status" class="field-input">
                  <option value="pending">Pendente</option>
                  <option value="paid">{{ draft.kind === 'income' ? 'Recebido' : 'Pago' }}</option>
                  <option value="review">Revisar</option>
                </select>
              </div>
            </div>

            <!-- Datas -->
            <div class="field-row">
              <div class="field-group">
                <label class="field-label" :for="`${fieldId}-dueDate`">Vencimento</label>
                <input :id="`${fieldId}-dueDate`" v-model="draft.dueDate" :aria-invalid="!!errors.dueDate" :aria-describedby="errors.dueDate ? `${fieldId}-dueDate-error` : undefined" type="date" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label" :for="`${fieldId}-competenceDate`">Competência</label>
                <input :id="`${fieldId}-competenceDate`" v-model="draft.competenceDate" :aria-invalid="!!errors.competenceDate" :aria-describedby="errors.competenceDate ? `${fieldId}-competenceDate-error` : undefined" type="date" class="field-input" />
              </div>
            </div>

            <!-- Conta + Categoria -->
            <div class="field-row">
              <div class="field-group">
                <label class="field-label" :for="`${fieldId}-accountId`">Conta</label>
                <select :id="`${fieldId}-accountId`" v-model="draft.accountId" class="field-input">
                  <option value="">Sem conta</option>
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label" :for="`${fieldId}-categoryId`">Categoria</label>
                <select :id="`${fieldId}-categoryId`" v-model="draft.categoryId" class="field-input">
                  <option value="">Sem categoria</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
            </div>

            <!-- Recorrência (apenas no editor da Lista) -->
            <div v-if="allowRecurrence" class="field-group">
              <label class="field-label" :for="`${fieldId}-recurrence`">Recorrência (meses)</label>
              <input
                :id="`${fieldId}-recurrence`" v-model.number="draft.recurrence" :aria-invalid="!!errors.recurrence" :aria-describedby="errors.recurrence ? `${fieldId}-recurrence-error` : undefined"
                type="number"
                min="1"
                max="120"
                class="field-input"
                placeholder="1"
              />
              <span class="toggle-hint">
                {{ draft.recurrence > 1
                  ? `Cria ${draft.recurrence} lançamentos, um por mês a partir do vencimento.`
                  : '1 = apenas este mês. Aumente para repetir nos próximos meses.' }}
              </span>
            </div>

            <!-- Parcelas (exibido apenas para lançamentos parcelados) -->
            <div v-if="isInstallment" class="field-row">
              <div class="field-group">
                <label class="field-label" :for="`${fieldId}-installmentIndex`">Parcela nº</label>
                <input
                  :id="`${fieldId}-installmentIndex`" v-model.number="draft.installmentIndex" :aria-invalid="!!errors.installmentIndex" :aria-describedby="errors.installmentIndex ? `${fieldId}-installmentIndex-error` : undefined"
                  type="number"
                  class="field-input"
                  placeholder="Ex.: 3"
                  min="1"
                />
              </div>
              <div class="field-group">
                <label class="field-label" :for="`${fieldId}-installmentTotal`">Total de parcelas</label>
                <input
                  :id="`${fieldId}-installmentTotal`" v-model.number="draft.installmentTotal"
                  type="number"
                  class="field-input"
                  placeholder="Ex.: 12"
                  min="1"
                />
              </div>
            </div>

            <!-- Excluir do cálculo -->
            <label class="toggle-row">
              <div class="toggle-content">
                <span class="toggle-label">Excluir do cálculo</span>
                <span class="toggle-hint">Não soma ao saldo, receitas ou despesas (ex: VR, VA)</span>
              </div>
              <button
                type="button"
                class="toggle-switch"
                :class="{ 'toggle-on': draft.excludeFromCalc }"
                role="switch"
                aria-label="Excluir do cálculo"
                :aria-checked="draft.excludeFromCalc"
                @click="draft.excludeFromCalc = !draft.excludeFromCalc"
              >
                <span class="toggle-thumb" />
              </button>
            </label>

            <!-- Observações -->
            <div class="field-group">
              <label class="field-label" :for="`${fieldId}-description`">Observações</label>
              <textarea
                :id="`${fieldId}-description`" v-model="draft.description"
                class="field-input field-textarea"
                placeholder="Notas opcionais..."
                rows="2"
              />
            </div>
          </div>

          <p v-if="error" role="alert" class="editor-errors">{{ error }} Você pode tentar salvar novamente.</p>
          <div v-if="Object.keys(errors).length" role="alert" class="editor-errors">
            <p v-for="(message, field) in errors" :id="`${fieldId}-${field}-error`" :key="field">{{ message }}</p>
          </div>
          <div v-if="discardOpen" class="editor-errors" role="alert">
            <p>{{ error ? 'Fechar o formulário? Alterações na fila continuam pendentes; use o aviso de sincronização para descartá-las.' : 'Descartar as alterações deste lançamento?' }}</p>
            <button type="button" class="btn-cancel" @click="discardOpen = false">Continuar editando</button>
            <button type="button" class="btn-delete" @click="emit('close')">Descartar alterações</button>
          </div>
          <!-- Footer com ações (fixo) -->
          <div class="sheet-footer">
            <button v-if="entry && !isNew" type="button" class="btn-delete" :disabled="saving" @click="onDelete">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
              Excluir
            </button>
            <div class="btn-group">
              <button type="button" class="btn-cancel" @click="requestClose">Cancelar</button>
              <button type="button" class="btn-save" :disabled="saving" @click="onSave">{{ saving ? 'Salvando…' : 'Salvar' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, ref, useId, nextTick } from 'vue'
import { useDialog } from '~/design-system/composables/useDialog'
import { useEntryDraft } from '../composables/useEntryDraft'
import type { Account, Category, FinanceEntry } from '#shared/types'

const props = withDefaults(defineProps<{
  isNew?: boolean
  open: boolean
  entry: FinanceEntry | null
  accounts: Account[]
  categories: Category[]
  error?: string | null
  saving?: boolean
  allowRecurrence?: boolean
}>(), {
  allowRecurrence: false,
  isNew: false,
  saving: false,
  error: null,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', value: Partial<FinanceEntry>[]): void
  (e: 'delete', id: string): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
const fieldId = useId()
const { draft, errors, dirty, isInstallment, buildPayload } = useEntryDraft(() => props.entry, () => props.open, () => props.allowRecurrence)
const discardOpen = ref(false)
watch(() => props.open, () => { discardOpen.value = false })
const requestClose = () => {
  if (props.saving) return
  if (discardOpen.value) { discardOpen.value = false; return }
  if (dirty.value) { discardOpen.value = true; return }
  emit('close')
}
useDialog(computed(() => props.open), dialogRef, requestClose)
const onSave = async () => {
  if (props.saving) return
  const payload = buildPayload()
  if (payload) emit('save', payload)
  else { await nextTick(); dialogRef.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus() }
}
const onDelete = () => {
  if (!props.saving && draft.id && window.confirm(`Excluir o lançamento "${draft.title}"?`)) emit('delete', draft.id)
}
</script>

<style scoped src="../styles/entry-editor.css"></style>
