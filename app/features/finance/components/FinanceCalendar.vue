<template>
  <div style="display:flex;flex-direction:column;gap:16px">
    <!-- Header -->
    <div class="cal-nav">
      <div class="cal-nav-controls">
        <button class="cal-nav-btn" @click="prev">‹</button>
        <h2 class="cal-nav-title">{{ MONTHS[viewMonth] }} {{ viewYear }}</h2>
        <button class="cal-nav-btn" @click="next">›</button>
      </div>
      <div class="cal-nav-summary">
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
      <div class="cal-header-row">
        <div
          v-for="d in DAYS_SHORT"
          :key="d"
          class="cal-day-label"
        >{{ d }}</div>
      </div>
      <!-- Grid cells -->
      <div class="cal-header-row" style="border-bottom:none">
        <!-- Empty cells before first day -->
        <div
          v-for="i in firstDayOfMonth"
          :key="`empty-${i}`"
          class="cal-cell cal-cell-empty"
        />
        <!-- Day cells -->
        <div
          v-for="day in daysInMonth"
          :key="day"
          class="cal-cell"
          :style="{
            cursor: entriesForDay(day).length ? 'pointer' : 'default',
            background: selectedDay===day ? 'var(--primary-dim)' : isToday(day) ? 'var(--accent-light)' : 'transparent',
            transition:'background 0.15s'
          }"
          @click="selectedDay = (selectedDay === day ? null : day)"
          @mouseenter="(e: MouseEvent) => { if(selectedDay!==day) (e.currentTarget as HTMLElement).style.background='var(--surface2)' }"
          @mouseleave="(e: MouseEvent) => { if(selectedDay!==day) (e.currentTarget as HTMLElement).style.background = isToday(day)?'var(--accent-light)':'transparent' }"
        >
          <div class="cal-day-header">
            <span
              class="cal-day-number"
              :style="{
                fontWeight: isToday(day) ? 800 : 500,
                background: isToday(day) ? 'var(--accent)' : 'transparent',
                color: isToday(day) ? '#fff' : 'var(--text)'
              }"
            >{{ day }}</span>
            <div style="display:flex;gap:2px">
              <span v-if="hasPending(day)" style="width:6px;height:6px;border-radius:50%;background:var(--danger);display:block" />
              <span v-if="hasPaid(day)" style="width:6px;height:6px;border-radius:50%;background:var(--success);display:block" />
            </div>
          </div>
          <div class="cal-chips">
            <div
              v-for="e in entriesForDay(day).slice(0, 3)"
              :key="e.id"
              class="cal-chip"
              :style="{
                background: e.kind==='income' ? 'var(--success-light)' : e.status==='paid' ? 'var(--border)' : 'var(--danger-light)',
                color: e.kind==='income' ? 'var(--success)' : e.status==='paid' ? 'var(--text3)' : 'var(--danger)'
              }"
              :title="e.title"
              @click.stop="modalEntry = e"
            >{{ e.title.slice(0, 18) }}</div>
            <span v-if="entriesForDay(day).length > 3" class="cal-more">+{{ entriesForDay(day).length - 3 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Entry detail modal -->
    <Teleport to="body">
      <div
        v-if="modalEntry"
        class="cal-modal-overlay"
        @click.self="modalEntry = null"
      >
        <div class="cal-modal">
          <div class="cal-modal-handle" />
          <div style="padding:20px 24px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)">
            <h2 style="font-size:16px;font-weight:700;color:var(--text)">Detalhes do lançamento</h2>
            <button
              style="background:none;border:none;cursor:pointer;color:var(--text3);display:flex;align-items:center;border-radius:8px;padding:8px;min-width:36px;min-height:36px;touch-action:manipulation"
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
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
              <div v-for="[k, v] in modalFields" :key="k">
                <p style="font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase;margin-bottom:4px">{{ k }}</p>
                <p style="font-size:14px;font-weight:600;color:var(--text)">{{ v }}</p>
              </div>
            </div>
            <button
              style="background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:var(--radius-xs);padding:12px 20px;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;width:100%;touch-action:manipulation"
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

<style scoped>
/* ── Cabeçalho de navegação ──────────────────────────────── */
.cal-nav {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  box-shadow: var(--shadow-sm);
}

.cal-nav-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.cal-nav-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  flex: 1;
  text-align: center;
}

.cal-nav-btn {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  color: var(--text);
  font-size: 18px;
  min-width: 42px;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}

.cal-nav-summary {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

/* ── Grid de dias ─────────────────────────────────────────── */
.cal-header-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--border);
}

.cal-day-label {
  padding: 8px 4px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.cal-cell {
  min-height: 90px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 6px;
}

.cal-cell-empty {
  background: var(--bg);
}

.cal-day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.cal-day-number {
  font-size: 13px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.cal-chips {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cal-chip {
  font-size: 10px;
  border-radius: 4px;
  padding: 1px 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  cursor: pointer;
}

.cal-more {
  font-size: 10px;
  color: var(--text3);
}

/* ── Modal ───────────────────────────────────────────────── */
.cal-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: oklch(0% 0 0 / 0.55);
  backdrop-filter: blur(4px);
}

.cal-modal {
  background: var(--surface);
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
  overflow: hidden;
}

.cal-modal-handle {
  display: none;
}

/* ── Mobile ──────────────────────────────────────────────── */
@media (max-width: 640px) {
  .cal-nav {
    padding: 10px 12px;
    gap: 8px;
  }

  .cal-nav-title {
    font-size: 15px;
  }

  .cal-nav-btn {
    padding: 6px 10px;
    min-width: 36px;
    min-height: 36px;
    font-size: 16px;
  }

  .cal-nav-summary {
    width: 100%;
    gap: 10px;
  }

  .cal-day-label {
    padding: 6px 2px;
    font-size: 9px;
  }

  .cal-cell {
    min-height: 56px;
    padding: 4px 3px;
  }

  .cal-day-number {
    font-size: 11px;
    width: 20px;
    height: 20px;
  }

  /* Chips viram bolinhas coloridas no mobile */
  .cal-chip {
    font-size: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    padding: 0;
    flex-shrink: 0;
    display: inline-block;
  }

  .cal-chips {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 3px;
    margin-top: 2px;
  }

  .cal-more {
    font-size: 8px;
    align-self: center;
  }

  /* Modal vira bottom sheet */
  .cal-modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .cal-modal {
    max-width: 100%;
    border-radius: 20px 20px 0 0;
    max-height: 85vh;
    overflow-y: auto;
    padding-bottom: env(safe-area-inset-bottom, 12px);
  }

  .cal-modal-handle {
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 99px;
    background: var(--border);
    margin: 12px auto 0;
  }
}
</style>
