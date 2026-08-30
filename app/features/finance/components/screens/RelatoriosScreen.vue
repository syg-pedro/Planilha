<template>
  <div class="rep">

    <!-- Seletor de período (segmentado) -->
    <div class="rep__periods" role="group" aria-label="Período do relatório">
      <button
        v-for="opt in PERIOD_OPTIONS"
        :key="opt.id"
        type="button"
        class="rep__seg"
        :class="{ 'rep__seg--active': period === opt.id }"
        :aria-pressed="period === opt.id"
        @click="period = opt.id"
      >
        {{ opt.short }}
      </button>
    </div>

    <!-- KPIs -->
    <div class="rep__kpis">
      <div class="rep__kpi">
        <p class="rep__kpi-label">Receita total</p>
        <p class="rep__kpi-value ds-money" style="color: var(--success)">{{ fmt(kpis.income) }}</p>
      </div>
      <div class="rep__kpi">
        <p class="rep__kpi-label">Despesa total</p>
        <p class="rep__kpi-value ds-money" style="color: var(--danger)">{{ fmt(kpis.expense) }}</p>
      </div>
      <div class="rep__kpi">
        <p class="rep__kpi-label">Saldo</p>
        <p class="rep__kpi-value ds-money" :style="{ color: kpis.net >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(kpis.net) }}</p>
      </div>
      <div class="rep__kpi">
        <p class="rep__kpi-label">Taxa poupança</p>
        <p class="rep__kpi-value ds-money" :style="{ color: savingsColor }">{{ fmtPct(kpis.savingsRate) }}</p>
      </div>
    </div>

    <!-- Categorias + Por pessoa -->
    <div class="rep__row">

      <section class="neo-panel">
        <header class="neo-panel-header rep__panel-head">
          <h3 class="rep__panel-title">Despesas por categoria</h3>
          <p class="rep__panel-sub">{{ periodLabel }}</p>
        </header>
        <BaseEmptyState v-if="categoryRows.length === 0" icon="expense" title="Sem despesas" body="Nenhuma despesa no período selecionado." />
        <div v-else class="rep__cats">
          <div v-for="row in categoryRows" :key="row.id" class="rep__cat">
            <div class="rep__cat-head">
              <span class="rep__cat-name">{{ row.name }}</span>
              <span class="rep__cat-figure ds-money">{{ fmt(row.amount) }} · {{ Math.round(row.pct) }}%</span>
            </div>
            <div class="rep__bar">
              <div class="rep__bar-fill" :style="{ width: `${Math.min(100, row.pct)}%`, background: row.color }" />
            </div>
          </div>
        </div>
      </section>

      <section class="neo-panel rep__people">
        <header class="neo-panel-header rep__panel-head">
          <h3 class="rep__panel-title">Por pessoa</h3>
          <p class="rep__panel-sub">Saldo por titular da conta</p>
        </header>
        <BaseEmptyState v-if="personRows.length === 0" icon="income" title="Sem dados" body="Nenhum lançamento no período." />
        <template v-else>
          <div v-for="p in personRows" :key="p.name" class="rep__person">
            <span class="rep__person-name">{{ p.name }}</span>
            <span class="rep__person-value ds-money" :style="{ color: p.net >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(p.net) }}</span>
          </div>
        </template>
        <button type="button" class="rep__export" @click="exportCsv">Exportar CSV</button>
      </section>
    </div>

    <!-- Comparativo mensal -->
    <section class="neo-panel">
      <header class="neo-panel-header rep__panel-head">
        <h3 class="rep__panel-title">Comparativo mensal</h3>
        <p class="rep__panel-sub">Receitas vs. despesas</p>
      </header>
      <div class="rep__chart">
        <BaseEmptyState v-if="cashflowChart.length === 0" icon="reports" title="Sem dados" body="Nenhum lançamento no período." />
        <BaseBarChart v-else :data="cashflowChart" :height="150" :currency="store.settings.currency || 'BRL'" />
      </div>
    </section>

    <!-- Resumo mensal -->
    <section class="neo-panel">
      <header class="neo-panel-header rep__panel-head rep__panel-head--row">
        <h3 class="rep__panel-title">Resumo mensal</h3>
        <span class="rep__count">{{ cashflowChart.length }} meses</span>
      </header>
      <div class="rep__table-wrap">
        <table class="rep__table">
          <thead>
            <tr>
              <th class="rep__th">Mês</th>
              <th class="rep__th rep__th--right">Receitas</th>
              <th class="rep__th rep__th--right">Despesas</th>
              <th class="rep__th rep__th--right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in cashflowTable"
              :key="row.month"
              class="rep__tr"
              :class="{ 'rep__tr--current': row.isCurrentMonth }"
            >
              <td class="rep__td rep__td--label">
                {{ row.label }}
                <span v-if="row.isCurrentMonth" class="rep__tag">Atual</span>
              </td>
              <td class="rep__td rep__td--right ds-money" style="color: var(--success)">{{ fmt(row.income) }}</td>
              <td class="rep__td rep__td--right ds-money" style="color: var(--danger)">{{ fmt(row.expense) }}</td>
              <td class="rep__td rep__td--right ds-money" :style="{ color: row.net >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(row.net) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { buildCashflowSeries, buildCategoryBreakdown } from '#shared/finance'
