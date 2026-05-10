<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <BaseAlertBanner :alerts="smartAlerts" />

    <!-- KPI row -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px">
      <BaseKpiCard icon="income"    label="Receitas"           :value="fmt(store.monthlyKpis.totalIncome)"   color="var(--success)"  :sub="currentMonthLabel" />
      <BaseKpiCard icon="expense"   label="Despesas"           :value="fmt(store.monthlyKpis.totalExpense)"  color="var(--danger)"   :sub="currentMonthLabel" />
      <BaseKpiCard icon="balance"   label="Saldo líquido"      :value="fmt(store.monthlyKpis.net)"           :color="store.monthlyKpis.net >= 0 ? 'var(--success)' : 'var(--danger)'" :sub="store.monthlyKpis.net >= 0 ? 'Positivo' : 'Negativo'" />
      <BaseKpiCard icon="pending"   label="Em aberto"          :value="fmt(store.monthlyKpis.pendingAmount)" color="var(--warning)"  sub="Pendências" />
      <BaseKpiCard icon="calendar"  label="Próximos 7 dias"    :value="fmt(store.monthlyKpis.upcoming7Days)" color="var(--accent)"   sub="Vencimentos" />
      <BaseKpiCard icon="card"      label="Uso dos cartões"    :value="`${store.monthlyKpis.cardsUsedPercent.toFixed(1)}%`" :color="store.monthlyKpis.cardsUsedPercent > 80 ? 'var(--danger)' : 'var(--primary)'" sub="do limite total" />
      <BaseKpiCard icon="patrimony" label="Patrimônio líq."    :value="fmt(netWorth)" color="var(--primary)" sub="Ativos - Passivos" @click="$emit('navigate', 'patrimony')" style="cursor: pointer" />
    </div>

    <!-- Charts row -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px">

      <!-- Cashflow chart -->
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border)">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Fluxo de caixa</h3>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Últimos 6 meses</p>
          </div>
          <div style="display: flex; gap: 8px">
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
            <BaseBarChart :data="cashflowData" :height="130" />
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px">
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

      <!-- Patrimony chart -->
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border)">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Patrimônio líquido</h3>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Projeção acumulada</p>
          </div>
          <button
            style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary-dim); color: var(--primary)"
            @click="$emit('navigate', 'patrimony')"
          >
            <BaseIcon name="arrow_up_right" :size="13" />Ver detalhes
          </button>
        </div>
        <div style="padding: 16px 18px">
          <BaseEmptyState v-if="netWorthTrend.length === 0" icon="patrimony" title="Sem dados" body="Adicione itens de patrimônio para ver a evolução." />
          <BaseLineChart v-else :data="netWorthTrend" :height="110" color="var(--primary)" />
          <div style="display: flex; gap: 16px; margin-top: 10px">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); flex: 1">
              <span style="font-size: 13px; color: var(--text2)">Ativos</span>
              <span style="font-size: 13px; font-weight: 700; color: var(--success)">{{ fmt(totalAssets) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); flex: 1">
              <span style="font-size: 13px; color: var(--text2)">Passivos</span>
              <span style="font-size: 13px; font-weight: 700; color: var(--danger)">{{ fmt(totalLiabilities) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Budget + Goals + Upcoming -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px">

      <!-- Budgets mini -->
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border)">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Orçamentos do mês</h3>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Consumo vs. limite</p>
          </div>
          <button style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary-dim); color: var(--primary)" @click="$emit('navigate', 'budget')">
            <BaseIcon name="budget" :size="13" />Gerenciar
          </button>
        </div>
        <div style="padding: 16px 18px; display: flex; flex-direction: column; gap: 12px">
          <BaseEmptyState v-if="budgetMini.length === 0" icon="budget" title="Sem orçamentos" body="Defina limites em Orçamentos." />
          <div v-for="item in budgetMini" :key="item.id" style="display: flex; flex-direction: column; gap: 6px">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-size: 12px; font-weight: 600; color: var(--text)">{{ item.name }}</span>
              <span style="font-size: 11px; font-weight: 700" :style="{ color: item.barColor }">{{ fmt(item.spent) }} / {{ fmt(item.limit) }}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px">
              <div style="flex: 1; height: 6px; background: var(--bg2); border-radius: 99px; overflow: hidden">
                <div :style="{ width: `${Math.min(100, item.pct)}%`, height: '100%', background: item.barColor, borderRadius: '99px', transition: 'width 0.6s' }" />
              </div>
              <span style="font-size: 10px; font-weight: 700; min-width: 32px; text-align: right" :style="{ color: item.barColor }">{{ item.pct.toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Goals mini -->
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border)">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Metas financeiras</h3>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Progresso de cada objetivo</p>
          </div>
          <button style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary-dim); color: var(--primary)" @click="$emit('navigate', 'goals')">
            <BaseIcon name="goal" :size="13" />Ver todas
          </button>
        </div>
        <div style="padding: 16px 18px; display: flex; flex-direction: column; gap: 14px">
          <BaseEmptyState v-if="store.goals.length === 0" icon="goal" title="Sem metas" body="Crie objetivos financeiros em Metas." />
          <div v-for="goal in store.goals.slice(0, 4)" :key="goal.id" style="display: flex; align-items: center; gap: 12px">
            <BaseDonutRing :percent="Math.min(100, goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0)" :color="goal.color" :size="44" :stroke="5" :label="`${goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0}%`" />
            <div style="flex: 1; min-width: 0">
              <p style="font-size: 12px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ goal.name }}</p>
              <p style="font-size: 11px; color: var(--text3)">{{ fmt(goal.currentAmount) }} de {{ fmt(goal.targetAmount) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming -->
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border)">
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
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 14px 18px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center">
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
      <div style="display: flex; gap: 10px">
        <button
          style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary); color: #fff"
          @click="$emit('navigate', 'reports')"
        >
          <BaseIcon name="reports" :size="15" color="#fff" />Relatório completo
        </button>
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
import BaseDonutRing   from '~/components/base/BaseDonutRing.vue'
import BaseBarChart    from '~/components/base/BaseBarChart.vue'
import BaseLineChart   from '~/components/base/BaseLineChart.vue'
import BaseIcon        from '~/components/base/BaseIcon.vue'
import BaseEmptyState  from '~/components/base/BaseEmptyState.vue'

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

  const urgent = store.entries.filter(
    e => e.kind === 'expense' && e.status !== 'paid' && e.dueDate >= todayStr && e.dueDate <= in3Str
  )
  for (const e of urgent.slice(0, 2)) {
    alerts.push({ tone: 'danger', title: `${e.title} vence em breve`, body: `${fmt(e.amount)} — ${fmtDate(e.dueDate)}` })
  }
  for (const b of store.budgets.filter(b2 => b2.monthRef === currentMKey)) {
    const spent = store.entries.filter(e => e.kind === 'expense' && e.categoryId === b.categoryId && e.dueDate.startsWith(currentMKey)).reduce((s, e) => s + e.amount, 0)
    const pct   = b.amount > 0 ? (spent / b.amount) * 100 : 0
    const cat   = store.categoryMap.get(b.categoryId)
    if (pct >= 100) alerts.push({ tone: 'danger', title: `Orçamento "${cat?.name ?? ''}" ultrapassado`, body: `${fmt(spent)} de ${fmt(b.amount)}` })
    else if (pct >= 80) alerts.push({ tone: 'warning', title: `Orçamento "${cat?.name ?? ''}" em ${pct.toFixed(0)}%`, body: `Restam ${fmt(b.amount - spent)}` })
  }
  if (store.monthlyKpis.cardsUsedPercent >= 80) alerts.push({ tone: 'warning', title: `Cartões em ${store.monthlyKpis.cardsUsedPercent.toFixed(0)}%`, body: 'Atenção ao limite disponível.' })
  return alerts.slice(0, 4)
})

