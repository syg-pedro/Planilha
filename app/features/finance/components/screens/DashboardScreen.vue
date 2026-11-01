<template>
<div class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-base font-semibold text-highlighted">Resumo de {{ currentMonthLabel }}</h2><p class="mt-1 text-xs text-muted">Valores cadastrados por {{ store.settings.periodMode === 'competence' ? 'competência' : 'vencimento' }}. Sobra prevista não é saldo bancário.</p></div><BaseButton variant="ghost" @click="$emit('navigate', 'planilha')">Abrir Planilha →</BaseButton></header>
    <section v-if="widgetOn('kpis')" class="months" aria-label="Sobra dos próximos meses">
      <div v-for="month in nextMonths" :key="month.key" class="months__item">
        <p class="text-xs text-muted">{{ month.label }}</p>
        <p class="months__net tabular-nums" :class="month.net < 0 ? 'text-error' : 'text-success'">{{ month.net < 0 ? 'Falta' : 'Sobra' }} {{ fmt(Math.abs(month.net)) }}</p>
        <p class="text-xs tabular-nums text-muted">{{ fmt(month.income) }} entram · {{ fmt(month.expense) }} saem</p>
      </div>
    </section>
    <UAlert
      v-if="overdueEntries.length"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      :title="overdueTitle"
      :actions="[{ label: 'Ver vencidas', color: 'neutral', variant: 'outline', to: overdueLink }]"
    />
    <div class="grid gap-4 xl:grid-cols-2">
      <UCard :ui="{ body: 'p-0 sm:p-0' }" class="min-w-0" title="Vence nos próximos 14 dias" :description="upcomingDescription">
        <BaseEmptyState v-if="!upcomingEntries.length" icon="check" title="Nada vencendo" body="Nenhuma conta pendente vence nos próximos 14 dias." />
        <div v-for="item in upcomingEntries.slice(0, 8)" :key="item.id" class="flex min-h-14 items-center gap-3 border-b border-default px-4 py-2 text-sm last:border-0">
          <NuxtLink :to="linkTo('planilha', { entry: item.id })" class="min-w-0 flex-1 rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
            <p class="font-medium text-highlighted">{{ item.title }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ accountName(item.accountId) }} · {{ fmtDate(item.dueDate) }} · <span :class="item.daysLeft <= 3 ? 'font-medium text-error' : ''">{{ tagLabel(item.daysLeft) }}</span></p>
          </NuxtLink>
          <strong class="text-sm tabular-nums text-default">{{ fmt(item.amount) }}</strong>
          <BaseButton variant="secondary" size="sm" :loading="paying === item.id" :disabled="Boolean(paying)" :aria-label="`Pagar ${item.title}`" @click="pay(item.id)">Pagar</BaseButton>
        </div>
        <template v-if="upcomingEntries.length > 8" #footer><NuxtLink :to="linkTo('planilha', { status: 'pending', view: 'list' })" class="text-sm text-primary">Ver todas na Planilha →</NuxtLink></template>
      </UCard>
      <UCard v-if="widgetOn('cashflow')" title="Fluxo de caixa" description="Últimos 6 meses · receitas e despesas cadastradas" class="min-w-0">
        <BaseEmptyState v-if="!cashflowData.some(item => item.income || item.expense)" icon="reports" title="Sem dados" body="Sem lançamentos nos últimos 6 meses." /><BaseBarChart v-else :data="cashflowData" :height="160" :currency="store.settings.currency || 'BRL'" />
      </UCard>
    </div>
    <UCard v-if="widgetOn('upcoming')" title="Pendente por quinzena" description="Vencimentos deste mês; benefícios e itens fora do cálculo não entram.">
      <dl class="cycles">
        <div v-for="cycle in cycles" :key="cycle.label">
          <dt class="text-xs text-muted">{{ cycle.label }}</dt>
          <dd class="cycles__value tabular-nums text-highlighted">{{ fmt(cycle.pendingTotal) }}</dd>
          <dd class="text-xs text-muted">{{ pendingLabel(cycle.pendingCount) }} · impacto previsto {{ fmt(cycle.projectedBalanceImpact) }}</dd>
        </div>
      </dl>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { buildCashflowSeries, computeKpis, excludeBenefitEntries } from '#shared/finance'
import { matrixDate, sumMoney } from '#shared/matrix'
import { financialToday } from './auxiliaryFinancialViews'
import { useFinanceNavigation } from '~/features/finance/composables/useFinanceNavigation'
import BaseBarChart    from '~/components/base/BaseBarChart.vue'
import BaseEmptyState  from '~/components/base/BaseEmptyState.vue'

defineEmits<{ navigate: [screen: string] }>()

