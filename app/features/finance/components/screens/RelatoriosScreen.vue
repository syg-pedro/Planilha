<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- Period selector -->
    <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">
      <BaseDropdown v-model="period" :height="38" style="min-width: 160px">
        <option value="month">Este mês</option>
        <option value="quarter">Últimos 3 meses</option>
        <option value="6months">Últimos 6 meses</option>
        <option value="year">Este ano</option>
      </BaseDropdown>

      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)"
        @click="exportCsv"
      >
        <BaseIcon name="export" :size="14" /> Exportar CSV
      </button>
    </div>

    <!-- KPIs -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px">
      <BaseKpiCard icon="income"  label="Total receitas" :value="fmt(kpis.income)"  color="var(--success)" />
      <BaseKpiCard icon="expense" label="Total despesas" :value="fmt(kpis.expense)" color="var(--danger)"  />
      <BaseKpiCard icon="balance" label="Saldo período"  :value="fmt(kpis.net)"     :color="kpis.net >= 0 ? 'var(--success)' : 'var(--danger)'" />
      <BaseKpiCard icon="goal"    label="Taxa poupança"  :value="fmtPct(kpis.savingsRate)" :color="kpis.savingsRate >= 20 ? 'var(--success)' : kpis.savingsRate >= 10 ? 'var(--warning)' : 'var(--danger)'" sub="Meta: 20%" />
    </div>

    <!-- Charts row -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px">

      <!-- Category breakdown -->
      <div class="neo-panel">
        <div class="neo-panel-header" style="padding: 14px 18px; border-bottom: 1px solid var(--border)">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Despesas por categoria</h3>
          <p style="font-size: 11px; color: var(--text3); margin-top: 2px">{{ periodLabel }}</p>
        </div>
        <div style="padding: 16px 18px">
          <BaseEmptyState v-if="categoryRows.length === 0" icon="expense" title="Sem despesas" body="Nenhuma despesa no período selecionado." />
          <div v-for="row in categoryRows" :key="row.id" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px">
            <span style="font-size: 12px; color: var(--text2); min-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ row.name }}</span>
            <div style="flex: 1; height: 7px; background: var(--bg2); border-radius: 99px; overflow: hidden">
              <div :style="{ width: `${row.pct}%`, height: '100%', background: row.color, borderRadius: '99px', transition: 'width 0.6s' }" />
            </div>
            <span style="font-size: 12px; font-weight: 700; color: var(--text); min-width: 72px; text-align: right">{{ fmt(row.amount) }}</span>
          </div>
        </div>
      </div>

      <!-- Monthly cashflow chart -->
      <div class="neo-panel">
        <div class="neo-panel-header" style="padding: 14px 18px; border-bottom: 1px solid var(--border)">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Comparativo mensal</h3>
          <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Receitas vs. despesas</p>
        </div>
        <div style="padding: 16px 18px">
          <BaseEmptyState v-if="cashflowChart.length === 0" icon="reports" title="Sem dados" body="Nenhum lançamento no período." />
          <BaseBarChart v-else :data="cashflowChart" :height="150" :currency="store.settings.currency || 'BRL'" />
        </div>
      </div>

      <!-- Per-person -->
      <div class="neo-panel">
        <div class="neo-panel-header" style="padding: 14px 18px; border-bottom: 1px solid var(--border)">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Por pessoa</h3>
          <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Saldo por titular da conta</p>
        </div>
        <div style="padding: 16px 18px; display: flex; flex-direction: column; gap: 16px">
          <BaseEmptyState v-if="personRows.length === 0" icon="income" title="Sem dados" body="Nenhum lançamento no período." />
          <div v-for="p in personRows" :key="p.name">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px">
              <span style="font-size: 13px; font-weight: 700; color: var(--text)">{{ p.name }}</span>
              <span style="font-size: 12px; font-weight: 700" :style="{ color: p.net >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(p.net) }}</span>
            </div>
            <div style="height: 7px; background: var(--bg2); border-radius: 99px; overflow: hidden">
              <div :style="{ width: `${Math.min(100, p.expense > 0 && p.income > 0 ? (p.expense / p.income) * 100 : p.expense > 0 ? 100 : 0)}%`, height: '100%', background: 'var(--primary)', borderRadius: '99px' }" />
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px">
              <span style="font-size: 10px; color: var(--text3)">Renda: {{ fmt(p.income) }}</span>
              <span style="font-size: 10px; color: var(--text3)">Despesa: {{ fmt(p.expense) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary table -->
    <div class="neo-panel">
      <div class="neo-panel-header" style="padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center">
        <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Resumo mensal</h3>
        <span style="font-size: 12px; color: var(--text3)">{{ cashflowChart.length }} meses</span>
      </div>
      <div style="overflow-x: auto">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px">
          <thead>
            <tr style="background: var(--surface2)">
              <th style="text-align: left; padding: 10px 18px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Mês</th>
              <th style="text-align: right; padding: 10px 18px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Receitas</th>
              <th style="text-align: right; padding: 10px 18px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Despesas</th>
              <th style="text-align: right; padding: 10px 18px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in cashflowTable"
              :key="row.month"
              :style="{ background: row.isCurrentMonth ? 'color-mix(in srgb, var(--primary) 6%, transparent)' : 'transparent', borderBottom: '1px solid var(--border)' }"
            >
              <td style="padding: 10px 18px; font-weight: 600; color: var(--text)">
                {{ row.label }}
                <span v-if="row.isCurrentMonth" style="font-size: 10px; font-weight: 700; color: var(--primary); margin-left: 6px; background: var(--primary-dim); padding: 1px 6px; border-radius: 99px">Atual</span>
              </td>
              <td style="padding: 10px 18px; text-align: right; color: var(--success); font-weight: 600">{{ fmt(row.income) }}</td>
              <td style="padding: 10px 18px; text-align: right; color: var(--danger);  font-weight: 600">{{ fmt(row.expense) }}</td>
              <td style="padding: 10px 18px; text-align: right; font-weight: 700" :style="{ color: row.net >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(row.net) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { buildCashflowSeries, buildCategoryBreakdown } from '#shared/finance'
import { parseIsoDate } from '#shared/date'
import BaseKpiCard    from '~/components/base/BaseKpiCard.vue'
import BaseBarChart   from '~/components/base/BaseBarChart.vue'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store  = useFinanceStore()
const currency = useCurrency()
const fmt = (v: number) => currency.format(v)
const fmtPct = (v: number) => `${v.toFixed(1)}%`

const period = ref<'month' | 'quarter' | '6months' | 'year'>('month')

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const now = new Date()
const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

const periodLabel = computed(() => {
  const labels = { month: 'Este mês', quarter: 'Últimos 3 meses', '6months': 'Últimos 6 meses', year: 'Este ano' }
  return labels[period.value]
})

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
