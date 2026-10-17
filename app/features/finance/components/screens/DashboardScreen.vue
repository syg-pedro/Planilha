<template>
<div class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-base font-semibold text-highlighted">Resumo de {{ currentMonthLabel }}</h2><p class="mt-1 text-xs text-muted">Valores cadastrados por {{ store.settings.periodMode === 'competence' ? 'competência' : 'vencimento' }}. Sobra prevista não é saldo bancário.</p></div><BaseButton variant="ghost" @click="$emit('navigate', 'planilha')">Abrir Planilha →</BaseButton></header>
    <div v-if="widgetOn('kpis')" class="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <BaseKpiCard icon="income" label="Receitas previstas" :value="fmt(monthKpis.totalIncome)" color="var(--success)" />
      <BaseKpiCard icon="expense" label="Despesas previstas" :value="fmt(monthKpis.totalExpense)" color="var(--danger)" />
      <BaseKpiCard class="col-span-2 lg:col-span-1" icon="balance" label="Sobra prevista" :value="fmt(monthKpis.net)" :color="monthKpis.net < 0 ? 'var(--danger)' : 'var(--primary)'" sub="Receitas menos despesas cadastradas" />
    </div>
    <div class="grid gap-4 xl:grid-cols-2">
      <UCard :ui="{ body: 'p-0 sm:p-0' }" class="min-w-0" title="Pendências para resolver" :description="`${upcomingEntries.length} lançamento(s) vencido(s) ou vencendo nos próximos 14 dias`">
        <BaseEmptyState v-if="!upcomingEntries.length" icon="check" title="Sem pendências próximas" body="Não há despesas vencidas ou vencendo nos próximos 14 dias." />
        <NuxtLink v-for="item in upcomingEntries.slice(0, 6)" :key="item.id" :to="linkTo('planilha', { entry: item.id })" class="flex min-h-14 flex-wrap items-center gap-3 border-b border-default px-4 py-2 text-sm last:border-0 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary">
          <div class="min-w-0 flex-1"><p class="font-medium text-highlighted">{{ item.title }}</p><p class="mt-0.5 text-xs text-muted">{{ accountName(item.accountId) }} · {{ fmtDate(item.dueDate) }}</p></div><strong class="text-xs tabular-nums text-default">{{ fmt(item.amount) }}</strong><UBadge :color="item.daysLeft <= 3 ? 'error' : item.daysLeft <= 7 ? 'warning' : 'neutral'" variant="subtle" size="xs">{{ tagLabel(item.daysLeft) }}</UBadge>
        </NuxtLink>
        <template v-if="upcomingEntries.length > 6" #footer><NuxtLink :to="linkTo('planilha', { status: 'pending', view: 'list' })" class="text-sm text-primary">Ver todas na Planilha →</NuxtLink></template>
      </UCard>
      <UCard v-if="widgetOn('cashflow')" title="Fluxo de caixa" description="Últimos 6 meses · receitas e despesas cadastradas" class="min-w-0">
        <BaseEmptyState v-if="!cashflowData.some(item => item.income || item.expense)" icon="reports" title="Sem dados" body="Sem lançamentos nos últimos 6 meses." /><BaseBarChart v-else :data="cashflowData" :height="160" :currency="store.settings.currency || 'BRL'" />
      </UCard>
    </div>
    <UCard v-if="widgetOn('upcoming')" title="Despesas pendentes por ciclo" description="Vencimentos deste mês; benefícios e itens fora do cálculo não entram.">
      <div class="grid grid-cols-2 gap-3"><BaseKpiCard icon="calendar" label="1º ciclo · dias 1 a 15" :value="fmt(firstPaymentCycle.pendingTotal)" color="var(--warning)" :sub="`${firstPaymentCycle.pendingCount} conta(s) pendente(s)`" :detail="`Impacto previsto: ${fmt(firstPaymentCycle.projectedBalanceImpact)}`" /><BaseKpiCard icon="calendar" :label="`2º ciclo · dias 16 a ${secondPaymentCycle.endDay}`" :value="fmt(secondPaymentCycle.pendingTotal)" color="var(--warning)" :sub="`${secondPaymentCycle.pendingCount} conta(s) pendente(s)`" :detail="`Impacto previsto: ${fmt(secondPaymentCycle.projectedBalanceImpact)}`" /></div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { buildCashflowSeries, computeKpis, excludeBenefitEntries } from '#shared/finance'
import { matrixDate } from '#shared/matrix'
import { financialToday } from './auxiliaryFinancialViews'
import { useFinanceNavigation } from '~/features/finance/composables/useFinanceNavigation'
import BaseKpiCard     from '~/components/base/BaseKpiCard.vue'
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
const monthKpis = computed(() => computeKpis(cashEntries.value.filter(entry => matrixDate(entry, store.settings.periodMode).startsWith(currentMKey)), store.accounts))

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
const upcomingEntries = computed(() => {
  const todayStr = today
  const in14 = new Date(`${todayStr}T12:00:00Z`); in14.setUTCDate(in14.getUTCDate() + 14)
  const in14Str  = in14.toISOString().slice(0, 10)
  return cashEntries.value
    .filter(e => e.kind === 'expense' && e.status !== 'paid' && e.dueDate <= in14Str)
    .map(e => ({
      ...e,
      daysLeft: Math.ceil((new Date(e.dueDate + 'T00:00:00Z').getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000)
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
})

const tagLabel = (daysLeft: number) =>
  daysLeft < 0 ? 'Vencido' : daysLeft === 0 ? 'Hoje' : daysLeft <= 3 ? 'Urgente' : daysLeft <= 7 ? 'Esta semana' : `${daysLeft}d`

const accountName = (id: string | null) =>
  id ? (store.accountMap.get(id)?.name ?? '—') : '—'

const firstPaymentCycle = computed(() => store.expensePaymentCycles.find(cycle => cycle.id === 'first-half') ?? { pendingTotal: 0, pendingCount: 0, projectedBalanceImpact: 0, endDay: 15 })
const secondPaymentCycle = computed(() => store.expensePaymentCycles.find(cycle => cycle.id === 'second-half') ?? { pendingTotal: 0, pendingCount: 0, projectedBalanceImpact: 0, endDay: 30 })
</script>