// ── Cashflow chart (last 6 months) ──────────────────────────
const cashflowData = computed(() => {
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
  const recent       = store.entries.filter(e => new Date(e.dueDate + 'T00:00:00Z') >= sixMonthsAgo)
  const series       = buildCashflowSeries(recent, store.settings.periodMode)
  return series.map(s => ({
    month:   MONTH_NAMES[parseInt(s.month.slice(5)) - 1] ?? s.month.slice(5),
    income:  s.income,
    expense: s.expense,
    current: s.month === currentMKey
  }))
})

// ── Patrimony ────────────────────────────────────────────────
const totalAssets      = computed(() => store.patrimony.filter(p => p.kind === 'asset').reduce((s, p) => s + p.value, 0))
const totalLiabilities = computed(() => store.patrimony.filter(p => p.kind === 'liability').reduce((s, p) => s + p.value, 0))
const netWorth         = computed(() => totalAssets.value - totalLiabilities.value)
const netWorthTrend    = computed(() => {
  if (cashflowData.value.length === 0) return []
  let acc = netWorth.value
  return cashflowData.value.map(d => { acc += d.income - d.expense; return acc }).reverse()
})

// ── Budget mini ───────────────────────────────────────────────
const budgetMini = computed(() =>
  store.budgets
    .filter(b => b.monthRef === currentMKey)
    .map(b => {
      const cat   = store.categoryMap.get(b.categoryId)
      const spent = store.entries
        .filter(e => e.kind === 'expense' && e.categoryId === b.categoryId && e.dueDate.startsWith(currentMKey))
        .reduce((s, e) => s + e.amount, 0)
      const pct   = b.amount > 0 ? (spent / b.amount) * 100 : 0
      const barColor = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : (cat?.color ?? 'var(--primary)')
      return { id: b.id, name: cat?.name ?? 'Sem categoria', spent, limit: b.amount, pct, barColor }
    })
    .sort((a, b2) => b2.pct - a.pct)
    .slice(0, 5)
)

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
