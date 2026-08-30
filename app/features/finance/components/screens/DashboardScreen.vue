<template>
  <div class="dash">
    <BaseAlertBanner :alerts="smartAlerts" />

    <!-- KPIs -->
    <div class="dash__kpis">
      <BaseKpiCard icon="income"   label="Receitas"        :value="fmt(store.monthlyKpis.totalIncome)"   color="var(--success)" :sub="currentMonthLabel" />
      <BaseKpiCard icon="expense"  label="Despesas"        :value="fmt(store.monthlyKpis.totalExpense)"  color="var(--danger)"  :sub="currentMonthLabel" />
      <BaseKpiCard icon="balance"  label="Saldo líquido"   :value="fmt(store.monthlyKpis.net)"           :color="store.monthlyKpis.net >= 0 ? 'var(--success)' : 'var(--danger)'" :sub="store.monthlyKpis.net >= 0 ? 'Positivo' : 'Negativo'" />
      <BaseKpiCard icon="pending"  label="Em aberto"       :value="fmt(store.monthlyKpis.pendingAmount)" color="var(--warning)" sub="Pendências" />
      <BaseKpiCard icon="calendar" label="Próx. 7 dias"    :value="fmt(store.monthlyKpis.upcoming7Days)" color="var(--accent)"  sub="Vencimentos" />
      <BaseKpiCard icon="card"     label="Uso dos cartões" :value="`${store.monthlyKpis.cardsUsedPercent.toFixed(0)}%`" :color="store.monthlyKpis.cardsUsedPercent > 80 ? 'var(--danger)' : 'var(--primary)'" sub="do limite total" />
    </div>

    <!-- Fluxo de caixa + próximos vencimentos -->
    <div class="dash__row">
      <section class="neo-panel">
        <header class="neo-panel-header dash__panel-head">
          <div>
            <h3 class="dash__panel-title">Fluxo de caixa</h3>
            <p class="dash__panel-sub">Últimos 6 meses</p>
          </div>
          <div class="dash__legend">
            <span class="dash__chip" style="background: var(--success-light); color: var(--success)">
              <span class="dash__chip-dot" />Receita
            </span>
            <span class="dash__chip" style="background: var(--danger-light); color: var(--danger)">
              <span class="dash__chip-dot" />Despesa
            </span>
          </div>
        </header>
        <div class="dash__chart">
          <BaseEmptyState v-if="cashflowData.length === 0" icon="reports" title="Sem dados" body="Sem lançamentos nos últimos 6 meses." />
          <BaseBarChart v-else :data="cashflowData" :height="160" :currency="store.settings.currency || 'BRL'" />
        </div>
      </section>

      <section class="neo-panel">
        <header class="neo-panel-header dash__panel-head">
          <h3 class="dash__panel-title">Próximos vencimentos</h3>
          <span class="dash__chip" style="background: var(--danger-light); color: var(--danger)">{{ upcomingEntries.length }}</span>
        </header>
        <BaseEmptyState v-if="upcomingEntries.length === 0" icon="check" title="Sem vencimentos" body="Nenhuma despesa pendente nos próximos dias." style="padding: 18px" />
        <div v-for="item in upcomingEntries.slice(0, 5)" :key="item.id" class="dash__due">
          <div class="dash__due-main">
            <p class="dash__due-title">{{ item.title }}</p>
            <p class="dash__due-sub">{{ accountName(item.accountId) }} · {{ fmtDate(item.dueDate) }}</p>
          </div>
          <span class="dash__due-amount ds-money">{{ fmt(item.amount) }}</span>
          <span class="dash__due-tag" :style="tagStyle(item.daysLeft)">{{ tagLabel(item.daysLeft) }}</span>
        </div>
      </section>
    </div>

    <!-- Taxa de poupança -->
    <section class="dash__savings">
      <div class="dash__savings-figure">
        <p class="dash__savings-label">Taxa de poupança</p>
        <p class="dash__savings-value">{{ savingsRateLabel }}</p>
      </div>
      <div class="dash__savings-bar">
        <BaseProgressBar :value="store.monthlyKpis.net" :max="store.monthlyKpis.totalIncome" color="var(--primary)" :height="9" />
      </div>
      <BaseButton variant="primary" @click="$emit('navigate', 'reports')">Relatório completo →</BaseButton>
    </section>
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
import BaseEmptyState  from '~/components/base/BaseEmptyState.vue'
import BaseButton      from '~/components/base/BaseButton.vue'

defineEmits<{ navigate: [screen: string] }>()

