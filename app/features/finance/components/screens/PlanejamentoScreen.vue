<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- KPIs anuais -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px">
      <BaseKpiCard icon="income"   label="Receita anual projetada"  :value="fmt(annualKpis.projectedIncome)"  color="var(--success)" />
      <BaseKpiCard icon="expense"  label="Despesa anual projetada"  :value="fmt(annualKpis.projectedExpense)" color="var(--warning)" />
      <BaseKpiCard icon="balance"  label="Saldo anual projetado"    :value="fmt(annualKpis.projectedNet)"     :color="annualKpis.projectedNet >= 0 ? 'var(--success)' : 'var(--danger)'" />
      <BaseKpiCard icon="warning"  label="Meses de risco"           :value="`${annualKpis.riskMonths} meses`" color="var(--danger)" sub="Despesa > Receita" />
    </div>

    <!-- Tabela anual -->
    <div class="neo-panel">
      <div class="neo-panel-header" style="padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px">
        <div>
          <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Planejamento {{ year }}</h3>
          <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Receitas, despesas e saldo por mês</p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center">
          <button
            style="display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-xs); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)"
            @click="year--"
          >
            <BaseIcon name="chevron_down" :size="12" style="transform: rotate(90deg)" />
          </button>
          <span style="font-size: 14px; font-weight: 700; color: var(--text); min-width: 40px; text-align: center">{{ year }}</span>
          <button
            style="display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-xs); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)"
            @click="year++"
          >
            <BaseIcon name="chevron_down" :size="12" style="transform: rotate(-90deg)" />
          </button>
        </div>
      </div>
      <div style="overflow-x: auto">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; min-width: 640px">
          <thead>
            <tr style="background: var(--surface2)">
              <th style="text-align: left; padding: 10px 18px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Mês</th>
              <th style="text-align: right; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Receitas</th>
              <th style="text-align: right; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Despesas</th>
              <th style="text-align: right; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Saldo</th>
              <th style="text-align: right; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Acumulado</th>
              <th style="text-align: center; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in yearRows"
              :key="row.month"
              :style="{
                borderBottom: '1px solid var(--border)',
                background: row.isCurrentMonth
                  ? 'color-mix(in srgb, var(--primary) 6%, transparent)'
                  : row.net < 0
                    ? 'color-mix(in srgb, var(--danger) 4%, transparent)'
                    : 'transparent'
              }"
            >
              <td style="padding: 10px 18px; font-weight: 600; color: var(--text)">
                {{ row.label }}
                <span v-if="row.isCurrentMonth" style="font-size: 10px; font-weight: 700; color: var(--primary); margin-left: 6px; background: var(--primary-dim); padding: 1px 6px; border-radius: 99px">Atual</span>
              </td>
              <td style="padding: 10px 14px; text-align: right; color: var(--success); font-weight: 600">
                {{ row.income > 0 ? fmt(row.income) : '—' }}
              </td>
              <td style="padding: 10px 14px; text-align: right; color: var(--danger); font-weight: 600">
                {{ row.expense > 0 ? fmt(row.expense) : '—' }}
              </td>
              <td style="padding: 10px 14px; text-align: right; font-weight: 700" :style="{ color: row.net >= 0 ? 'var(--success)' : 'var(--danger)' }">
                {{ row.income > 0 || row.expense > 0 ? fmt(row.net) : '—' }}
              </td>
              <td style="padding: 10px 14px; text-align: right; font-weight: 700" :style="{ color: row.accumulated >= 0 ? 'var(--text2)' : 'var(--danger)' }">
                {{ row.income > 0 || row.expense > 0 ? fmt(row.accumulated) : '—' }}
              </td>
              <td style="padding: 10px 14px; text-align: center">
                <span
                  v-if="row.income > 0 || row.expense > 0"
                  :style="{
                    fontSize: '10px', fontWeight: 700,
                    padding: '2px 8px', borderRadius: '99px',
                    background: row.net < 0 ? 'color-mix(in srgb, var(--danger) 14%, transparent)' : 'color-mix(in srgb, var(--success) 14%, transparent)',
                    color: row.net < 0 ? 'var(--danger)' : 'var(--success)'
                  }"
                >
                  {{ row.net < 0 ? 'Déficit' : 'Superávit' }}
                </span>
                <span v-else style="font-size: 11px; color: var(--text3)">—</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="background: var(--surface2); border-top: 2px solid var(--border)">
              <td style="padding: 10px 18px; font-weight: 800; color: var(--text)">Total {{ year }}</td>
              <td style="padding: 10px 14px; text-align: right; color: var(--success); font-weight: 800">{{ fmt(annualKpis.totalIncome) }}</td>
              <td style="padding: 10px 14px; text-align: right; color: var(--danger); font-weight: 800">{{ fmt(annualKpis.totalExpense) }}</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: 800" :style="{ color: annualKpis.totalNet >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(annualKpis.totalNet) }}</td>
              <td style="padding: 10px 14px" />
              <td style="padding: 10px 14px" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Projeção de saldo acumulado -->
    <div class="neo-panel" style="padding: 14px 18px">
      <h3 style="font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 12px">Evolução do saldo acumulado</h3>
      <BaseEmptyState v-if="lineData.length === 0" icon="planning" title="Sem dados" body="Não há lançamentos para o ano selecionado." />
      <BaseLineChart v-else :data="lineData" :height="100" color="var(--primary)" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import BaseKpiCard    from '~/components/base/BaseKpiCard.vue'