const store    = useFinanceStore()
const { linkTo } = useFinanceNavigation()
const widgetOn = (id: string) => (store.settings.dashboardConfig.visibleWidgets ?? []).includes(id)
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)
const fmtDate  = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const today = financialToday(store.settings.timezone)
const currentMKey = today.slice(0, 7)
const calendarNow = new Date(`${currentMKey}-01T12:00:00Z`)
const currentMonthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${currentMKey}-01T12:00:00Z`))
const cashEntries = computed(() => excludeBenefitEntries(store.entries, store.accounts))

// ── Fluxo de caixa (últimos 6 meses) ─────────────────────────
const cashflowData = computed(() => {
  const sixMonthsAgo = new Date(Date.UTC(calendarNow.getUTCFullYear(), calendarNow.getUTCMonth() - 5, 1))
  const recent       = cashEntries.value.filter(e => new Date(matrixDate(e, store.settings.periodMode) + 'T00:00:00Z') >= sixMonthsAgo)
  const series       = buildCashflowSeries(recent, store.settings.periodMode)
  const valuesByMonth = new Map(series.map(item => [item.month, item]))
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(calendarNow.getUTCFullYear(), calendarNow.getUTCMonth() - 5 + index, 1))
    return date.toISOString().slice(0, 7)
  })

  return months.map((month) => {
    const value = valuesByMonth.get(month)
    return {
      month: MONTH_NAMES[parseInt(month.slice(5)) - 1] ?? month.slice(5),
      income: value?.income ?? 0,
      expense: value?.expense ?? 0,
      current: month === currentMKey
    }
  })
})

// ── Pendências para resolver ─────────────────────────────────────
const pendingLabel = (count: number) => `${count} ${count === 1 ? 'conta pendente' : 'contas pendentes'}`
const upcomingTotal = computed(() => sumMoney(upcomingEntries.value.map(entry => entry.amount)))
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`
const overdueEntries = computed(() => cashEntries.value
  .filter(e => e.kind === 'expense' && e.status !== 'paid' && e.dueDate < today)
  .sort((a, b) => a.dueDate.localeCompare(b.dueDate)))
const overdueTotal = computed(() => sumMoney(overdueEntries.value.map(entry => entry.amount)))
const overdueTitle = computed(() => `${plural(overdueEntries.value.length, 'conta vencida', 'contas vencidas')} sem pagamento · ${fmt(overdueTotal.value)}`)
const overdueLink = computed(() => linkTo('planilha', { status: 'pending', view: 'list', range: 'year', month: overdueEntries.value[0]?.dueDate.slice(0, 7) ?? currentMKey }))
const upcomingDescription = computed(() => upcomingEntries.value.length ? `${plural(upcomingEntries.value.length, 'conta', 'contas')} · ${fmt(upcomingTotal.value)}` : undefined)
const upcomingEntries = computed(() => {
  const todayStr = today
  const in14 = new Date(`${todayStr}T12:00:00Z`); in14.setUTCDate(in14.getUTCDate() + 14)
  const in14Str  = in14.toISOString().slice(0, 10)
  return cashEntries.value
    .filter(e => e.kind === 'expense' && e.status !== 'paid' && e.dueDate >= today && e.dueDate <= in14Str)
    .map(e => ({
      ...e,
      daysLeft: Math.ceil((new Date(e.dueDate + 'T00:00:00Z').getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000)
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
})

const tagLabel = (daysLeft: number) =>
  daysLeft < 0 ? 'Vencido' : daysLeft === 0 ? 'Hoje' : daysLeft <= 3 ? 'Urgente' : daysLeft <= 7 ? 'Esta semana' : `${daysLeft}d`

const accountName = (id: string | null) =>
  (id ? store.accountMap.get(id)?.name : undefined) ?? 'Sem conta'

const firstPaymentCycle = computed(() => store.expensePaymentCycles.find(cycle => cycle.id === 'first-half') ?? { pendingTotal: 0, pendingCount: 0, projectedBalanceImpact: 0, endDay: 15 })
const secondPaymentCycle = computed(() => store.expensePaymentCycles.find(cycle => cycle.id === 'second-half') ?? { pendingTotal: 0, pendingCount: 0, projectedBalanceImpact: 0, endDay: 30 })
const cycles = computed(() => [
  { label: 'Dias 1 a 15', ...firstPaymentCycle.value },
  { label: `Dias 16 a ${secondPaymentCycle.value.endDay}`, ...secondPaymentCycle.value },
])

// ── Sobra do mês atual e dos dois seguintes ───────────────────
const nextMonths = computed(() => [0, 1, 2].map((offset) => {
  const date = new Date(Date.UTC(calendarNow.getUTCFullYear(), calendarNow.getUTCMonth() + offset, 1))
  const key = date.toISOString().slice(0, 7)
  const kpis = computeKpis(cashEntries.value.filter(entry => matrixDate(entry, store.settings.periodMode).startsWith(key)), store.accounts)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(date)
  return { key, label: offset === 0 ? `${label} (este mês)` : label, income: kpis.totalIncome, expense: kpis.totalExpense, net: kpis.net }
}))

// ── Pagar direto do Resumo, com desfazer ──────────────────────
const toast = useToast()
const paying = ref<string | null>(null)
async function pay(id: string) {
  const entry = store.entries.find(item => item.id === id)
  if (!entry || paying.value) return
  paying.value = id
  try {
    await store.saveEntriesBatch({ upserts: [{ ...entry, status: 'paid' }], deletes: [] })
    toast.add({
      title: `${entry.title} marcado como pago`, color: 'success', icon: 'i-lucide-circle-check', duration: 6500,
      actions: [{ label: 'Desfazer', color: 'neutral', variant: 'outline', onClick: () => { void store.saveEntriesBatch({ upserts: [entry], deletes: [] }) } }],
    })
  } catch {
    toast.add({ title: 'Não foi possível salvar. Confira a conexão e tente de novo.', color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    paying.value = null
  }
}
</script>

<style scoped>
.months { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ds-space-3); }
.months__item { padding: var(--ds-space-4) var(--ds-space-5); border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.months__item:first-child { border-color: var(--border-strong); }
.months__item p:first-child::first-letter { text-transform: uppercase; }
.months__item p { margin: 0; }
.months__net { margin: 2px 0 !important; font-size: 1.25rem; font-weight: 700; }
.cycles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ds-space-6); margin: 0; }
.cycles dd { margin: 0; }
.cycles__value { font-size: 1.125rem; font-weight: 600; }
@media (max-width: 640px) {
  .months { grid-template-columns: 1fr; }
}
</style>