const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)
const fmtDate  = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const now         = new Date()
const currentMKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

const currentMonthLabel = computed(() => MONTH_FULL[now.getUTCMonth()] ?? '')

// ── Alertas derivados dos dados reais ────────────────────────
const smartAlerts = computed(() => {
  type Tone = 'danger' | 'warning' | 'info' | 'success'
  const alerts: { tone: Tone; title: string; body: string }[] = []
  const todayStr = now.toISOString().slice(0, 10)
  const in7      = new Date(now); in7.setDate(in7.getDate() + 7)
  const in7Str   = in7.toISOString().slice(0, 10)

  const urgent = store.entries.filter(
    e => e.kind === 'expense' && e.status !== 'paid' && e.dueDate >= todayStr && e.dueDate <= in7Str
  )
  for (const e of urgent.slice(0, 2)) {
    alerts.push({ tone: 'danger', title: `${e.title} vence em breve`, body: `${fmt(e.amount)} — ${fmtDate(e.dueDate)}` })
  }
  if (store.monthlyKpis.cardsUsedPercent >= 80) alerts.push({ tone: 'warning', title: `Cartões em ${store.monthlyKpis.cardsUsedPercent.toFixed(0)}%`, body: 'Atenção ao limite disponível.' })
  return alerts.slice(0, 4)
})

// ── Fluxo de caixa (últimos 6 meses) ─────────────────────────
const cashflowData = computed(() => {
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
  const recent       = store.allCashableEntries.filter(e => new Date(e.dueDate + 'T00:00:00Z') >= sixMonthsAgo)
  const series       = buildCashflowSeries(recent, store.settings.periodMode)
  const valuesByMonth = new Map(series.map(item => [item.month, item]))
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1))
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

// ── Próximos vencimentos ─────────────────────────────────────
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

const tagLabel = (daysLeft: number) =>
  daysLeft <= 3 ? 'Urgente' : daysLeft <= 7 ? 'Esta semana' : `${daysLeft}d`

const tagStyle = (daysLeft: number) =>
  daysLeft <= 3
    ? { background: 'var(--danger-light)', color: 'var(--danger)' }
    : daysLeft <= 7
      ? { background: 'var(--warning-light)', color: 'var(--warning)' }
      : { background: 'var(--surface2)', color: 'var(--text2)' }

const accountName = (id: string | null) =>
  id ? (store.accountMap.get(id)?.name ?? '—') : '—'

const savingsRateLabel = computed(() =>
  store.monthlyKpis.totalIncome > 0
    ? `${((store.monthlyKpis.net / store.monthlyKpis.totalIncome) * 100).toFixed(1)}%`
    : '0,0%'
)
</script>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dash__kpis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.dash__row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  align-items: start;
}

.dash__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 16px;
}

.dash__panel-title {
  color: var(--text);
  font-size: 13.5px;
  font-weight: 800;
}

.dash__panel-sub {
  margin-top: 2px;
  color: var(--text3);
  font-size: 10.5px;
}

.dash__legend {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.dash__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
}

.dash__chip-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.dash__chart {
  padding: 18px;
}

.dash__due {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border);
}

.dash__due:last-child {
  border-bottom: none;
}

.dash__due-main {
  flex: 1;
  min-width: 0;
}

.dash__due-title {
  overflow: hidden;
  color: var(--text);
  font-size: 12.5px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dash__due-sub {
  margin-top: 2px;
  color: var(--text3);
  font-size: 10px;
}

.dash__due-amount {
  color: var(--danger);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.dash__due-tag {
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  font-size: 9.5px;
  font-weight: 800;
  white-space: nowrap;
}

.dash__savings {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 20px;
  background: var(--primary-dim);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.dash__savings-figure {
  flex: 1;
  min-width: 0;
}

.dash__savings-label {
  color: var(--on-primary-dim);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dash__savings-value {
  margin-top: 3px;
  color: var(--primary);
  font-size: 22px;
  font-weight: 800;
}

.dash__savings-bar {
  flex: 2;
}

@media (max-width: 1180px) {
  .dash__kpis {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .dash__row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dash {
    gap: 14px;
  }

  .dash__kpis {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .dash__chart {
    padding: 14px;
  }

  .dash__savings {
    flex-wrap: wrap;
    gap: 12px;
    padding: 14px;
  }

  .dash__savings-figure,
  .dash__savings-bar {
    flex: 1 1 100%;
  }

  .dash__savings :deep(button) {
    width: 100%;
    justify-content: center;
  }
}
</style>
