<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="sheet-overlay" @click.self="emit('close')">
        <div class="sheet-container">
          <div class="sheet-handle-area" @click="emit('close')">
            <div class="sheet-handle" />
          </div>

          <div class="sheet-header">
            <div>
              <h2 class="sheet-title">Editar conta</h2>
              <p class="sheet-subtitle">{{ draft.name || 'Preencha os dados abaixo' }}</p>
            </div>
            <button class="sheet-close" @click="emit('close')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="sheet-body">

            <!-- Nome -->
            <div class="field-group">
              <label class="field-label">Nome da conta</label>
              <input v-model="draft.name" type="text" class="field-input" placeholder="Ex.: Nubank, Sicredi..." />
            </div>

            <!-- Responsável + Tipo -->
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Responsável</label>
                <input v-model="draft.owner" type="text" class="field-input" placeholder="Nome do titular" />
              </div>
              <div class="field-group">
                <label class="field-label">Tipo</label>
                <select v-model="draft.type" class="field-select">
                  <option value="bank">Conta bancária</option>
                  <option value="credit_card">Cartão de crédito</option>
                  <option value="benefit">Benefício (VR/VA)</option>
                  <option value="external">Externo</option>
                </select>
              </div>
            </div>

            <!-- Campos exclusivos para cartão de crédito -->
            <template v-if="draft.type === 'credit_card'">
              <div class="field-group">
                <label class="field-label">Limite total (R$)</label>
                <div class="amount-wrapper">
                  <span class="amount-prefix">R$</span>
                  <input
                    v-model="draft.limitTotal"
                    type="number"
                    inputmode="decimal"
                    class="field-input amount-input"
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div class="field-row">
                <div class="field-group">
                  <label class="field-label">Dia de fechamento</label>
                  <input
                    v-model.number="draft.closingDay"
                    type="number"
                    class="field-input"
                    placeholder="Ex.: 25"
                    min="1"
                    max="31"
                  />
                </div>
                <div class="field-group">
                  <label class="field-label">Dia de vencimento</label>
                  <input
                    v-model.number="draft.dueDay"
                    type="number"
                    class="field-input"
                    placeholder="Ex.: 5"
                    min="1"
                    max="31"
                  />
                </div>
              </div>
            </template>

          </div>

          <div class="sheet-footer">
            <div class="btn-group">
              <button type="button" class="btn-cancel" @click="emit('close')">Cancelar</button>
              <button type="button" class="btn-save" @click="onSave">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Account } from '#shared/types'

const props = defineProps<{
  open: boolean
  account: Account | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', value: Partial<Account>): void
}>()

const draft = reactive({
  id: '',
  name: '',
  owner: '',
  type: 'bank' as Account['type'],
  limitTotal: '' as string | number,
  closingDay: null as number | null,
  dueDay: null as number | null,
})

watch(
  () => props.account,
  (account) => {
    if (!account) return
    draft.id         = account.id
    draft.name       = account.name
    draft.owner      = account.owner
    draft.type       = account.type
    draft.limitTotal = account.limitTotal ?? ''
    draft.closingDay = account.closingDay
    draft.dueDay     = account.dueDay
  },
  { immediate: true }
)

const onSave = () => {
  if (!draft.id) return
  const limitTotal = draft.limitTotal !== '' ? Number(draft.limitTotal) : null
  emit('save', {
    id:          draft.id,
    name:        draft.name.trim() || 'Conta',
    owner:       draft.owner.trim(),
    type:        draft.type,
    limitTotal:  draft.type === 'credit_card' ? (Number.isFinite(limitTotal) ? limitTotal : null) : null,
    closingDay:  draft.type === 'credit_card' ? (draft.closingDay ?? null) : null,
    dueDay:      draft.type === 'credit_card' ? (draft.dueDay ?? null) : null,
  })
}
</script>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: oklch(0% 0 0 / 0.55);
  backdrop-filter: blur(4px);
}
.sheet-container {
  width: 100%;
  max-width: 560px;
  max-height: 92dvh;
  background: var(--surface);
  border-radius: 24px 24px 0 0;
  border: 1px solid var(--border);
  border-bottom: none;
  box-shadow: 0 -8px 40px oklch(0% 0 0 / 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.sheet-handle-area {
  display: flex;
  justify-content: center;
  padding: 12px 0 4px;
  cursor: pointer;
}
.sheet-handle {
  width: 40px;
  height: 4px;
  border-radius: 99px;
  background: var(--border);
}
.sheet-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 20px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.sheet-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.2;
}
.sheet-subtitle {
  font-size: 13px;
  color: var(--text3);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}
.sheet-close {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text2);
  flex-shrink: 0;
  touch-action: manipulation;
  transition: background 0.12s;
}
.sheet-close:hover { filter: brightness(0.9); }
.sheet-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.field-input {
  width: 100%;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
  -webkit-appearance: none;
}
.field-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-dim);
}
.field-input::placeholder { color: var(--text3); }
.field-select {
  width: 100%;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  font-family: inherit;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 18px;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
  cursor: pointer;
  -webkit-appearance: none;
}
.field-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-dim);
}
.amount-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.amount-prefix {
  position: absolute;
  left: 14px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text3);
  pointer-events: none;
}
.amount-input { padding-left: 42px; }
.sheet-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}
.btn-group { display: flex; gap: 8px; }
.btn-cancel {
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0 18px;
  height: 46px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text2);
  cursor: pointer;
  font-family: inherit;
  touch-action: manipulation;
  transition: filter 0.12s;
}
.btn-cancel:hover { filter: brightness(0.95); }
.btn-save {
  background: var(--primary);
  border: none;
  border-radius: 10px;
  padding: 0 24px;
  height: 46px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  touch-action: manipulation;
  transition: filter 0.12s;
}
.btn-save:hover { filter: brightness(1.1); }
.sheet-enter-active,
.sheet-leave-active { transition: opacity 0.22s ease; }
.sheet-enter-active .sheet-container,
.sheet-leave-active .sheet-container { transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1); }
.sheet-enter-from,
.sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet-container,
.sheet-leave-to .sheet-container { transform: translateY(100%); }
@media (min-width: 640px) {
  .sheet-overlay { align-items: center; padding: 16px; }
  .sheet-container { border-radius: 20px; border: 1px solid var(--border); max-height: 92dvh; }
  .sheet-handle-area { display: none; }
  .sheet-enter-from .sheet-container,
  .sheet-leave-to .sheet-container { transform: scale(0.95) translateY(8px); }
}
</style>
