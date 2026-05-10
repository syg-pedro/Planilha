<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px">
      <div>
        <h2 style="font-size: 16px; font-weight: 800; color: var(--text)">Alertas inteligentes</h2>
        <p style="font-size: 12px; color: var(--text3); margin-top: 2px">{{ activeAlerts.length }} alerta(s) ativo(s)</p>
      </div>
      <button
        v-if="activeAlerts.length > 0"
        style="display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)"
        @click="dismissAll"
      >
        <BaseIcon name="close" :size="13" />
        Dispensar todos
      </button>
    </div>

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
      :style="{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: `1px solid ${TONE_COLORS[alert.tone].border}`,
        borderLeft: `4px solid ${TONE_COLORS[alert.tone].accent}`,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)',
        cursor: isClickable(alert) ? 'pointer' : 'default',
        transition: 'opacity 0.15s',
      }"
      @click="onAlertClick(alert)"
      @mouseenter="(e) => { if (isClickable(alert)) (e.currentTarget as HTMLElement).style.opacity = '0.85' }"
      @mouseleave="(e) => (e.currentTarget as HTMLElement).style.opacity = '1'"
    >
      <div
        :style="{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: TONE_COLORS[alert.tone].bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }"
      >
        <BaseIcon :name="TONE_ICONS[alert.tone]" :size="16" :color="TONE_COLORS[alert.tone].accent" />
      </div>
      <div style="flex: 1; min-width: 0">
        <p style="font-size: 13px; font-weight: 700; color: var(--text)">{{ alert.title }}</p>
        <p style="font-size: 12px; color: var(--text3); margin-top: 3px">{{ alert.body }}</p>
        <p v-if="alert.sub" style="font-size: 11px; color: var(--text3); margin-top: 4px; font-style: italic">{{ alert.sub }}</p>
        <p v-if="isClickable(alert)" style="font-size: 11px; color: var(--primary); margin-top: 6px; font-weight: 600">
          {{ alert.entryId ? 'Clique para ver detalhes e opções →' : 'Clique para ir à tela →' }}
        </p>
      </div>
      <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0">
        <button
          style="background: none; border: none; cursor: pointer; color: var(--text3); padding: 2px; display: flex; align-items: center"
          @click.stop="dismiss(alert.id)"
        >
          <BaseIcon name="close" :size="14" />
        </button>
      </div>
    </div>

    <!-- Dismissed section -->
    <div v-if="dismissedCount > 0" style="text-align: center; padding: 8px 0">
      <button
        style="background: none; border: none; cursor: pointer; font-size: 12px; color: var(--text3); text-decoration: underline"
        @click="restoreAll"
      >
        Restaurar {{ dismissedCount }} alerta(s) dispensado(s)
      </button>
    </div>

    <!-- Entry editor modal -->
    <FinanceEntryEditorModal
      :open="editorOpen"
      :entry="selectedEntry"
      :accounts="store.accounts"
      :categories="store.categories"
      @close="closeEditor"
      @save="saveFromEditor"
      @delete="deleteFromEditor"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useDateFormat } from '~/composables/useDateFormat'
import BaseIcon                from '~/components/base/BaseIcon.vue'
import BaseEmptyState          from '~/components/base/BaseEmptyState.vue'
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

const editorOpen    = ref(false)
const selectedEntry = ref<FinanceEntry | null>(null)

const closeEditor = () => { editorOpen.value = false; selectedEntry.value = null }

const saveFromEditor = async (value: Partial<FinanceEntry>) => {
  await store.saveEntriesBatch({ upserts: [value as FinanceEntry], deletes: [] })
  closeEditor()
}

const deleteFromEditor = async (id: string) => {
  await store.saveEntriesBatch({ upserts: [], deletes: [id] })
  closeEditor()
}

const isClickable = (alert: SmartAlert) => !!(alert.entryId || alert.navigateTo)

const onAlertClick = (alert: SmartAlert) => {
  if (alert.entryId) {
    const entry = store.entries.find(e => e.id === alert.entryId) ?? null
    if (entry) {
      selectedEntry.value = entry
      editorOpen.value = true
    }
    return
  }
  if (alert.navigateTo) {
    emit('navigate', alert.navigateTo)
  }
}

const TONE_COLORS: Record<AlertTone, { accent: string; bg: string; border: string }> = {
  danger:  { accent: 'var(--danger)',  bg: 'color-mix(in srgb, var(--danger)  12%, transparent)', border: 'color-mix(in srgb, var(--danger)  25%, transparent)' },
  warning: { accent: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)', border: 'color-mix(in srgb, var(--warning) 25%, transparent)' },
  info:    { accent: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', border: 'color-mix(in srgb, var(--primary) 25%, transparent)' },
  success: { accent: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 12%, transparent)', border: 'color-mix(in srgb, var(--success) 25%, transparent)' },
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

  // Orçamentos: consumo > 80% e > 100%
  const currentMonthKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`
  for (const budget of store.budgets) {
    if (!budget.monthRef.startsWith(currentMonthKey)) continue
    const spent = store.entries
      .filter(e => e.kind === 'expense' && e.categoryId === budget.categoryId && e.dueDate.startsWith(currentMonthKey))
      .reduce((s, e) => s + e.amount, 0)
    const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
    const cat = store.categoryMap.get(budget.categoryId)
    if (pct >= 100) {
      alerts.push({
        id:         `budget-over-${budget.id}`,
        tone:       'danger',
        title:      `Orçamento de "${cat?.name ?? 'categoria'}" ultrapassado`,
        body:       `Gasto: ${fmt(spent)} de ${fmt(budget.amount)} (${pct.toFixed(0)}%)`,
        navigateTo: 'budget',
      })
    } else if (pct >= 80) {
      alerts.push({
        id:         `budget-warn-${budget.id}`,
        tone:       'warning',
        title:      `Orçamento de "${cat?.name ?? 'categoria'}" em ${pct.toFixed(0)}%`,
        body:       `Restam apenas ${fmt(budget.amount - spent)} do limite de ${fmt(budget.amount)}.`,
        navigateTo: 'budget',
      })
    }
  }

  // Taxa de poupança baixa
  const monthIncome  = store.entries.filter(e => e.kind === 'income'  && e.dueDate.startsWith(currentMonthKey)).reduce((s, e) => s + e.amount, 0)
  const monthExpense = store.entries.filter(e => e.kind === 'expense' && e.dueDate.startsWith(currentMonthKey)).reduce((s, e) => s + e.amount, 0)
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
