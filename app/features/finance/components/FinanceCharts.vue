<template>
  <div class="flex flex-col gap-4">
    <!-- Charts row -->
    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Cashflow Chart -->
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Fluxo de caixa</h3>
            <p class="panel-sub">Últimos meses + próximos</p>
          </div>
          <div style="display:flex;gap:8px">
            <span style="font-size:11px;color:var(--success);display:flex;align-items:center;gap:4px">
              <span style="width:8px;height:8px;background:var(--success);border-radius:2px;display:inline-block" />
              Receita
            </span>
            <span style="font-size:11px;color:var(--danger);display:flex;align-items:center;gap:4px">
              <span style="width:8px;height:8px;background:var(--danger);border-radius:2px;display:inline-block" />
              Despesa
            </span>
          </div>
        </div>
        <div class="panel-body">
          <div style="display:flex;align-items:flex-end;gap:8px;height:120px;padding:0 4px">
            <div
              v-for="(d, i) in cashflowData"
              :key="i"
              style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"
            >
              <div style="display:flex;align-items:flex-end;gap:2px;height:100px">
                <div
                  :title="`Receitas: ${fmt(d.income)}`"
                  :style="{
                    width:'10px', borderRadius:'3px 3px 0 0',
                    background:'var(--success)', opacity: i===currentIdx?1:0.55,
                    height: maxCashflow > 0 ? `${Math.round((d.income/maxCashflow)*100)}%` : '2px',
                    boxShadow: i===currentIdx ? '0 0 8px var(--success)' : 'none',
                    transition:'height 0.5s ease'
                  }"
                />
                <div
                  :title="`Despesas: ${fmt(d.expense)}`"
                  :style="{
                    width:'10px', borderRadius:'3px 3px 0 0',
                    background:'var(--danger)', opacity: i===currentIdx?1:0.55,
                    height: maxCashflow > 0 ? `${Math.round((d.expense/maxCashflow)*100)}%` : '2px',
                    boxShadow: i===currentIdx ? '0 0 8px var(--danger)' : 'none',
                    transition:'height 0.5s ease'
                  }"
                />
              </div>
              <span :style="{ fontSize:'10px', color:'var(--text3)', fontWeight: i===currentIdx?700:400 }">{{ d.month }}</span>
            </div>
          </div>
          <div style="margin-top:12px;padding:10px 14px;background:var(--surface2);border-radius:var(--radius-xs);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <div v-for="(d, i) in cashflowData" :key="i" style="text-align:center">
              <p style="font-size:10px;color:var(--text3);font-weight:600">{{ d.month }}</p>
              <p :style="{ fontSize:'12px', fontWeight:700, color: (d.income - d.expense) >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(d.income - d.expense) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Donut Chart -->
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Despesas por categoria</h3>
            <p class="panel-sub">Total: {{ fmt(store.monthlyKpis.totalExpense) }}</p>
          </div>
        </div>
        <div class="panel-body">
          <div v-if="donutSegments.length > 0" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <path
                v-for="(s, i) in donutSegments"
                :key="i"
                :d="s.d"
                fill="none"
                :stroke="s.color"
                stroke-width="24"
                stroke-linecap="butt"
                opacity="0.9"
              >
                <title>{{ s.label }}: {{ fmt(s.value) }}</title>
              </path>
              <circle cx="90" cy="90" r="58" fill="var(--surface)" />
              <text x="90" y="84" text-anchor="middle" font-size="11" fill="var(--text3)" font-family="Plus Jakarta Sans">Total</text>
              <text x="90" y="102" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text)" font-family="Plus Jakarta Sans">{{ fmtShort(store.monthlyKpis.totalExpense) }}</text>
            </svg>
            <div style="display:flex;flex-direction:column;gap:6px;flex:1;min-width:120px">
              <div v-for="(s, i) in donutSegments" :key="i" style="display:flex;align-items:center;gap:8px">
                <div :style="{ width:'10px', height:'10px', borderRadius:'3px', background:s.color, flexShrink:0 }" />
                <span style="font-size:12px;color:var(--text2);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ s.label }}</span>
                <span style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap">{{ Math.round(s.pct*100) }}%</span>
              </div>
            </div>
          </div>
          <p v-else style="color:var(--text3);font-size:13px">Sem dados de despesas</p>
        </div>
      </div>
    </div>

    <!-- Card Limits -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Utilização dos cartões de crédito</h3>
          <p class="panel-sub">Limite total disponível vs. utilizado</p>
        </div>
      </div>
      <div class="panel-body">
        <div style="display:flex;flex-direction:column;gap:14px">
          <div v-for="card in cardLimits" :key="card.id">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px">
              <span style="font-size:13px;font-weight:600;color:var(--text)">{{ card.name }}</span>
              <span style="font-size:12px;color:var(--text3)">{{ fmt(card.spent) }} / {{ fmt(card.limit) }}</span>
            </div>
            <div style="height:8px;background:var(--bg2);border-radius:99px;overflow:hidden">
              <div
                :style="{
                  width:`${card.pct}%`, height:'100%', borderRadius:'99px',
                  background: card.pct>80?'var(--danger)':card.pct>60?'var(--warning)':'var(--primary)',
                  boxShadow: card.pct>80?'0 0 8px var(--danger)':'none',
                  transition:'width 0.6s ease'
                }"
              />
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:3px">
              <span style="font-size:11px;color:var(--text3)">Vence dia {{ card.dueDay }}</span>
              <span :style="{ fontSize:'11px', fontWeight:700, color: card.pct>80?'var(--danger)':card.pct>60?'var(--warning)':'var(--primary)' }">{{ card.pct.toFixed(1) }}%</span>
            </div>
          </div>
          <p v-if="cardLimits.length === 0" style="color:var(--text3);font-size:13px">Nenhum cartão com limite cadastrado</p>
        </div>
      </div>
    </div>

    <!-- Upcoming Table -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Próximos vencimentos</h3>
          <p class="panel-sub">Despesas pendentes ordenadas por data</p>
        </div>
        <span style="font-size:11px;color:var(--text3)">{{ upcomingEntries.length }} pendente(s)</span>
      </div>
      <div class="panel-body" style="padding:0">
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="border-bottom:1px solid var(--border)">
                <th
                  v-for="h in ['Vencimento','Descrição','Conta','Valor','Urgência']"
                  :key="h"
                  style="padding:8px 10px;text-align:left;color:var(--text3);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap"
                >
                  {{ h }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="e in upcomingEntries"
                :key="e.id"
                style="border-bottom:1px solid var(--border);transition:background 0.15s"
                @mouseenter="($event.currentTarget as HTMLElement).style.background='var(--surface2)'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
              >
                <td style="padding:10px;font-weight:600;color:var(--text);white-space:nowrap">{{ fmtDateBR(e.dueDate) }}</td>
                <td style="padding:10px;color:var(--text)">
                  {{ e.title }}
                  <span v-if="e.installmentIndex" style="font-size:11px;color:var(--text3);margin-left:6px">{{ e.installmentIndex }}/{{ e.installmentTotal }}</span>
                </td>
                <td style="padding:10px;color:var(--text2);white-space:nowrap">{{ store.accountMap.get(e.accountId ?? '')?.name || '—' }}</td>
                <td style="padding:10px;font-weight:700;color:var(--danger);white-space:nowrap">{{ fmt(e.amount) }}</td>
                <td style="padding:10px">
                  <span
                    :style="{ background: urgency(e.dueDate).bg, color: urgency(e.dueDate).color, borderRadius:'99px', padding:'2px 10px', fontSize:'11px', fontWeight:700, whiteSpace:'nowrap' }"
                  >{{ urgency(e.dueDate).label }}</span>
                </td>
              </tr>
              <tr v-if="upcomingEntries.length === 0">
                <td colspan="5" style="padding:24px;text-align:center;color:var(--text3)">Nenhum vencimento próximo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
const maxCashflow = computed(() => Math.max(...cashflowData.value.map(d => Math.max(d.income, d.expense)), 1))
const currentIdx = computed(() => {
  const now = new Date()
  const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const label = monthLabels[now.getMonth()] ?? ''
  const idx = cashflowData.value.findIndex(d => d.month.startsWith(label))
  return idx >= 0 ? idx : Math.floor(cashflowData.value.length / 2)
})

const donutSegments = computed(() => {
  const catBreakdown = store.chartData.category
  const data = Object.entries(catBreakdown)
    .map(([catId, val]) => ({
      name: store.categoryMap.get(catId)?.name ?? 'Outros',
      value: val as number,
      color: store.categoryMap.get(catId)?.color ?? '#888'
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

<style scoped>
.panel {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.panel-header {
  padding: 16px 20px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}
.panel-sub {
  font-size: 12px;
  color: var(--text3);
  margin-top: 2px;
}
.panel-body {
  padding: 16px 20px;
}
</style>
