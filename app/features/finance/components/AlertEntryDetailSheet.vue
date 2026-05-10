<template>
  <Teleport to="body">
    <Transition name="sheet-slide">
      <div
        v-if="open && entry"
        class="sheet-overlay"
        @click.self="emit('close')"
      >
        <div class="sheet">

          <!-- Handle bar -->
          <div class="sheet-handle" />

          <!-- Alert context banner -->
          <div class="sheet-alert-banner" :style="{ background: toneColor.bg, borderBottom: `2px solid ${toneColor.accent}` }">
            <span class="sheet-alert-icon" :style="{ color: toneColor.accent }">{{ toneIcon }}</span>
            <p class="sheet-alert-label" :style="{ color: toneColor.accent }">{{ alertTitle }}</p>
          </div>

          <!-- Entry summary -->
          <div class="sheet-body">

            <!-- Amount hero -->
            <div class="sheet-hero">
              <span class="sheet-hero-amount" :style="{ color: entry.kind === 'income' ? 'var(--success)' : 'var(--danger)' }">
                {{ entry.kind === 'income' ? '+' : '-' }}{{ currency.format(entry.amount) }}
              </span>
              <span class="sheet-hero-title">{{ entry.title }}</span>
              <span
                class="sheet-status-badge"
                :style="{
                  background: statusColor.bg,
                  color: statusColor.text,
                  border: `1px solid ${statusColor.border}`,
                }"
              >{{ statusLabel }}</span>
            </div>

            <!-- Details list -->
            <div class="sheet-details">
              <div class="sheet-row">
                <span class="sheet-row-label">Vencimento</span>
                <span class="sheet-row-value">{{ formatDate(entry.dueDate) }}</span>
              </div>
              <div class="sheet-row">
                <span class="sheet-row-label">Competência</span>
                <span class="sheet-row-value">{{ formatDate(entry.competenceDate) }}</span>
              </div>
              <div v-if="accountName" class="sheet-row">
                <span class="sheet-row-label">Conta</span>
                <span class="sheet-row-value">{{ accountName }}</span>
              </div>
              <div v-if="categoryName" class="sheet-row">
                <span class="sheet-row-label">Categoria</span>
                <span class="sheet-row-value">{{ categoryName }}</span>
              </div>
              <div v-if="entry.installmentIndex && entry.installmentTotal" class="sheet-row">
                <span class="sheet-row-label">Parcela</span>
                <span class="sheet-row-value">{{ entry.installmentIndex }}/{{ entry.installmentTotal }}</span>
              </div>
              <div v-if="entry.description" class="sheet-row sheet-row-obs">
                <span class="sheet-row-label">Observações</span>
                <span class="sheet-row-value">{{ entry.description }}</span>
              </div>
            </div>

            <!-- Primary action: Mark as paid (only for pending expenses) -->
            <button
              v-if="entry.status === 'pending' && entry.kind === 'expense'"
              class="sheet-btn sheet-btn-primary"
              :disabled="saving"
              @click="markPaid"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {{ saving ? 'Salvando…' : 'Marcar como pago' }}
            </button>

            <!-- Secondary actions -->
            <div class="sheet-actions">
              <button class="sheet-btn sheet-btn-secondary" @click="emit('edit', entry)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>
              <button class="sheet-btn sheet-btn-danger" @click="confirmDelete">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                Excluir
              </button>
            </div>

            <button class="sheet-btn-close-text" @click="emit('close')">Fechar</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
  (e: 'pay', id: string): void
  (e: 'edit', entry: FinanceEntry): void
  (e: 'delete', id: string): void
}>()

const currency = useCurrency()
const { formatDate } = useDateFormat()
const saving = ref(false)

const tone = computed(() => props.alertTone ?? 'warning')

const TONE_COLORS = {
  danger:  { accent: 'var(--danger)',  bg: 'color-mix(in srgb, var(--danger)  10%, transparent)' },
  warning: { accent: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
  info:    { accent: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  success: { accent: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
}
const TONE_ICONS = { danger: '⚠️', warning: '⏰', info: 'ℹ️', success: '✅' }

const toneColor = computed(() => TONE_COLORS[tone.value])
const toneIcon  = computed(() => TONE_ICONS[tone.value])

const STATUS = {
  pending: { label: 'Pendente', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)', text: 'var(--warning)', border: 'color-mix(in srgb, var(--warning) 30%, transparent)' },
  paid:    { label: 'Pago',     bg: 'color-mix(in srgb, var(--success) 12%, transparent)', text: 'var(--success)', border: 'color-mix(in srgb, var(--success) 30%, transparent)' },
  review:  { label: 'Revisar',  bg: 'color-mix(in srgb, var(--danger)  12%, transparent)', text: 'var(--danger)',  border: 'color-mix(in srgb, var(--danger)  30%, transparent)' },
}

const statusLabel = computed(() => props.entry ? STATUS[props.entry.status].label : '')
const statusColor = computed(() => props.entry ? STATUS[props.entry.status] : STATUS.pending)

const accountName  = computed(() => props.accounts.find(a => a.id === props.entry?.accountId)?.name ?? '')
const categoryName = computed(() => props.categories.find(c => c.id === props.entry?.categoryId)?.name ?? '')

const markPaid = async () => {
  if (!props.entry) return
  saving.value = true
  emit('pay', props.entry.id)
  saving.value = false
}

const confirmDelete = () => {
  if (!props.entry) return
  if (confirm(`Excluir "${props.entry.title}"?`)) {
    emit('delete', props.entry.id)
  }
}
</script>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  max-height: 92dvh;
  background: var(--surface);
  border-radius: 20px 20px 0 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  border-radius: 99px;
  background: var(--border);
  margin: 12px auto 0;
}

.sheet-alert-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  margin-top: 12px;
}

.sheet-alert-icon { font-size: 18px; flex-shrink: 0 }

.sheet-alert-label {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}

.sheet-body {
  padding: 20px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sheet-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 0 4px;
}

.sheet-hero-amount {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.sheet-hero-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.sheet-status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 99px;
  letter-spacing: 0.04em;
}

.sheet-details {
  background: var(--surface2);
  border-radius: 12px;
  overflow: hidden;
}

.sheet-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}

.sheet-row:last-child { border-bottom: none }

.sheet-row-obs { align-items: flex-start }

.sheet-row-label {
  font-size: 12px;
  color: var(--text3);
  font-weight: 600;
  flex-shrink: 0;
}

.sheet-row-value {
  font-size: 13px;
  color: var(--text);
  font-weight: 600;
  text-align: right;
}

.sheet-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.15s;
  font-family: inherit;
}

.sheet-btn:active { opacity: 0.75 }
.sheet-btn:disabled { opacity: 0.5; cursor: default }

.sheet-btn-primary {
  background: var(--success);
  color: #fff;
}

.sheet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sheet-btn-secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border) !important;
  font-size: 14px;
}

.sheet-btn-danger {
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  color: var(--danger);
  border: 1px solid color-mix(in srgb, var(--danger) 25%, transparent) !important;
  font-size: 14px;
}

.sheet-btn-close-text {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--text3);
  font-family: inherit;
  padding: 4px;
  width: 100%;
}

.sheet-slide-enter-active,
.sheet-slide-leave-active { transition: transform 0.3s ease, opacity 0.3s ease }
.sheet-slide-enter-from,
.sheet-slide-leave-to { transform: translateY(100%); opacity: 0 }
</style>
