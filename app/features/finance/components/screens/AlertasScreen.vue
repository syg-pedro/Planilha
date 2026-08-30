<template>
  <div class="alerts">

    <!-- Header -->
    <header class="alerts__head">
      <div>
        <h2 class="alerts__title">Alertas inteligentes</h2>
        <p class="alerts__sub">{{ activeAlerts.length }} alerta(s) ativo(s)</p>
      </div>
      <BaseButton
        v-if="activeAlerts.length > 0"
        variant="secondary"
        size="sm"
        @click="dismissAll"
      >
        <BaseIcon name="close" :size="13" />
        Dispensar todos
      </BaseButton>
    </header>

    <!-- Empty -->
    <BaseEmptyState
      v-if="activeAlerts.length === 0"
      icon="check"
      title="Nenhum alerta"
      body="Tudo parece estar sob controle. Continue assim!"
    />

    <!-- Alert cards -->
    <div
      v-for="alert in activeAlerts"
      :key="alert.id"
      class="alert-card"
      :class="{ 'alert-card--interactive': isClickable(alert) }"
      :style="{
        '--alert-accent': TONE_COLORS[alert.tone].accent,
        '--alert-bg': TONE_COLORS[alert.tone].bg,
      }"
      @click="onAlertClick(alert)"
    >
      <span class="alert-card__icon">
        <BaseIcon :name="TONE_ICONS[alert.tone]" :size="19" />
      </span>
      <div class="alert-card__content">
        <p class="alert-card__title">{{ alert.title }}</p>
        <p class="alert-card__body">{{ alert.body }}</p>
        <p v-if="alert.sub" class="alert-card__sub">{{ alert.sub }}</p>
        <p v-if="isClickable(alert)" class="alert-card__action">
          {{ alert.entryId ? 'Clique para ver detalhes e opções →' : 'Clique para ir à tela →' }}
        </p>
      </div>
      <button
        type="button"
        class="alert-card__close"
        aria-label="Dispensar alerta"
        @click.stop="dismiss(alert.id)"
      >
        <BaseIcon name="close" :size="13" />
      </button>
    </div>

    <!-- Dismissed section -->
    <div v-if="dismissedCount > 0" class="alerts__restore">
      <button type="button" class="alerts__restore-btn" @click="restoreAll">
        Restaurar {{ dismissedCount }} alerta(s) dispensado(s)
      </button>
    </div>

    <!-- Detail sheet (abre ao clicar no alerta) -->
    <AlertEntryDetailSheet
      :open="sheetOpen"
      :entry="selectedEntry"
      :accounts="store.accounts"
      :categories="store.categories"
      :alert-title="selectedAlertTitle"
      :alert-tone="selectedAlertTone"
      @close="closeSheet"
      @pay="onPay"
      @edit="openEditor"
      @delete="onDelete"
    />

    <!-- Editor modal (abre só ao clicar Editar no sheet) -->
    <FinanceEntryEditorModal
      :open="editorOpen"
      :entry="selectedEntry"
      :accounts="store.accounts"
      :categories="store.categories"
      @close="closeEditor"
      @save="saveFromEditor"
      @delete="onDelete"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useDateFormat } from '~/composables/useDateFormat'
import BaseIcon                from '~/components/base/BaseIcon.vue'
import BaseEmptyState          from '~/components/base/BaseEmptyState.vue'
import BaseButton              from '~/components/base/BaseButton.vue'
import AlertEntryDetailSheet   from '~/features/finance/components/AlertEntryDetailSheet.vue'
import FinanceEntryEditorModal from '~/features/finance/components/FinanceEntryEditorModal.vue'
import type { FinanceEntry } from '#shared/types'

type AlertTone = 'danger' | 'warning' | 'info' | 'success'

interface SmartAlert {
  id:          string
  tone:        AlertTone
  title:       string
  body:        string
  sub?:        string
  entryId?:    string
  navigateTo?: string
}

const emit = defineEmits<{ (e: 'navigate', screen: string): void }>()

const store    = useFinanceStore()
const currency = useCurrency()
const { formatDate } = useDateFormat()
const fmt      = (v: number) => currency.format(v)

const sheetOpen         = ref(false)
const editorOpen        = ref(false)
const selectedEntry     = ref<FinanceEntry | null>(null)
const selectedAlertTitle = ref('')
const selectedAlertTone  = ref<AlertTone>('warning')

const closeSheet  = () => { sheetOpen.value = false }
const closeEditor = () => { editorOpen.value = false }

const openEditor = (entry: FinanceEntry) => {
  sheetOpen.value = false
  selectedEntry.value = entry
  editorOpen.value = true
}

