<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <BaseAlertBanner :alerts="SMART_ALERTS" />

    <!-- KPI row -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px">
      <BaseKpiCard icon="income"   label="Receitas Mai"     :value="fmt(store.kpis.totalIncome)"  color="var(--success)" :trend="0"  sub="vs. abril" />
      <BaseKpiCard icon="expense"  label="Despesas Mai"     :value="fmt(store.kpis.totalExpense)" color="var(--danger)"  :trend="24" sub="vs. abril" :alert="true" />
      <BaseKpiCard icon="balance"  label="Saldo líquido"    :value="fmt(store.kpis.net)"          :color="store.kpis.net >= 0 ? 'var(--success)' : 'var(--danger)'" :sub="store.kpis.net >= 0 ? 'Positivo' : 'Negativo'" />
      <BaseKpiCard icon="pending"  label="Em aberto"        :value="fmt(store.kpis.pendingAmount)" color="var(--warning)" sub="Pendências" />
      <BaseKpiCard icon="calendar" label="Próximos 7 dias"  :value="fmt(store.kpis.upcoming7Days)" color="var(--accent)" sub="Vencimentos" />
      <BaseKpiCard icon="card"     label="Uso dos cartões"  :value="`${store.kpis.cardsUsedPercent.toFixed(1)}%`" :color="store.kpis.cardsUsedPercent > 80 ? 'var(--danger)' : 'var(--primary)'" sub="do limite total" />
      <BaseKpiCard icon="patrimony" label="Patrimônio líq." :value="fmt(PATRIMONY.assets - PATRIMONY.liabilities)" color="var(--primary)" sub="Ativos - Passivos" :onClick="() => $emit('navigate', 'patrimony')" />
    </div>

    <!-- Charts row -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px">
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border)">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Fluxo de caixa</h3>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">6 meses</p>
          </div>
          <div style="display: flex; gap: 8px">
            <span style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--success-light); color: var(--success)">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor" />Receita
            </span>
            <span style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--danger-light); color: var(--danger)">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor" />Despesa
            </span>
          </div>
        </div>
        <div style="padding: 16px 18px">
          <BaseBarChart :data="CASHFLOW_DATA" :height="130" />
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px">
            <div
              v-for="d in CASHFLOW_DATA.slice(-3)"
              :key="d.month"
              style="border-radius: var(--radius-sm); padding: 8px 10px"
              :style="{ background: 'var(--surface2)', border: d.current ? '1px solid var(--primary)' : '1px solid var(--border)' }"
            >
              <p style="font-size: 10px; color: var(--text3); font-weight: 700">{{ d.month }}</p>
              <p style="font-size: 13px; font-weight: 800" :style="{ color: (d.income - d.expense) >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(d.income - d.expense) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border)">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Patrimônio líquido</h3>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Evolução 7 meses</p>
          </div>
          <button
            style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary-dim); color: var(--primary)"
            @click="$emit('navigate', 'patrimony')"
          >
            <BaseIcon name="arrow_up_right" :size="13" />Ver detalhes
          </button>
        </div>
        <div style="padding: 16px 18px">
          <BaseLineChart :data="NET_WORTH_TREND" :height="110" color="var(--primary)" />
          <div style="display: flex; gap: 16px; margin-top: 10px">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); flex: 1">
              <span style="font-size: 13px; color: var(--text2)">Ativos</span>
              <span style="font-size: 13px; font-weight: 700; color: var(--success)">{{ fmt(PATRIMONY.assets) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); flex: 1">
              <span style="font-size: 13px; color: var(--text2)">Passivos</span>
              <span style="font-size: 13px; font-weight: 700; color: var(--danger)">{{ fmt(PATRIMONY.liabilities) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Budget + Goals + Upcoming -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px">
      <!-- Budgets -->
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border)">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Orçamentos do mês</h3>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Consumo vs. limite por categoria</p>
          </div>
          <button style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary-dim); color: var(--primary)" @click="$emit('navigate', 'budget')">
            <BaseIcon name="budget" :size="13" />Gerenciar
          </button>
        </div>
        <div style="padding: 16px 18px; display: flex; flex-direction: column; gap: 12px">
          <div v-for="item in BUDGET_ITEMS" :key="item.name" style="display: flex; flex-direction: column; gap: 6px">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-size: 12px; font-weight: 600; color: var(--text)">{{ item.name }}</span>
              <span style="font-size: 11px; font-weight: 700" :style="{ color: budgetColor(item) }">{{ fmt(item.spent) }} / {{ fmt(item.limit) }}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px">
              <div style="flex: 1; height: 6px; background: var(--bg2); border-radius: 99px; overflow: hidden">
                <div :style="{ width: `${Math.min(100, (item.spent / item.limit) * 100)}%`, height: '100%', background: budgetColor(item), borderRadius: '99px', transition: 'width 0.6s' }" />
              </div>
              <span style="font-size: 10px; font-weight: 700; min-width: 32px; text-align: right" :style="{ color: budgetColor(item) }">{{ Math.round((item.spent / item.limit) * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Goals -->
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
          <div v-for="goal in GOALS" :key="goal.name" style="display: flex; align-items: center; gap: 12px">
            <BaseDonutRing :percent="(goal.current / goal.target) * 100" :color="goal.color" :size="44" :stroke="5" :label="`${Math.round((goal.current / goal.target) * 100)}%`" />
            <div style="flex: 1; min-width: 0">
              <p style="font-size: 12px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ goal.name }}</p>
              <p style="font-size: 11px; color: var(--text3)">{{ fmt(goal.current) }} de {{ fmt(goal.target) }}</p>
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
          <span style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--danger-light); color: var(--danger)">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor" />{{ UPCOMING.length }} pendentes
          </span>
        </div>
        <div style="padding: 0 16px">
          <div v-for="item in UPCOMING" :key="item.title" style="display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border)">
            <div style="flex: 1; min-width: 0">
              <p style="font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ item.title }}</p>
              <p style="font-size: 11px; color: var(--text3)">{{ item.account }} · {{ fmtDate(item.dueDate) }}</p>
            </div>
            <span style="font-size: 13px; font-weight: 800; color: var(--danger); white-space: nowrap">{{ fmt(item.amount) }}</span>
            <span
              style="display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; white-space: nowrap"
              :style="item.days <= 3 ? { background: 'var(--danger-light)', color: 'var(--danger)' } : item.days <= 7 ? { background: 'var(--warning-light)', color: 'var(--warning)' } : { background: 'var(--surface2)', color: 'var(--text2)' }"
            >{{ item.days <= 3 ? 'Urgente' : item.days <= 7 ? 'Esta semana' : `${item.days} dias` }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Savings rate -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 14px 18px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center">
      <div style="flex: 1; min-width: 160px">
        <p style="font-size: 11px; color: var(--text3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em">Taxa de poupança</p>
        <p style="font-size: 22px; font-weight: 800; color: var(--primary); margin-top: 2px">{{ store.kpis.totalIncome > 0 ? ((store.kpis.net / store.kpis.totalIncome) * 100).toFixed(1) : '0.0' }}%</p>
        <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Recomendado: ≥ 20%</p>
      </div>
      <div style="flex: 2; min-width: 200px">
        <BaseProgressBar :value="store.kpis.net" :max="store.kpis.totalIncome" color="var(--primary)" :height="10" />
        <div style="display: flex; justify-content: space-between; margin-top: 4px">
          <span style="font-size: 11px; color: var(--text3)">Economizado: {{ fmt(store.kpis.net) }}</span>
          <span style="font-size: 11px; color: var(--text3)">Receita: {{ fmt(store.kpis.totalIncome) }}</span>
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
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import BaseAlertBanner from '~/components/base/BaseAlertBanner.vue'
import BaseKpiCard from '~/components/base/BaseKpiCard.vue'
import BaseProgressBar from '~/components/base/BaseProgressBar.vue'
import BaseDonutRing from '~/components/base/BaseDonutRing.vue'
import BaseBarChart from '~/components/base/BaseBarChart.vue'
import BaseLineChart from '~/components/base/BaseLineChart.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'

defineEmits<{ navigate: [screen: string] }>()

const store = useFinanceStore()
const currency = useCurrency()
const fmt = (v: number) => currency.format(v)
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

const SMART_ALERTS = [
  { tone: 'danger' as const,  title: 'Nubank vence em 3 dias',         body: 'Fatura de R$ 589,90 — evite juros.' },
  { tone: 'warning' as const, title: 'Orçamento de Cartões em 94%',    body: 'Você já consumiu R$ 1.654 de R$ 1.750.' },
  { tone: 'info' as const,    title: 'Meta Reserva de Emergência: 62%', body: 'Aporte sugerido: R$ 400 este mês.' },
  { tone: 'success' as const, title: 'Salário Pedro creditado',         body: 'R$ 1.000 disponível na Conta Pedro.' },
]

const CASHFLOW_DATA = [
  { month: 'Fev', income: 3900, expense: 2780, current: false },
  { month: 'Mar', income: 3900, expense: 3150, current: false },
  { month: 'Abr', income: 3900, expense: 2640, current: false },
  { month: 'Mai', income: 3900, expense: 3280, current: true  },
  { month: 'Jun', income: 3900, expense: 2950, current: false },
  { month: 'Jul', income: 3900, expense: 2800, current: false },
]

const BUDGET_ITEMS = [
  { name: 'Cartões',  spent: 1654, limit: 1750, color: 'var(--primary)' },
  { name: 'Moradia',  spent: 1700, limit: 1700, color: 'var(--danger)'  },
  { name: 'Serviços', spent: 99,   limit: 200,  color: 'var(--success)' },
  { name: 'Educação', spent: 171,  limit: 300,  color: 'var(--accent)'  },
]

const GOALS = [
  { name: 'Reserva de Emergência', current: 6200,  target: 10000, color: 'var(--success)' },
  { name: 'Viagem de Férias',      current: 1800,  target: 5000,  color: 'var(--primary)' },
  { name: 'Troca do Celular',      current: 400,   target: 1500,  color: 'var(--accent)'  },
]

const PATRIMONY = { assets: 28400, liabilities: 14200 }

const UPCOMING = [
  { title: 'Nubank Pedro',    amount: 589.90, dueDate: '2026-05-10', days: 3,  account: 'Nubank'  },
  { title: 'Aluguel + Cond.', amount: 1700,   dueDate: '2026-05-12', days: 5,  account: 'Banco'   },
  { title: 'Sicredi Pedro',   amount: 484.75, dueDate: '2026-05-15', days: 8,  account: 'Sicredi' },
  { title: 'Energia',         amount: 260,    dueDate: '2026-05-18', days: 11, account: '—'       },
  { title: 'Mercado Livre',   amount: 480.87, dueDate: '2026-05-18', days: 11, account: 'ML'      },
]

const NET_WORTH_TREND = [18200, 19800, 21100, 20400, 22600, 24200, 14200]

function budgetColor(item: { spent: number; limit: number; color: string }) {
  const pct = (item.spent / item.limit) * 100
  if (pct >= 100) return 'var(--danger)'
  if (pct >= 90) return 'var(--danger)'
  if (pct >= 70) return 'var(--warning)'
  return item.color
}
</script>