import BaseLineChart  from '~/components/base/BaseLineChart.vue'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)

const MONTH_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const now        = new Date()
const year       = ref(now.getUTCFullYear())
const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

const yearRows = computed(() => {
  const map = new Map<string, { income: number; expense: number }>()
  for (const entry of store.entries) {
    const key = entry.dueDate.slice(0, 7)
    if (!key.startsWith(String(year.value))) continue
    const cur = map.get(key) ?? { income: 0, expense: 0 }
    if (entry.kind === 'income') cur.income += entry.amount
    else cur.expense += entry.amount
    map.set(key, cur)
  }

  let accumulated = 0
  return Array.from({ length: 12 }, (_, i) => {
    const m     = String(i + 1).padStart(2, '0')
    const month = `${year.value}-${m}`
    const data  = map.get(month) ?? { income: 0, expense: 0 }
    const net   = data.income - data.expense
    if (data.income > 0 || data.expense > 0) accumulated += net
    return {
      month,
      label:          `${MONTH_FULL[i]} ${year.value}`,
      income:         data.income,
      expense:        data.expense,
      net,
      accumulated,
      isCurrentMonth: month === currentMonthKey
    }
  })
})

const annualKpis = computed(() => {
  const rows           = yearRows.value.filter(r => r.income > 0 || r.expense > 0)
  const totalIncome    = rows.reduce((s, r) => s + r.income, 0)
  const totalExpense   = rows.reduce((s, r) => s + r.expense, 0)
  const totalNet       = totalIncome - totalExpense
  const riskMonths     = rows.filter(r => r.net < 0).length
  const avgIncome      = rows.length > 0 ? totalIncome / rows.length : 0
  const avgExpense     = rows.length > 0 ? totalExpense / rows.length : 0
  const remainingMonths = 12 - rows.length
  return {
    totalIncome,
    totalExpense,
    totalNet,
    projectedIncome:  totalIncome  + avgIncome  * remainingMonths,
    projectedExpense: totalExpense + avgExpense  * remainingMonths,
    projectedNet:     totalNet     + (avgIncome - avgExpense) * remainingMonths,
    riskMonths
  }
})

const lineData = computed(() =>
  yearRows.value
    .filter(r => r.income > 0 || r.expense > 0)
    .map(r => r.accumulated)
)
</script>
