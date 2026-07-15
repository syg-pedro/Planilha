<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <BaseAlertBanner :alerts="smartAlerts" />

    <!-- KPI row -->
    <div class="kpi-grid">
      <BaseKpiCard icon="income"    label="Receitas"           :value="fmt(store.monthlyKpis.totalIncome)"   color="var(--success)"  :sub="currentMonthLabel" />
      <BaseKpiCard icon="expense"   label="Despesas"           :value="fmt(store.monthlyKpis.totalExpense)"  color="var(--danger)"   :sub="currentMonthLabel" />
      <BaseKpiCard icon="balance"   label="Saldo líquido"      :value="fmt(store.monthlyKpis.net)"           :color="store.monthlyKpis.net >= 0 ? 'var(--success)' : 'var(--danger)'" :sub="store.monthlyKpis.net >= 0 ? 'Positivo' : 'Negativo'" />
      <BaseKpiCard icon="pending"   label="Em aberto"          :value="fmt(store.monthlyKpis.pendingAmount)" color="var(--warning)"  sub="Pendências" />
      <BaseKpiCard icon="calendar"  label="Próximos 7 dias"    :value="fmt(store.monthlyKpis.upcoming7Days)" color="var(--accent)"   sub="Vencimentos" />
      <BaseKpiCard icon="card"      label="Uso dos cartões"    :value="`${store.monthlyKpis.cardsUsedPercent.toFixed(1)}%`" :color="store.monthlyKpis.cardsUsedPercent > 80 ? 'var(--danger)' : 'var(--primary)'" sub="do limite total" />
    </div>

    <!-- Charts row -->
    <div class="charts-grid">

      <!-- Cashflow chart -->
      <div class="neo-panel">
        <div class="chart-header neo-panel-header">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Fluxo de caixa</h3>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Últimos 6 meses</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <span style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success)">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor" />Receita
            </span>
            <span style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: color-mix(in srgb, var(--danger) 12%, transparent); color: var(--danger)">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor" />Despesa
            </span>
          </div>
        </div>
        <div style="padding: 16px 18px">
          <BaseEmptyState v-if="cashflowData.length === 0" icon="reports" title="Sem dados" body="Sem lançamentos nos últimos 6 meses." />
          <template v-else>
            <BaseBarChart :data="cashflowData" :height="130" :currency="store.settings.currency || 'BRL'" />
            <div class="cashflow-months">
              <div
                v-for="d in cashflowData.slice(-3)"
                :key="d.month"
                style="border-radius: var(--radius-sm); padding: 8px 10px"
                :style="{ background: 'var(--surface2)', border: d.current ? '1px solid var(--primary)' : '1px solid var(--border)' }"
              >
                <p style="font-size: 10px; color: var(--text3); font-weight: 700">{{ d.month }}</p>
                <p style="font-size: 13px; font-weight: 800" :style="{ color: (d.income - d.expense) >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(d.income - d.expense) }}</p>
              </div>
            </div>
          </template>
        </div>
      </div>

    </div>

    <!-- Upcoming -->
    <div class="cards-grid">

      <!-- Upcoming -->
      <div class="neo-panel">
        <div class="neo-panel-header" style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border)">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Próximos vencimentos</h3>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Despesas pendentes</p>
          </div>
          <span style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: color-mix(in srgb, var(--danger) 12%, transparent); color: var(--danger)">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor" />{{ upcomingEntries.length }} pendentes
          </span>
        </div>
        <div style="padding: 0 16px">
          <BaseEmptyState v-if="upcomingEntries.length === 0" icon="check" title="Sem vencimentos" body="Nenhuma despesa pendente nos próximos dias." style="padding: 16px 0" />
          <div v-for="item in upcomingEntries.slice(0, 5)" :key="item.id" style="display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border)">
            <div style="flex: 1; min-width: 0">
              <p style="font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ item.title }}</p>
              <p style="font-size: 11px; color: var(--text3)">{{ accountName(item.accountId) }} · {{ fmtDate(item.dueDate) }}</p>
            </div>
            <span style="font-size: 13px; font-weight: 800; color: var(--danger); white-space: nowrap">{{ fmt(item.amount) }}</span>
            <span
              style="display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; white-space: nowrap"
              :style="item.daysLeft <= 3 ? { background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' } : item.daysLeft <= 7 ? { background: 'color-mix(in srgb, var(--warning) 12%, transparent)', color: 'var(--warning)' } : { background: 'var(--surface2)', color: 'var(--text2)' }"
            >{{ item.daysLeft <= 3 ? 'Urgente' : item.daysLeft <= 7 ? 'Esta semana' : `${item.daysLeft}d` }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Savings rate strip -->
    <div class="savings-strip">
      <div style="flex: 1; min-width: 160px">
        <p style="font-size: 11px; color: var(--text3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em">Taxa de poupança</p>
        <p style="font-size: 22px; font-weight: 800; color: var(--primary); margin-top: 2px">{{ savingsRateLabel }}</p>
        <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Recomendado: ≥ 20%</p>
      </div>
      <div style="flex: 2; min-width: 200px">
        <BaseProgressBar :value="store.monthlyKpis.net" :max="store.monthlyKpis.totalIncome" color="var(--primary)" :height="10" />
        <div style="display: flex; justify-content: space-between; margin-top: 4px">
          <span style="font-size: 11px; color: var(--text3)">Economizado: {{ fmt(store.monthlyKpis.net) }}</span>
          <span style="font-size: 11px; color: var(--text3)">Receita: {{ fmt(store.monthlyKpis.totalIncome) }}</span>
        </div>
      </div>
      <div class="savings-cta">
        <BaseButton
          variant="primary"
          @click="$emit('navigate', 'reports')"
        >
          <BaseIcon name="reports" :size="15" color="#fff" />Relatório completo
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { buildCashflowSeries } from '#shared/finance'
import BaseAlertBanner from '~/components/base/BaseAlertBanner.vue'
import BaseKpiCard     from '~/components/base/BaseKpiCard.vue'
import BaseProgressBar from '~/components/base/BaseProgressBar.vue'
import BaseBarChart    from '~/components/base/BaseBarChart.vue'
import BaseIcon        from '~/components/base/BaseIcon.vue'
import BaseEmptyState  from '~/components/base/BaseEmptyState.vue'
import BaseButton      from '~/components/base/BaseButton.vue'

defineEmits<{ navigate: [screen: string] }>()

const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)
const fmtDate  = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