const saveFromEditor = async (entries: Partial<FinanceEntry>[]) => {
  await store.saveEntriesBatch({ upserts: entries, deletes: [] })
  closeEditor()
  selectedEntry.value = null
}

const onPay = async (id: string) => {
  const entry = store.entries.find(e => e.id === id)
  if (!entry) return
  await store.saveEntriesBatch({ upserts: [{ ...entry, status: 'paid' }], deletes: [] })
  closeSheet()
  selectedEntry.value = null
}

const onDelete = async (id: string) => {
  await store.saveEntriesBatch({ upserts: [], deletes: [id] })
  closeSheet()
  closeEditor()
  selectedEntry.value = null
}

const isClickable = (alert: SmartAlert) => !!(alert.entryId || alert.navigateTo)

const onAlertClick = (alert: SmartAlert) => {
  if (alert.entryId) {
    const entry = store.entries.find(e => e.id === alert.entryId) ?? null
    if (entry) {
      selectedEntry.value = entry
      selectedAlertTitle.value = alert.title
      selectedAlertTone.value = alert.tone
      sheetOpen.value = true
    }
    return
  }
  if (alert.navigateTo) {
    emit('navigate', alert.navigateTo)
  }
}

const TONE_COLORS: Record<AlertTone, { accent: string; bg: string }> = {
  danger:  { accent: 'var(--danger)',  bg: 'var(--danger-light)'  },
  warning: { accent: 'var(--warning)', bg: 'var(--warning-light)' },
  info:    { accent: 'var(--primary)', bg: 'var(--primary-dim)'   },
  success: { accent: 'var(--success)', bg: 'var(--success-light)' },
}
const TONE_ICONS: Record<AlertTone, string> = {
  danger: 'warning', warning: 'warning', info: 'info', success: 'check'
}

const DISMISSED_KEY = 'ff-dismissed-alerts'

const dismissedIds = useLocalStorage<string[]>(DISMISSED_KEY, [])

