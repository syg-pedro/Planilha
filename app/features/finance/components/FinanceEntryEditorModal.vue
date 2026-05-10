<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="open"
        class="sheet-overlay"
        @click.self="emit('close')"
      >
        <div class="sheet-container">
          <!-- Handle -->
          <div class="sheet-handle-area" @click="emit('close')">
            <div class="sheet-handle" />
          </div>

          <!-- Header -->
          <div class="sheet-header">
            <div>
              <h2 class="sheet-title">{{ entry ? 'Editar lançamento' : 'Novo lançamento' }}</h2>
              <p class="sheet-subtitle">{{ draft.title || 'Preencha os dados abaixo' }}</p>
            </div>
            <button class="sheet-close" @click="emit('close')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Body (scrollable) -->
          <div class="sheet-body">

            <!-- Descrição -->
            <div class="field-group">
              <label class="field-label">Descrição</label>
              <input
                v-model="draft.title"
                type="text"
                class="field-input"
                placeholder="Ex.: Mercado, Salário..."
              />
            </div>

            <!-- Valor destacado -->
            <div class="field-group">
              <label class="field-label">Valor (R$)</label>
              <div class="amount-wrapper">
                <span class="amount-prefix">R$</span>
                <input
                  v-model="draft.amount"
                  type="number"
                  inputmode="decimal"
                  class="field-input amount-input"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
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
                    :class="{ 'seg-active-expense': draft.kind === 'expense' }"
                    @click="draft.kind = 'expense'"
                  >
                    <span>↓</span> Despesa
                  </button>
                  <button
                    type="button"
                    class="seg-btn"
                    :class="{ 'seg-active-income': draft.kind === 'income' }"
                    @click="draft.kind = 'income'"
                  >
                    <span>↑</span> Receita
                  </button>
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">Status</label>
                <select v-model="draft.status" class="field-select">
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="review">Revisar</option>
                </select>
              </div>
            </div>

            <!-- Datas -->
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Vencimento</label>
                <input v-model="draft.dueDate" type="text" class="field-input" placeholder="dd/mm/aaaa" />
              </div>
              <div class="field-group">
                <label class="field-label">Competência</label>
                <input v-model="draft.competenceDate" type="text" class="field-input" placeholder="dd/mm/aaaa" />
              </div>
            </div>

            <!-- Conta + Categoria -->
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Conta</label>
                <select v-model="draft.accountId" class="field-select">
                  <option value="">Sem conta</option>
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label">Categoria</label>
                <select v-model="draft.categoryId" class="field-select">
                  <option value="">Sem categoria</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
            </div>

            <!-- Parcelas (exibido apenas para lançamentos parcelados) -->
            <div v-if="isInstallment" class="field-row">
              <div class="field-group">
                <label class="field-label">Parcela nº</label>
                <input
                  v-model.number="draft.installmentIndex"
                  type="number"
                  class="field-input"
                  placeholder="Ex.: 3"
                  min="1"
                />
              </div>
              <div class="field-group">
                <label class="field-label">Total de parcelas</label>
                <input
                  v-model.number="draft.installmentTotal"
                  type="number"
                  class="field-input"
                  placeholder="Ex.: 12"
                  min="1"
                />
              </div>
            </div>

            <!-- Observações -->
            <div class="field-group">
              <label class="field-label">Observações</label>
              <textarea
                v-model="draft.description"
                class="field-input field-textarea"
                placeholder="Notas opcionais..."
                rows="2"
              />
            </div>
          </div>

          <!-- Footer com ações (fixo) -->
          <div class="sheet-footer">
            <button v-if="entry" type="button" class="btn-delete" @click="onDelete">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
              Excluir
            </button>
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
import { computed, reactive, watch } from 'vue'
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
  categoryId: '',
  installmentIndex: null as number | null,
  installmentTotal: null as number | null,
})

const isInstallment = computed(() =>
  draft.installmentIndex != null || draft.installmentTotal != null
)

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
    draft.installmentIndex = entry.installmentIndex ?? null
    draft.installmentTotal = entry.installmentTotal ?? null
  },
  { immediate: true }
)

const onSave = () => {
  const amount = Number.parseFloat(draft.amount)
  const dueDate = toIsoDate(draft.dueDate)
  const competenceDate = toIsoDate(draft.competenceDate)

  if (!draft.id || Number.isNaN(amount) || !dueDate || !competenceDate) return

  emit('save', {
    id: draft.id,
    title: draft.title.trim() || 'Lançamento',
    description: draft.description,
    amount,
    kind: draft.kind === 'income' ? 'income' : 'expense',
    status: draft.status === 'paid' || draft.status === 'review' ? draft.status : 'pending',
    dueDate,
    competenceDate,
    accountId: draft.accountId || null,
    categoryId: draft.categoryId || null,
    installmentIndex: draft.installmentIndex,
    installmentTotal: draft.installmentTotal,
  })
}

const onDelete = () => {
  if (!draft.id) return
  emit('delete', draft.id)
}
</script>

<style scoped>
/* ── Overlay ─────────────────────────────────────────────── */
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

/* ── Container (bottom sheet) ────────────────────────────── */
.sheet-container {
  width: 100%;
  max-width: 640px;
  max-height: 95dvh;
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

/* ── Handle ──────────────────────────────────────────────── */
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

/* ── Header ──────────────────────────────────────────────── */
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
.sheet-close:hover { background: var(--surface2); filter: brightness(0.9); }

/* ── Body ────────────────────────────────────────────────── */
.sheet-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Field primitives ────────────────────────────────────── */
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

.field-textarea {
  height: auto;
  padding: 12px 14px;
  resize: none;
  line-height: 1.5;
}

/* ── Valor com prefixo ───────────────────────────────────── */
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
.amount-input {
  padding-left: 42px;
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
}

/* ── Segmented control Tipo ──────────────────────────────── */
.segmented {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  height: 48px;
}
.seg-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--text3);
  transition: background 0.15s, color 0.15s;
  touch-action: manipulation;
}
.seg-btn:first-child { border-right: 1px solid var(--border); }
.seg-active-expense {
  background: color-mix(in srgb, var(--danger) 14%, transparent);
  color: var(--danger);
}
.seg-active-income {
  background: color-mix(in srgb, var(--success) 14%, transparent);
  color: var(--success);
}

/* ── Footer ──────────────────────────────────────────────── */
.sheet-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}
.btn-group {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
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
.btn-delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  height: 46px;
  font-size: 13px;
  font-weight: 600;
  color: var(--danger);
  cursor: pointer;
  font-family: inherit;
  touch-action: manipulation;
  transition: background 0.12s;
  white-space: nowrap;
}
.btn-delete:hover { background: var(--danger-light); }

/* ── Animação de entrada ─────────────────────────────────── */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.22s ease;
}
.sheet-enter-active .sheet-container,
.sheet-leave-active .sheet-container {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .sheet-container,
.sheet-leave-to .sheet-container {
  transform: translateY(100%);
}

/* ── Desktop: dialog centralizado ───────────────────────── */
@media (min-width: 640px) {
  .sheet-overlay {
    align-items: center;
    padding: 16px;
  }
  .sheet-container {
    border-radius: 20px;
    border: 1px solid var(--border);
    max-height: 92dvh;
  }
  .sheet-handle-area { display: none; }
  .sheet-enter-from .sheet-container,
  .sheet-leave-to .sheet-container {
    transform: scale(0.95) translateY(8px);
  }
}
</style>