const MONTH_NAMES  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const now          = new Date()
const currentMKey  = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

const currentMonthLabel = computed(() => MONTH_FULL[now.getUTCMonth()] ?? '')

// ── Smart alerts derived from real data ──────────────────────
const smartAlerts = computed(() => {
  type Tone = 'danger' | 'warning' | 'info' | 'success'
  const alerts: { tone: Tone; title: string; body: string }[] = []
  const todayStr = now.toISOString().slice(0, 10)
  const in3      = new Date(now); in3.setDate(in3.getDate() + 3)
  const in3Str   = in3.toISOString().slice(0, 10)

  const urgent = store.cashableEntries.filter(
    e => e.kind === 'expense' && e.status !== 'paid' && e.dueDate >= todayStr && e.dueDate <= in3Str
  )
  for (const e of urgent.slice(0, 2)) {
    alerts.push({ tone: 'danger', title: `${e.title} vence em breve`, body: `${fmt(e.amount)} — ${fmtDate(e.dueDate)}` })
  }
  if (store.monthlyKpis.cardsUsedPercent >= 80) alerts.push({ tone: 'warning', title: `Cartões em ${store.monthlyKpis.cardsUsedPercent.toFixed(0)}%`, body: 'Atenção ao limite disponível.' })
  return alerts.slice(0, 4)
})

// ── Cashflow chart (last 6 months) ──────────────────────────
const cashflowData = computed(() => {
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
  const recent       = store.allCashableEntries.filter(e => new Date(e.dueDate + 'T00:00:00Z') >= sixMonthsAgo)
  const series       = buildCashflowSeries(recent, store.settings.periodMode)
  return series.map(s => ({
    month:   MONTH_NAMES[parseInt(s.month.slice(5)) - 1] ?? s.month.slice(5),
    income:  s.income,
    expense: s.expense,
    current: s.month === currentMKey
  }))
})

// ── Upcoming entries ──────────────────────────────────────────
const upcomingEntries = computed(() => {
  const todayStr = now.toISOString().slice(0, 10)
  const in14     = new Date(now); in14.setDate(in14.getDate() + 14)
  const in14Str  = in14.toISOString().slice(0, 10)
  return store.entries
    .filter(e => e.kind === 'expense' && e.status !== 'paid' && e.dueDate >= todayStr && e.dueDate <= in14Str)
    .map(e => ({
      ...e,
      daysLeft: Math.ceil((new Date(e.dueDate + 'T00:00:00Z').getTime() - now.getTime()) / 86400000)
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
})

const accountName = (id: string | null) =>
  id ? (store.accountMap.get(id)?.name ?? '—') : '—'

const savingsRateLabel = computed(() =>
  store.monthlyKpis.totalIncome > 0
    ? `${((store.monthlyKpis.net / store.monthlyKpis.totalIncome) * 100).toFixed(1)}%`
    : '0.0%'
)
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.chart-header {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 2px solid var(--border);
  flex-wrap: wrap;
}

.cashflow-months {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.savings-strip {
  background: var(--surface);
  border-radius: var(--radius);
  border: 2px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 14px 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.savings-cta {
  display: flex;
  gap: 10px;
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 7px;
  }

  .charts-grid,
  .cards-grid {
    grid-template-columns: 1fr;
  }

  .chart-header {
    padding: 12px 14px;
    gap: 8px;
  }

  .cashflow-months {
    display: none;
  }

  .savings-strip {
    padding: 12px 14px;
    gap: 12px;
  }

  .savings-cta {
    width: 100%;
  }

  .savings-cta button {
    width: 100%;
    justify-content: center;
  }
}
</style>
