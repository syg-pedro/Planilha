<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- Toolbar -->
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: space-between">
      <div style="display: inline-flex; background: var(--surface2); border-radius: var(--radius-sm); padding: 3px; gap: 2px">
        <button
          v-for="v in VIEWS"
          :key="v.id"
          :style="{
            padding: '6px 16px', borderRadius: 'calc(var(--radius-sm) - 2px)', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
            background: viewMode === v.id ? 'var(--surface)' : 'transparent',
            color: viewMode === v.id ? 'var(--text)' : 'var(--text3)',
            boxShadow: viewMode === v.id ? 'var(--shadow-sm)' : 'none',
            transition: 'all .15s',
          }"
          @click="viewMode = v.id as 'matrix' | 'list'"
        >{{ v.label }}</button>
      </div>
      <p v-if="viewMode === 'matrix'" style="font-size: 12px; color: var(--text3)">
        {{ months.length }} meses · {{ expenseColumns.length }} despesas · {{ incomeColumns.length }} receitas · clique em uma célula para editar
      </p>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- MATRIZ VIEW                                                    -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <template v-if="viewMode === 'matrix'">

      <!-- DESPESAS table -->
      <div style="overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface)">
        <table style="border-collapse: collapse; font-size: 12px; width: max-content; min-width: 100%">
          <thead>
            <tr>
              <th :style="stickyHead()" style="width: 80px; min-width: 80px">
                <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--danger); font-weight: 800">Despesas</span>
              </th>
              <th
                v-for="col in expenseColumns"
                :key="col"
                :style="headCell()"
                :title="col"
              >{{ truncate(col) }}</th>
              <th :style="headCell('right')" style="min-width: 90px">Soma ↓</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(month, idx) in months"
              :key="month"
              :style="{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--surface2)' }"
            >
              <!-- Month label (sticky) -->
              <td :style="stickyCell(idx % 2 === 0)">{{ formatMonth(month) }}</td>

              <!-- Expense cells -->
              <td
                v-for="col in expenseColumns"
                :key="col"
                :style="dataCell(getAmount('expense', col, month), editingKey === cellKey('expense', col, month))"
                @click="startEdit('expense', col, month, $event)"
              >
                <input
                  v-if="editingKey === cellKey('expense', col, month)"
                  v-model="editValue"
                  type="text"
                  inputmode="decimal"
                  :style="inputStyle()"
                  @blur="saveCell('expense', col, month)"
                  @keydown.enter.prevent="saveCell('expense', col, month)"
                  @keydown.escape.prevent="cancelEdit"
                  @click.stop
                />
                <template v-else>
                  <span v-if="getAmount('expense', col, month) > 0" style="font-variant-numeric: tabular-nums">
                    {{ fmt(getAmount('expense', col, month)) }}
                  </span>
                  <span v-else style="color: var(--border)">—</span>
                  <sup
                    v-if="getCellCount('expense', col, month) > 1"
                    style="font-size: 8px; color: var(--text3); margin-left: 2px"
                  >×{{ getCellCount('expense', col, month) }}</sup>
                </template>
              </td>

              <!-- Soma -->
              <td :style="somaCell('expense', month)">
                {{ monthExpenseTotal(month) > 0 ? fmt(monthExpenseTotal(month)) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- RECEITAS table -->
      <div style="overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface)">
        <table style="border-collapse: collapse; font-size: 12px; width: max-content; min-width: 100%">
          <thead>
            <tr>
              <th :style="stickyHead()" style="width: 80px; min-width: 80px">
                <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--success); font-weight: 800">Receitas</span>
              </th>
              <th v-for="col in incomeColumns" :key="col" :style="headCell()" :title="col">{{ truncate(col) }}</th>
              <th :style="headCell('right')" style="min-width: 90px">Total ↓</th>
              <th :style="headCell('right')" style="min-width: 90px; color: var(--primary)">Sobra ↓</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(month, idx) in months"
              :key="month"
              :style="{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--surface2)' }"
            >
              <td :style="stickyCell(idx % 2 === 0)">{{ formatMonth(month) }}</td>

              <!-- Income cells -->
              <td
                v-for="col in incomeColumns"
                :key="col"
                :style="dataCell(getAmount('income', col, month), editingKey === cellKey('income', col, month))"
                @click="startEdit('income', col, month, $event)"
              >
                <input
                  v-if="editingKey === cellKey('income', col, month)"
                  v-model="editValue"
                  type="text"
                  inputmode="decimal"
                  :style="inputStyle()"
                  @blur="saveCell('income', col, month)"
                  @keydown.enter.prevent="saveCell('income', col, month)"
                  @keydown.escape.prevent="cancelEdit"
                  @click.stop
                />
                <template v-else>
                  <span v-if="getAmount('income', col, month) > 0" style="font-variant-numeric: tabular-nums">
                    {{ fmt(getAmount('income', col, month)) }}
                  </span>
                  <span v-else style="color: var(--border)">—</span>
                  <sup
                    v-if="getCellCount('income', col, month) > 1"
                    style="font-size: 8px; color: var(--text3); margin-left: 2px"
                  >×{{ getCellCount('income', col, month) }}</sup>
                </template>
              </td>

              <!-- Total receitas -->
              <td :style="somaCell('income', month)">
                {{ monthIncomeTotal(month) > 0 ? fmt(monthIncomeTotal(month)) : '—' }}
              </td>

              <!-- Sobra -->
              <td :style="sobra(month) !== 0 ? sobsCell(sobra(month)) : { ...somaCell('income', month), color: 'var(--text3)' }">
                {{ sobra(month) !== 0 ? fmt(sobra(month)) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </template>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- LISTA VIEW                                                     -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <FinanceEntryGrid v-else />

  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import FinanceEntryGrid from '~/features/finance/components/FinanceEntryGrid.vue'
import type { EntryKind, FinanceEntry } from '#shared/types'

const store   = useFinanceStore()
const currency = useCurrency()
const fmt = (v: number) => currency.format(v)

const VIEWS = [{ id: 'matrix', label: 'Matriz' }, { id: 'list', label: 'Lista' }]
const viewMode = ref<'matrix' | 'list'>('matrix')

const MONTH_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const formatMonth = (key: string) => {
  const parts = key.split('-')
  const y = parts[0] ?? '2025'
  const m = parts[1] ?? '01'
  return `${MONTH_ABBR[parseInt(m) - 1] ?? m}/${y.slice(2)}`
}
const truncate = (s: string, n = 12) => s.length > n ? s.slice(0, n - 1) + '…' : s

// ─── computed columns & months ──────────────────────────────────────────────

const months = computed(() => {
  const set = new Set<string>()
  for (const e of store.entries) set.add(e.dueDate.slice(0, 7))
  return [...set].sort()
})

const expenseColumns = computed(() => buildColumns('expense'))
const incomeColumns  = computed(() => buildColumns('income'))

function buildColumns(kind: EntryKind): string[] {
  const totals = new Map<string, number>()
  for (const e of store.entries) {
    if (e.kind !== kind) continue
    totals.set(e.title, (totals.get(e.title) ?? 0) + e.amount)
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)
}

// ─── cell lookup maps ────────────────────────────────────────────────────────

const amountMap = computed(() => {
  const map = new Map<string, number>()
  const cnt  = new Map<string, number>()
  const ents = new Map<string, FinanceEntry[]>()
  for (const e of store.entries) {
    const k = `${e.kind}__${e.title}__${e.dueDate.slice(0, 7)}`
    map.set(k, (map.get(k) ?? 0) + e.amount)
    cnt.set(k,  (cnt.get(k)  ?? 0) + 1)
    if (!ents.has(k)) ents.set(k, [])
    ents.get(k)!.push(e)
  }
  return { map, cnt, ents }
})

const cellKey = (kind: string, title: string, month: string) => `${kind}__${title}__${month}`

const getAmount    = (kind: string, title: string, month: string) => amountMap.value.map.get(cellKey(kind, title, month)) ?? 0
const getCellCount = (kind: string, title: string, month: string) => amountMap.value.cnt.get(cellKey(kind, title, month)) ?? 0
const getCellEntries = (kind: string, title: string, month: string) => amountMap.value.ents.get(cellKey(kind, title, month)) ?? []

const monthExpenseTotal = (month: string) => expenseColumns.value.reduce((s, c) => s + getAmount('expense', c, month), 0)
const monthIncomeTotal  = (month: string) => incomeColumns.value.reduce((s, c) => s + getAmount('income',  c, month), 0)
const sobra = (month: string) => monthIncomeTotal(month) - monthExpenseTotal(month)

// ─── inline editing ──────────────────────────────────────────────────────────

const editingKey = ref<string | null>(null)
const editValue  = ref('')
const saving     = ref(false)

const startEdit = (kind: string, title: string, month: string, event: MouseEvent) => {
  if (saving.value) return
  const key = cellKey(kind, title, month)
  editingKey.value = key
  const amount = getAmount(kind, title, month)
  editValue.value = amount > 0 ? String(amount).replace('.', ',') : ''
  nextTick(() => {
    const input = (event.currentTarget as HTMLElement).querySelector('input') as HTMLInputElement | null
    input?.focus()
    input?.select()
  })
}

const cancelEdit = () => { editingKey.value = null }

const saveCell = async (kind: EntryKind, title: string, month: string) => {
  const key = cellKey(kind, title, month)
  if (editingKey.value !== key) return
  editingKey.value = null

  const raw    = editValue.value.replace(',', '.').trim()
  const amount = parseFloat(raw)
  if (isNaN(amount) && raw !== '') return // invalid input, ignore

  const newAmount = isNaN(amount) ? 0 : Math.max(0, amount)
  const existing  = getCellEntries(kind, title, month)
  const prevAmount = getAmount(kind, title, month)

  if (newAmount === prevAmount) return // no change

  saving.value = true
  try {
    if (existing.length === 0 && newAmount === 0) return

    if (existing.length === 0) {
      // Create new entry for this cell
      const householdId = store.entries[0]?.householdId ?? store.accounts[0]?.householdId ?? 'household-main'
      const dayStr      = String(1).padStart(2, '0')
      const dueDate     = `${month}-${dayStr}`
      const newEntry: FinanceEntry = {
        id:               crypto.randomUUID(),
        householdId,
        ruleId:           null,
        accountId:        null,
        categoryId:       null,
        title,
        description:      '',
        amount:           newAmount,
        kind,
        dueDate,
        competenceDate:   dueDate,
        installmentIndex: null,
        installmentTotal: null,
        status:           'pending',
        origin:           'manual',
        metadata:         null,
        createdAt:        new Date().toISOString(),
        updatedAt:        new Date().toISOString(),
      }
      await store.saveEntriesBatch({ upserts: [newEntry], deletes: [] })
      return
    }

    if (newAmount === 0) {
      // Delete all entries in this cell
      await store.saveEntriesBatch({ upserts: [], deletes: existing.map(e => e.id) })
      return
    }

    if (existing.length === 1) {
      // Simple update
      await store.saveEntriesBatch({ upserts: [{ ...existing[0], amount: newAmount }], deletes: [] })
      return
    }

    // Multiple entries: update first with new total, delete rest
    await store.saveEntriesBatch({
      upserts: [{ ...existing[0], amount: newAmount }],
      deletes:  existing.slice(1).map(e => e.id),
    })
  } finally {
    saving.value = false
  }
}

// ─── style helpers ───────────────────────────────────────────────────────────

const BASE_CELL = {
  padding: '5px 10px',
  textAlign: 'right' as const,
  whiteSpace: 'nowrap' as const,
  borderRight: '1px solid var(--border)',
}

const stickyHead = () => ({
  ...BASE_CELL,
  position: 'sticky' as const,
  left: 0,
  zIndex: 3,
  top: 0,
  textAlign: 'left' as const,
  background: 'var(--surface2)',
  borderBottom: '2px solid var(--border)',
  padding: '8px 12px',
})

const headCell = (align: 'left' | 'right' = 'right') => ({
  ...BASE_CELL,
  position: 'sticky' as const,
  top: 0,
  zIndex: 2,
  textAlign: align,
  background: 'var(--surface2)',
  borderBottom: '2px solid var(--border)',
  padding: '8px 10px',
  fontWeight: '700',
  fontSize: '11px',
  color: 'var(--text2)',
  maxWidth: '110px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const stickyCell = (even: boolean) => ({
  ...BASE_CELL,
  position: 'sticky' as const,
  left: 0,
  zIndex: 1,
  textAlign: 'left' as const,
  fontWeight: '700',
  fontSize: '12px',
  color: 'var(--text2)',
  background: even ? 'var(--surface)' : 'var(--surface2)',
  padding: '6px 12px',
})

const dataCell = (amount: number, isEditing: boolean) => ({
  ...BASE_CELL,
  cursor: 'text',
  userSelect: 'none' as const,
  minWidth: '80px',
  maxWidth: '110px',
  padding: '5px 8px',
  color: amount > 0 ? 'var(--text)' : 'var(--border)',
  background: isEditing ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))' : 'transparent',
  outline: isEditing ? '2px solid var(--primary)' : 'none',
  outlineOffset: '-2px',
})

const somaCell = (kind: 'expense' | 'income', month: string) => {
  const total = kind === 'expense' ? monthExpenseTotal(month) : monthIncomeTotal(month)
  const color = kind === 'expense' ? 'var(--danger)' : 'var(--success)'
  return {
    ...BASE_CELL,
    fontWeight: '700',
    color: total > 0 ? color : 'var(--text3)',
    background: total > 0
      ? `color-mix(in srgb, ${kind === 'expense' ? 'var(--danger)' : 'var(--success)'} 6%, var(--surface))`
      : 'transparent',
    padding: '5px 10px',
  }
}

const sobsCell = (value: number) => ({
  ...BASE_CELL,
  fontWeight: '800',
  color: value >= 0 ? 'var(--success)' : 'var(--danger)',
  background: value >= 0
    ? 'color-mix(in srgb, var(--success) 8%, var(--surface))'
    : 'color-mix(in srgb, var(--danger) 8%, var(--surface))',
  padding: '5px 10px',
})

const inputStyle = () => ({
  width: '80px',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: '12px',
  fontWeight: '600',
  textAlign: 'right' as const,
  color: 'var(--text)',
  display: 'block',
  padding: '0',
})
</script>
