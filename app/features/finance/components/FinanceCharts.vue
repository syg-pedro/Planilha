<template>
  <div class="space-y-4">
    <div class="grid gap-4 lg:grid-cols-2"><UCard title="Fluxo de caixa" description="Últimos meses e próximos vencimentos"><BaseBarChart :data="cashflowData" :height="180" /><div class="mt-4 flex flex-wrap justify-between gap-3 text-xs"><div v-for="row in cashflowData" :key="row.month"><p class="text-muted">{{ row.month }}</p><strong class="tabular-nums" :class="row.income - row.expense >= 0 ? 'text-success' : 'text-error'">{{ fmt(row.income - row.expense) }}</strong></div></div></UCard><UCard title="Despesas por categoria" :description="`Total: ${fmt(store.monthlyKpis.totalExpense)}`"><UChart v-if="donutSegments.length" type="donut" :data="donutSegments" index="label" :categories="['value']" :colors="donutSegments.map(row => row.color)" :height="220" :format="fmt" aria-label="Despesas por categoria"><template #center><span class="text-xs text-muted">Total</span><strong class="text-sm font-semibold text-highlighted">{{ fmtShort(store.monthlyKpis.totalExpense) }}</strong></template></UChart><p v-else class="text-sm text-muted">Sem dados de despesas</p></UCard></div>
    <UCard title="Utilização dos cartões de crédito" description="Limite total e utilizado"><div class="space-y-4"><div v-for="card in cardLimits" :key="card.id"><div class="mb-2 flex flex-wrap justify-between gap-2 text-sm"><strong class="font-medium text-highlighted">{{ card.name }}</strong><span class="text-muted">{{ fmt(card.spent) }} / {{ fmt(card.limit) }}</span></div><UProgress :model-value="card.pct" :color="card.pct > 80 ? 'error' : card.pct > 60 ? 'warning' : 'primary'" :aria-label="`Utilização de ${card.name}`" /><div class="mt-2 flex justify-between text-xs text-muted"><span>Vence dia {{ card.dueDay || '—' }}</span><strong>{{ card.pct.toFixed(1) }}%</strong></div></div><p v-if="!cardLimits.length" class="text-sm text-muted">Nenhum cartão com limite cadastrado.</p></div></UCard>
    <UCard title="Próximos vencimentos" :description="`${upcomingEntries.length} despesa(s) pendente(s), ordenada(s) por data`" :ui="{ body: 'p-0 sm:p-0' }"><UTable :data="upcomingEntries" :columns="upcomingColumns" empty="Nenhum vencimento próximo"><template #dueDate-cell="{ row }">{{ fmtDateBR(row.original.dueDate) }}</template><template #title-cell="{ row }">{{ row.original.title }}<span v-if="row.original.installmentIndex" class="ml-2 text-xs text-muted">{{ row.original.installmentIndex }}/{{ row.original.installmentTotal }}</span></template><template #accountId-cell="{ row }">{{ store.accountMap.get(row.original.accountId || '')?.name || '—' }}</template><template #amount-cell="{ row }"><strong class="tabular-nums text-error">{{ fmt(row.original.amount) }}</strong></template><template #urgency-cell="{ row }"><UBadge :color="urgency(row.original.dueDate).color === 'var(--danger)' ? 'error' : urgency(row.original.dueDate).color === 'var(--warning)' ? 'warning' : 'primary'" variant="subtle">{{ urgency(row.original.dueDate).label }}</UBadge></template></UTable></UCard>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'

const store = useFinanceStore()
const currency = useCurrency()

const fmt = (v: number) => currency.format(v)
const fmtShort = (v: number) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return currency.format(v)
}

const fmtDateBR = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const cashflowData = computed(() => store.chartData.cashflow.slice(-6))


const donutSegments = computed(() => {
  const catBreakdown = store.chartData.category
  const data = Object.entries(catBreakdown)
    .map(([catId, val]) => ({
      name: store.categoryMap.get(catId)?.name ?? 'Outros',
      value: val as number,
      color: store.categoryMap.get(catId)?.color ?? 'var(--ui-text-muted)'
    }))
    .filter(d => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return []

  const radius = 70
  const cx = 90
  const cy = 90
  let cumAngle = -90

  return data.map((d) => {
    const pct = d.value / total
    const angle = pct * 360
    const start = cumAngle
    cumAngle += angle
    const startRad = (start * Math.PI) / 180
    const endRad = ((start + angle) * Math.PI) / 180
    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)
    const large = angle > 180 ? 1 : 0
    return {
      d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`,
      color: d.color,
      label: d.name,
      value: d.value,
      pct
    }
  })
})

const cardLimits = computed(() => {
  const spendByCard: Record<string, number> = {}
  store.entries.forEach(e => {
    if (e.kind === 'expense' && e.accountId) {
      spendByCard[e.accountId] = (spendByCard[e.accountId] || 0) + e.amount
    }
  })
  return store.accounts
    .filter(a => a.type === 'credit_card' && a.limitTotal)
    .map(a => {
      const spent = spendByCard[a.id] || 0
      const pct = Math.min(100, (spent / (a.limitTotal ?? 1)) * 100)
      return { id: a.id, name: a.name, spent, limit: a.limitTotal ?? 0, pct, dueDay: a.dueDay }
    })
})

const upcomingColumns = [{ accessorKey: 'dueDate', header: 'Vencimento' }, { accessorKey: 'title', header: 'Descrição' }, { accessorKey: 'accountId', header: 'Conta' }, { accessorKey: 'amount', header: 'Valor' }, { id: 'urgency', header: 'Urgência' }]

const upcomingEntries = computed(() => {
  const now = new Date()
  return [...store.entries]
    .filter(e => e.kind === 'expense' && e.status !== 'paid' && new Date(e.dueDate + 'T00:00:00') >= now)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8)
})

const urgency = (dueDate: string) => {
  const days = Math.ceil((new Date(dueDate + 'T00:00:00').getTime() - new Date().getTime()) / 86400000)
  if (days <= 3) return { label: 'Urgente', bg: 'var(--danger-light)', color: 'var(--danger)' }
  if (days <= 7) return { label: 'Esta semana', bg: 'var(--warning-light)', color: 'var(--warning)' }
  return { label: 'OK', bg: 'var(--primary-light)', color: 'var(--primary)' }
}
</script>
