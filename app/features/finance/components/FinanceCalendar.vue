<template>
  <div style="display:flex;flex-direction:column;gap:16px">
    <!-- Header -->
    <div style="background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);padding:16px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;box-shadow:var(--shadow-sm)">
      <button
        style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 14px;cursor:pointer;color:var(--text);font-size:16px"
        @click="prev"
      >‹</button>
      <h2 style="font-size:18px;font-weight:800;color:var(--text);flex:1;text-align:center">{{ MONTHS[viewMonth] }} {{ viewYear }}</h2>
      <button
        style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 14px;cursor:pointer;color:var(--text);font-size:16px"
        @click="next"
      >›</button>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <span style="font-size:13px;color:var(--success);font-weight:700">↑ {{ fmt(monthIncome) }}</span>
        <span style="font-size:13px;color:var(--danger);font-weight:700">↓ {{ fmt(monthExpense) }}</span>
        <span :style="{ fontSize:'13px', fontWeight:700, color: (monthIncome-monthExpense)>=0?'var(--success)':'var(--danger)' }">
          = {{ fmt(monthIncome - monthExpense) }}
        </span>
      </div>
    </div>

    <!-- Calendar grid -->
    <div style="background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;box-shadow:var(--shadow-sm)">
      <!-- Day headers -->
      <div style="display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid var(--border)">
        <div
          v-for="d in DAYS_SHORT"
          :key="d"
          style="padding:10px 4px;text-align:center;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em"
        >{{ d }}</div>
      </div>
      <!-- Grid cells -->
      <div style="display:grid;grid-template-columns:repeat(7,1fr)">
        <!-- Empty cells before first day -->
        <div
          v-for="i in firstDayOfMonth"
          :key="`empty-${i}`"
          style="min-height:90px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--bg)"
        />
        <!-- Day cells -->
        <div
          v-for="day in daysInMonth"
          :key="day"
          :style="{
            minHeight:'90px',
            borderRight:'1px solid var(--border)',
            borderBottom:'1px solid var(--border)',
            padding:'6px',
            cursor: entriesForDay(day).length ? 'pointer' : 'default',
            background: selectedDay===day ? 'var(--primary-dim)' : isToday(day) ? 'var(--accent-light)' : 'transparent',
            transition:'background 0.15s'
          }"
          @click="selectedDay = (selectedDay === day ? null : day)"
          @mouseenter="(e: MouseEvent) => { if(selectedDay!==day) (e.currentTarget as HTMLElement).style.background='var(--surface2)' }"
          @mouseleave="(e: MouseEvent) => { if(selectedDay!==day) (e.currentTarget as HTMLElement).style.background = isToday(day)?'var(--accent-light)':'transparent' }"
        >
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span
              :style="{
                fontSize:'13px',
                fontWeight: isToday(day) ? 800 : 500,
                width:'24px', height:'24px',
                display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'50%',
                background: isToday(day) ? 'var(--accent)' : 'transparent',
                color: isToday(day) ? '#fff' : 'var(--text)'
              }"
            >{{ day }}</span>
            <div style="display:flex;gap:2px">
              <span v-if="hasPending(day)" style="width:6px;height:6px;border-radius:50%;background:var(--danger);display:block" />
              <span v-if="hasPaid(day)" style="width:6px;height:6px;border-radius:50%;background:var(--success);display:block" />
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:2px">
            <div
              v-for="e in entriesForDay(day).slice(0, 3)"
              :key="e.id"
              :style="{
                fontSize:'10px', borderRadius:'4px', padding:'1px 5px',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                fontWeight:600, cursor:'pointer',
                background: e.kind==='income' ? 'var(--success-light)' : e.status==='paid' ? 'var(--border)' : 'var(--danger-light)',
                color: e.kind==='income' ? 'var(--success)' : e.status==='paid' ? 'var(--text3)' : 'var(--danger)'
              }"
              :title="e.title"
              @click.stop="modalEntry = e"
            >{{ e.title.slice(0, 18) }}</div>
            <span v-if="entriesForDay(day).length > 3" style="font-size:10px;color:var(--text3)">+{{ entriesForDay(day).length - 3 }} mais</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Entry detail modal -->
    <Teleport to="body">
      <div
        v-if="modalEntry"
        style="position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;background:oklch(0% 0 0 / 0.55);backdrop-filter:blur(4px)"
        @click.self="modalEntry = null"
      >
        <div style="background:var(--surface);border-radius:20px;width:100%;max-width:480px;box-shadow:var(--shadow-lg);border:1px solid var(--border)">
          <div style="padding:20px 24px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)">
            <h2 style="font-size:16px;font-weight:700;color:var(--text)">Detalhes do lançamento</h2>
            <button
              style="background:none;border:none;cursor:pointer;color:var(--text3);display:flex;align-items:center;border-radius:8px;padding:4px"
              @click="modalEntry = null"
              @mouseenter="($event.currentTarget as HTMLElement).style.background='var(--surface2)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='none'"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div style="padding:20px 24px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
              <div v-for="[k, v] in modalFields" :key="k">
                <p style="font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase;margin-bottom:2px">{{ k }}</p>
                <p style="font-size:14px;font-weight:600;color:var(--text)">{{ v }}</p>
              </div>
            </div>
            <button
              style="background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:var(--radius-xs);padding:9px 16px;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;float:right"
              @click="modalEntry = null"
            >Fechar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import type { FinanceEntry } from '#shared/types'

const store = useFinanceStore()
const currency = useCurrency()
const fmt = (v: number) => currency.format(v)

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())
const selectedDay = ref<number | null>(null)
const modalEntry = ref<FinanceEntry | null>(null)

const daysInMonth = computed(() => new Date(viewYear.value, viewMonth.value + 1, 0).getDate())
const firstDayOfMonth = computed(() => new Date(viewYear.value, viewMonth.value, 1).getDay())

const prev = () => {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
  selectedDay.value = null
}
const next = () => {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
  selectedDay.value = null
}

const isToday = (day: number) =>
  day === today.getDate() && viewMonth.value === today.getMonth() && viewYear.value === today.getFullYear()

const entriesForDay = (day: number) => {
  const ds = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return store.entries.filter(e => e.dueDate === ds)
}

const hasPending = (day: number) => entriesForDay(day).some(e => e.status === 'pending' && e.kind === 'expense')
const hasPaid = (day: number) => entriesForDay(day).some(e => e.status === 'paid')

const monthEntries = computed(() => store.entries.filter(e => {
  const d = new Date(e.dueDate + 'T00:00:00')
  return d.getMonth() === viewMonth.value && d.getFullYear() === viewYear.value
}))
const monthIncome = computed(() => monthEntries.value.filter(e => e.kind === 'income').reduce((s, e) => s + e.amount, 0))
const monthExpense = computed(() => monthEntries.value.filter(e => e.kind === 'expense').reduce((s, e) => s + e.amount, 0))

const modalFields = computed(() => {
  if (!modalEntry.value) return [] as [string, string][]
  const e = modalEntry.value
  const acc = store.accountMap.get(e.accountId ?? '')
  const [y, m, d] = e.dueDate.split('-')
  return [
    ['Descrição', e.title],
    ['Vencimento', `${d}/${m}/${y}`],
    ['Valor', fmt(e.amount)],
    ['Status', ({ paid: 'Pago', pending: 'Pendente', review: 'Revisar' } as Record<string, string>)[e.status] || e.status],
    ['Tipo', e.kind === 'income' ? 'Receita' : 'Despesa'],
    ['Conta', acc?.name || '—']
  ] as [string, string][]
})
</script>