import { parseIsoDate } from '#shared/date'
import BaseBarChart   from '~/components/base/BaseBarChart.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

type ReportPeriod = 'month' | 'quarter' | '6months' | 'year'

const store  = useFinanceStore()
const currency = useCurrency()
const fmt = (v: number) => currency.format(v)
const fmtPct = (v: number) => `${v.toFixed(1)}%`

const period = ref<ReportPeriod>('month')

const PERIOD_OPTIONS: { id: ReportPeriod; short: string; label: string }[] = [
  { id: 'month',    short: 'Mês',      label: 'Este mês' },
  { id: 'quarter',  short: '3 meses',  label: 'Últimos 3 meses' },
  { id: '6months',  short: '6 meses',  label: 'Últimos 6 meses' },
  { id: 'year',     short: 'Ano',      label: 'Este ano' },
]

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const now = new Date()
const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

const periodLabel = computed(() =>
  PERIOD_OPTIONS.find(o => o.id === period.value)?.label ?? ''
)

const filteredEntries = computed(() => {
  const entries = store.entries
  const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  if (period.value === 'month') {
    const key = currentMonthKey
    return entries.filter(e => e.dueDate.startsWith(key))
  }
  if (period.value === 'quarter') {
    const start = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth() - 2, 1))
    return entries.filter(e => parseIsoDate(e.dueDate) >= start)
  }
  if (period.value === '6months') {
    const start = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth() - 5, 1))
    return entries.filter(e => parseIsoDate(e.dueDate) >= start)
  }
  // year
  const yearStart = `${now.getUTCFullYear()}-01`
  return entries.filter(e => e.dueDate >= yearStart)
})

const kpis = computed(() => {
  const entries = filteredEntries.value
  const income  = entries.filter(e => e.kind === 'income').reduce((s, e) => s + e.amount, 0)
  const expense = entries.filter(e => e.kind === 'expense').reduce((s, e) => s + e.amount, 0)
  const net     = income - expense
  return { income, expense, net, savingsRate: income > 0 ? (net / income) * 100 : 0 }
})

const savingsColor = computed(() =>
  kpis.value.savingsRate >= 20
    ? 'var(--success)'
    : kpis.value.savingsRate >= 10
      ? 'var(--warning)'
      : 'var(--danger)'
)

const categoryRows = computed(() => {
  const breakdown = buildCategoryBreakdown(filteredEntries.value)
  const total     = Object.values(breakdown).reduce((s, v) => s + v, 0)
  if (total === 0) return []
  return Object.entries(breakdown)
    .map(([catId, amount]) => {
      const cat = store.categoryMap.get(catId)
      return {
        id:     catId,
        name:   cat?.name  ?? 'Sem categoria',
        color:  cat?.color ?? 'var(--primary)',
        amount,
        pct:    (amount / total) * 100
      }
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
})

const cashflowChart = computed(() => {
  const series = buildCashflowSeries(filteredEntries.value, store.settings.periodMode)
  return series.map(s => ({
    month:   MONTH_NAMES[parseInt(s.month.slice(5)) - 1] ?? s.month.slice(5),
    income:  s.income,
    expense: s.expense,
    current: s.month === currentMonthKey
  }))
})

const cashflowTable = computed(() => {
  const series = buildCashflowSeries(filteredEntries.value, store.settings.periodMode)
  return series.map(s => {
    const [y, m] = s.month.split('-')
    return {
      month:          s.month,
      label:          `${MONTH_FULL[parseInt(m!) - 1]} ${y}`,
      income:         s.income,
      expense:        s.expense,
      net:            s.net,
      isCurrentMonth: s.month === currentMonthKey
    }
  }).reverse()
})

const personRows = computed(() => {
  const map = new Map<string, { income: number; expense: number }>()
  for (const entry of filteredEntries.value) {
    const account = entry.accountId ? store.accountMap.get(entry.accountId) : null
    const owner = account?.owner ?? 'Sem titular'
    const cur = map.get(owner) ?? { income: 0, expense: 0 }
    if (entry.kind === 'income') cur.income += entry.amount
    else cur.expense += entry.amount
    map.set(owner, cur)
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v, net: v.income - v.expense }))
    .sort((a, b) => b.income - a.income)
})