const generatedAlerts = computed((): SmartAlert[] => {
  const alerts: SmartAlert[] = []
  const today    = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const in3      = new Date(today); in3.setDate(in3.getDate() + 3)
  const in3Str   = in3.toISOString().slice(0, 10)
  const in7      = new Date(today); in7.setDate(in7.getDate() + 7)
  const in7Str   = in7.toISOString().slice(0, 10)

  // Vencimentos urgentes (≤ 3 dias) — alerta por entrada individual
  const urgent = store.entries.filter(
    e => e.kind === 'expense' && e.status !== 'paid' && e.dueDate >= todayStr && e.dueDate <= in3Str
  )
  for (const e of urgent) {
    const account = e.accountId ? store.accountMap.get(e.accountId) : null
    alerts.push({
      id:      `urgent-${e.id}`,
      tone:    'danger',
      title:   `${e.title} vence em breve`,
      body:    `${fmt(e.amount)} — vencimento ${formatDate(e.dueDate)}${account ? ` via ${account.name}` : ''}`,
      entryId: e.id,
    })
  }

  // Vencimentos próximos (4-7 dias)
  const upcoming = store.entries.filter(
    e => e.kind === 'expense' && e.status !== 'paid' && e.dueDate > in3Str && e.dueDate <= in7Str
  )
  if (upcoming.length > 0) {
    const total = upcoming.reduce((s, e) => s + e.amount, 0)
    alerts.push({
      id:         'upcoming-week',
      tone:       'warning',
      title:      `${upcoming.length} vencimento(s) esta semana`,
      body:       `Total de ${fmt(total)} vence nos próximos 7 dias.`,
      navigateTo: 'planilha',
    })
  }

  // Lançamentos vencidos e não pagos
  const overdue = store.entries.filter(
    e => e.kind === 'expense' && e.status !== 'paid' && e.dueDate < todayStr
  )
  if (overdue.length > 0) {
    const total = overdue.reduce((s, e) => s + e.amount, 0)
    alerts.push({
      id:         'overdue',
      tone:       'danger',
      title:      `${overdue.length} lançamento(s) vencido(s)`,
      body:       `${fmt(total)} em despesas vencidas sem confirmação de pagamento.`,
      navigateTo: 'planilha',
    })
  }

  // Taxa de poupança baixa
  const currentMonthKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`
  const monthIncome  = store.cashableEntries.filter(e => e.kind === 'income'  && e.dueDate.startsWith(currentMonthKey)).reduce((s, e) => s + e.amount, 0)
  const monthExpense = store.cashableEntries.filter(e => e.kind === 'expense' && e.dueDate.startsWith(currentMonthKey)).reduce((s, e) => s + e.amount, 0)
  if (monthIncome > 0) {
    const savingsRate = ((monthIncome - monthExpense) / monthIncome) * 100
    if (savingsRate < 0) {
      alerts.push({
        id:         'savings-negative',
        tone:       'danger',
        title:      'Despesas superam receitas este mês',
        body:       `Déficit de ${fmt(monthExpense - monthIncome)}. Revise seus gastos.`,
        navigateTo: 'planilha',
      })
    } else if (savingsRate < 10) {
      alerts.push({
        id:         'savings-low',
        tone:       'warning',
        title:      `Taxa de poupança baixa: ${savingsRate.toFixed(1)}%`,
        body:       'Recomendado manter pelo menos 20% de poupança mensal.',
        navigateTo: 'planilha',
      })
    }
  }

  // Uso alto de cartão de crédito
  if (store.monthlyKpis.cardsUsedPercent >= 90) {
    alerts.push({
      id:         'card-critical',
      tone:       'danger',
      title:      `Limite do cartão em ${store.monthlyKpis.cardsUsedPercent.toFixed(0)}%`,
      body:       'Uso crítico do limite de crédito. Evite novas compras parceladas.',
      navigateTo: 'planilha',
    })
  } else if (store.monthlyKpis.cardsUsedPercent >= 70) {
    alerts.push({
      id:         'card-warn',
      tone:       'warning',
      title:      `Uso do cartão em ${store.monthlyKpis.cardsUsedPercent.toFixed(0)}%`,
      body:       'Atenção ao limite disponível nos cartões de crédito.',
      navigateTo: 'planilha',
    })
  }

  return alerts
})

const activeAlerts = computed(() =>
  generatedAlerts.value.filter(a => !dismissedIds.value.includes(a.id))
)
const dismissedCount = computed(() =>
  generatedAlerts.value.filter(a => dismissedIds.value.includes(a.id)).length
)

const dismiss    = (id: string) => { if (!dismissedIds.value.includes(id)) dismissedIds.value.push(id) }
const dismissAll = () => { dismissedIds.value = generatedAlerts.value.map(a => a.id) }
const restoreAll = () => { dismissedIds.value = [] }

function useLocalStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue)
  if (process.client) {
    try { data.value = JSON.parse(localStorage.getItem(key) ?? 'null') ?? defaultValue } catch { /* */ }
    watch(data, val => localStorage.setItem(key, JSON.stringify(val)), { deep: true })
  }
  return data
}
</script>

<style scoped>
.alerts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alerts__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 2px;
}

.alerts__title {
  color: var(--text);
  font-size: 16px;
  font-weight: 800;
}

.alerts__sub {
  margin-top: 2px;
  color: var(--text3);
  font-size: 11.5px;
}

.alerts__restore {
  padding: 6px 0;
  text-align: center;
}

.alerts__restore-btn {
  color: var(--text3);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 700;
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
}

/* ── Card de alerta ────────────────────────────────────────── */
.alert-card {
  display: flex;
  gap: 12px;
  padding: 14px 18px;
  background: var(--alert-bg);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  cursor: default;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.alert-card--interactive {
  cursor: pointer;
}

.alert-card--interactive:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md);
}

.alert-card--interactive:active {
  transform: translate(2px, 2px);
  box-shadow: var(--shadow-xs);
}

.alert-card__icon {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  margin-top: 1px;
  color: var(--alert-accent);
}

.alert-card__content {
  flex: 1;
  min-width: 0;
}

.alert-card__title {
  color: var(--text);
  font-size: 13.5px;
  font-weight: 700;
}

.alert-card__body {
  margin-top: 3px;
  color: var(--text3);
  font-size: 11.5px;
}

.alert-card__sub {
  margin-top: 3px;
  color: var(--text3);
  font-size: 10.5px;
  font-style: italic;
}

.alert-card__action {
  margin-top: 5px;
  color: var(--alert-accent);
  font-size: 10.5px;
  font-weight: 800;
}

.alert-card__close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--text3);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.alert-card__close:hover {
  color: var(--text);
}

@media (max-width: 640px) {
  .alerts {
    gap: 10px;
  }

  .alerts__title {
    font-size: 15px;
  }

  .alert-card {
    gap: 10px;
    padding: 12px 14px;
  }

  .alert-card__title {
    font-size: 13px;
  }

  .alert-card__body {
    font-size: 11px;
  }

  .alert-card__sub,
  .alert-card__action {
    margin-top: 3px;
    font-size: 10px;
  }
}
</style>