const exportCsv = () => {
  const rows = [['Mês', 'Receitas', 'Despesas', 'Saldo']]
  for (const row of cashflowTable.value) {
    rows.push([row.label, String(row.income.toFixed(2)), String(row.expense.toFixed(2)), String(row.net.toFixed(2))])
  }
  const csv  = rows.map(r => r.join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'relatorio.csv'; a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.rep {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Períodos ──────────────────────────────────────────────── */
.rep__periods {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rep__seg {
  padding: 7px 14px;
  color: var(--text2);
  font-family: inherit;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.rep__seg--active {
  color: var(--on-primary);
  background: var(--primary);
}

.rep__seg:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

/* ── KPIs ──────────────────────────────────────────────────── */
.rep__kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.rep__kpi {
  min-width: 0;
  padding: 13px 15px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--shadow-sm);
}

.rep__kpi-label {
  margin-bottom: 4px;
  color: var(--text3);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.rep__kpi-value {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.1;
}

/* ── Linha categorias / pessoas ────────────────────────────── */
.rep__row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  align-items: start;
}

.rep__panel-head {
  padding: 13px 16px;
}

.rep__panel-head--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.rep__panel-title {
  color: var(--text);
  font-size: 13.5px;
  font-weight: 800;
}

.rep__panel-sub {
  margin-top: 2px;
  color: var(--text3);
  font-size: 10.5px;
}

.rep__count {
  color: var(--text3);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.rep__cats {
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding: 18px;
}

.rep__cat-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 5px;
}

.rep__cat-name {
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rep__cat-figure {
  color: var(--text2);
  font-size: 12.5px;
  white-space: nowrap;
}

.rep__bar {
  height: 9px;
  overflow: hidden;
  background: var(--track);
  border-radius: var(--radius-pill);
}

.rep__bar-fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition: width 0.45s steps(8, end);
}

.rep__people {
  display: flex;
  flex-direction: column;
}

.rep__person {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--border);
}

.rep__person-name {
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rep__person-value {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.rep__export {
  width: 100%;
  padding: 12px;
  color: var(--primary);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 800;
  background: transparent;
  border: none;
  cursor: pointer;
}

.rep__export:active {
  transform: translate(1px, 1px);
}

/* ── Comparativo mensal ────────────────────────────────────── */
.rep__chart {
  padding: 18px;
}

/* ── Resumo mensal ─────────────────────────────────────────── */
.rep__table-wrap {
  overflow-x: auto;
}

.rep__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.rep__th {
  padding: 10px 16px;
  color: var(--text3);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  background: var(--surface2);
  border-bottom: var(--border-width) solid var(--border);
}

.rep__th--right {
  text-align: right;
}

.rep__tr {
  border-bottom: 1px solid var(--border);
}

.rep__tr--current {
  background: var(--primary-dim);
}

.rep__td {
  padding: 10px 16px;
  color: var(--text2);
  font-size: 12.5px;
}

.rep__td--label {
  color: var(--text);
  font-weight: 700;
}

.rep__td--right {
  font-weight: 700;
  text-align: right;
}

.rep__tag {
  margin-left: 6px;
  padding: 1px 8px;
  color: var(--on-primary);
  font-size: 9.5px;
  font-weight: 800;
  background: var(--primary);
  border-radius: var(--radius-pill);
}

@media (max-width: 900px) {
  .rep__row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .rep {
    gap: 14px;
  }

  .rep__periods {
    gap: 6px;
  }

  .rep__seg {
    padding: 7px 12px;
    font-size: 11.5px;
  }

  .rep__kpis {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .rep__kpi {
    padding: 11px 13px;
    box-shadow: var(--shadow-xs);
  }

  .rep__kpi-label {
    margin-bottom: 3px;
    font-size: 9px;
    letter-spacing: 0.07em;
  }

  .rep__kpi-value {
    font-size: 15px;
  }

  .rep__panel-head {
    padding: 12px 14px;
  }

  .rep__panel-title {
    font-size: 13px;
  }

  .rep__cats {
    gap: 11px;
    padding: 14px;
  }

  .rep__cat-head {
    margin-bottom: 4px;
  }

  .rep__cat-name {
    font-size: 12px;
  }

  .rep__cat-figure {
    font-size: 12px;
    font-weight: 700;
  }

  .rep__bar {
    height: 8px;
  }

  .rep__person {
    padding: 11px 14px;
  }

  .rep__person-name {
    font-size: 12.5px;
  }

  .rep__chart {
    padding: 14px;
  }

  .rep__th,
  .rep__td {
    padding: 9px 12px;
  }
}
</style>
