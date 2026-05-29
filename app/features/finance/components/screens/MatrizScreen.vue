<template>
  <div style="display: flex; flex-direction: column; gap: 16px" @click="closeColMenu">

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
                @mouseenter="showTooltip(col, $event)"
                @mouseleave="hideTooltip"
              >
                <div class="col-head">
                  <span class="col-title">{{ truncate(col) }}</span>
                  <button class="col-menu-btn" title="Ações da coluna" @click.stop="openColMenu('expense', col, $event)">⋮</button>
                </div>
              </th>
              <th :style="headCell('right')" style="min-width: 90px">Soma ↓</th>
              <th :style="addColHeadStyle">
                <button class="add-col-btn" @click.stop="openAdd('expense')">+ Coluna</button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(month, idx) in months"
              :key="month"
              :style="{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--surface2)' }"
            >
              <td :style="stickyCell(idx % 2 === 0)">{{ formatMonth(month) }}</td>
              <td
                v-for="col in expenseColumns"
                :key="col"
                :style="dataCell(getAmount('expense', col, month), editingKey === cellKey('expense', col, month), getStatus('expense', col, month), 'expense')"
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
                  <div class="cell-content">
                    <sup v-if="getCellCount('expense', col, month) > 1" class="cell-count">×{{ getCellCount('expense', col, month) }}</sup>
                    <span v-if="getAmount('expense', col, month) > 0" style="font-variant-numeric: tabular-nums">{{ fmt(getAmount('expense', col, month)) }}</span>
                    <span v-else style="color: var(--border)">—</span>
                    <button
                      v-if="getAmount('expense', col, month) > 0"
                      class="status-dot"
                      :class="`status-dot--${getStatus('expense', col, month) === 'paid' ? 'paid' : getStatus('expense', col, month) === 'mixed' ? 'mixed' : 'pending-expense'}`"
                      :title="getStatus('expense', col, month) === 'paid' ? 'Pago — clique para marcar como não pago' : 'Não pago — clique para marcar como pago'"
                      @click.stop="toggleStatus('expense', col, month)"
                    />
                  </div>
                </template>
              </td>
              <td :style="somaCell('expense', month)">
                {{ monthExpenseTotal(month) > 0 ? fmt(monthExpenseTotal(month)) : '—' }}
              </td>
              <td :style="{ ...BASE_CELL, background: 'transparent' }" />
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
              <th
                v-for="col in incomeColumns"
                :key="col"
                :style="headCell()"
                @mouseenter="showTooltip(col, $event)"
                @mouseleave="hideTooltip"
              >
                <div class="col-head">
                  <span class="col-title">{{ truncate(col) }}</span>
                  <button class="col-menu-btn" title="Ações da coluna" @click.stop="openColMenu('income', col, $event)">⋮</button>
                </div>
              </th>
              <th :style="headCell('right')" style="min-width: 90px">Total ↓</th>
              <th :style="headCell('right')" style="min-width: 90px; color: var(--primary)">Sobra ↓</th>
              <th :style="addColHeadStyle">
                <button class="add-col-btn" @click.stop="openAdd('income')">+ Coluna</button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(month, idx) in months"
              :key="month"
              :style="{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--surface2)' }"
            >
              <td :style="stickyCell(idx % 2 === 0)">{{ formatMonth(month) }}</td>
              <td
                v-for="col in incomeColumns"
                :key="col"
                :style="dataCell(getAmount('income', col, month), editingKey === cellKey('income', col, month), getStatus('income', col, month), 'income')"
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
                  <div class="cell-content">
                    <sup v-if="getCellCount('income', col, month) > 1" class="cell-count">×{{ getCellCount('income', col, month) }}</sup>
                    <span v-if="getAmount('income', col, month) > 0" style="font-variant-numeric: tabular-nums">{{ fmt(getAmount('income', col, month)) }}</span>
                    <span v-else style="color: var(--border)">—</span>
                    <button
                      v-if="getAmount('income', col, month) > 0"
                      class="status-dot"
                      :class="`status-dot--${getStatus('income', col, month) === 'paid' ? 'received' : getStatus('income', col, month) === 'mixed' ? 'mixed' : 'pending-income'}`"
                      :title="getStatus('income', col, month) === 'paid' ? 'Recebido — clique para marcar como pendente' : 'Pendente — clique para marcar como recebido'"
                      @click.stop="toggleStatus('income', col, month)"
                    />
                  </div>
                </template>
              </td>
              <td :style="somaCell('income', month)">{{ monthIncomeTotal(month) > 0 ? fmt(monthIncomeTotal(month)) : '—' }}</td>
              <td :style="sobra(month) !== 0 ? sobsCell(sobra(month)) : { ...somaCell('income', month), color: 'var(--text3)' }">
                {{ sobra(month) !== 0 ? fmt(sobra(month)) : '—' }}
              </td>
              <td :style="{ ...BASE_CELL, background: 'transparent' }" />
            </tr>
          </tbody>
        </table>
      </div>

    </template>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- LISTA VIEW                                                     -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <FinanceEntryGrid v-else />

    <!-- ── Tooltip ──────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        style="position: fixed; z-index: 9999; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; color: var(--text); box-shadow: 0 4px 20px oklch(0% 0 0 / 0.2); pointer-events: none; white-space: nowrap; max-width: 320px; transform: translateX(-50%)"
        :style="{ left: tooltip.x + 'px', top: (tooltip.y - 44) + 'px' }"
      >{{ tooltip.text }}</div>
    </Teleport>

    <!-- ── Dropdown de ações da coluna ──────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="colMenu"
        style="position: fixed; z-index: 9999; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 4px; box-shadow: 0 8px 32px oklch(0% 0 0 / 0.2); min-width: 160px"
        :style="{ left: colMenu.x + 'px', top: colMenu.y + 'px' }"
        @click.stop
      >
        <button class="menu-item" @click="startRename()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Renomear
        </button>
        <button class="menu-item menu-item-danger" @click="startDelete()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Excluir coluna
        </button>
      </div>
    </Teleport>

    <!-- ── Modal: Renomear ───────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="renameState.open" class="modal-overlay" @click.self="renameState.open = false">
          <div class="modal-box" @click.stop>
            <h3 class="modal-title">Renomear coluna</h3>
            <p class="modal-sub">Todos os lançamentos com este título serão renomeados.</p>
            <input
              ref="renameInputRef"
              v-model="renameState.newTitle"
              type="text"
              class="modal-input"
              placeholder="Novo nome..."
              @keydown.enter.prevent="confirmRename"
              @keydown.escape.prevent="renameState.open = false"
            />
            <div class="modal-footer">
              <button class="btn-cancel" @click="renameState.open = false">Cancelar</button>
              <button class="btn-save" :disabled="!renameState.newTitle.trim()" @click="confirmRename">Renomear</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal: Confirmar exclusão ────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="deleteState.open" class="modal-overlay" @click.self="deleteState.open = false">
          <div class="modal-box" @click.stop>
            <h3 class="modal-title">Excluir coluna</h3>
            <p class="modal-sub">
              Isso excluirá <strong>{{ deleteState.count }} lançamento(s)</strong> com o título
              "<strong>{{ deleteState.title }}</strong>". Esta ação não pode ser desfeita.
            </p>
            <div class="modal-footer">
              <button class="btn-cancel" @click="deleteState.open = false">Cancelar</button>
              <button class="btn-delete" @click="confirmDelete">Excluir</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal: Adicionar coluna ───────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="addState.open" class="modal-overlay" @click.self="addState.open = false">
          <div class="modal-box" @click.stop>
            <h3 class="modal-title">
              Adicionar {{ addState.kind === 'expense' ? 'despesa' : 'receita' }}
            </h3>
            <p class="modal-sub">Cria uma nova coluna na matriz com o nome informado.</p>
            <div style="display: flex; flex-direction: column; gap: 12px">
              <div>
                <label class="modal-label">Título</label>
                <input
                  ref="addTitleInputRef"
                  v-model="addState.title"
                  type="text"
                  class="modal-input"
                  placeholder="Ex.: Aluguel, Salário..."
                  @keydown.enter.prevent="focusAddAmount"
                  @keydown.escape.prevent="addState.open = false"
                />
              </div>
              <div>
                <label class="modal-label">Valor inicial (mês atual, opcional)</label>
                <div style="position: relative">
                  <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; font-weight: 700; color: var(--text3); pointer-events: none">R$</span>
                  <input
                    ref="addAmountInputRef"
                    v-model="addState.amount"
                    type="text"
                    inputmode="decimal"
                    class="modal-input"
                    style="padding-left: 34px"
                    placeholder="0,00"
                    @keydown.enter.prevent="confirmAdd"
                    @keydown.escape.prevent="addState.open = false"
                  />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="addState.open = false">Cancelar</button>
              <button class="btn-save" :disabled="!addState.title.trim()" @click="confirmAdd">Adicionar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import FinanceEntryGrid from '~/features/finance/components/FinanceEntryGrid.vue'
import type { EntryKind, EntryStatus, FinanceEntry } from '#shared/types'

const store    = useFinanceStore()
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
const truncate = (s: string, n = 14) => s.length > n ? s.slice(0, n - 1) + '…' : s

// ─── computed columns & months ───────────────────────────────────────────────

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
  const map  = new Map<string, number>()
  const cnt  = new Map<string, number>()
  const ents = new Map<string, FinanceEntry[]>()
  for (const e of store.entries) {
    const k = `${e.kind}__${e.title}__${e.dueDate.slice(0, 7)}`
    map.set(k,  (map.get(k)  ?? 0) + e.amount)
    cnt.set(k,  (cnt.get(k)  ?? 0) + 1)
    if (!ents.has(k)) ents.set(k, [])
    ents.get(k)!.push(e)
  }
  return { map, cnt, ents }
})

const cellKey         = (kind: string, title: string, month: string) => `${kind}__${title}__${month}`
const getAmount       = (kind: string, title: string, month: string) => amountMap.value.map.get(cellKey(kind, title, month)) ?? 0
const getCellCount    = (kind: string, title: string, month: string) => amountMap.value.cnt.get(cellKey(kind, title, month)) ?? 0
const getCellEntries  = (kind: string, title: string, month: string) => amountMap.value.ents.get(cellKey(kind, title, month)) ?? []

// ─── status por célula ───────────────────────────────────────────────────────

const statusMap = computed(() => {
  const map = new Map<string, 'paid' | 'pending' | 'mixed'>()
  for (const e of store.entries) {
    const k = cellKey(e.kind, e.title, e.dueDate.slice(0, 7))
    const existing = map.get(k)
    const st = e.status === 'paid' ? 'paid' : 'pending'
    if (!existing) { map.set(k, st) }
    else if (existing !== st) { map.set(k, 'mixed') }
  }
  return map
})

const getStatus = (kind: string, title: string, month: string): 'paid' | 'pending' | 'mixed' | null => {
  if (getAmount(kind, title, month) === 0) return null
  return statusMap.value.get(cellKey(kind, title, month)) ?? null
}

const toggleStatus = async (kind: string, title: string, month: string) => {
  const entries = getCellEntries(kind, title, month)
  if (!entries.length) return
  const current = getStatus(kind, title, month)
  const next: EntryStatus = current === 'paid' ? 'pending' : 'paid'
  await store.saveEntriesBatch({ upserts: entries.map(e => ({ ...e, status: next })), deletes: [] })
}

const monthExpenseTotal = (month: string) => expenseColumns.value.reduce((s, c) => s + getAmount('expense', c, month), 0)
const monthIncomeTotal  = (month: string) => incomeColumns.value.reduce((s, c)  => s + getAmount('income',  c, month), 0)
const sobra = (month: string) => monthIncomeTotal(month) - monthExpenseTotal(month)

// ─── inline cell editing ─────────────────────────────────────────────────────

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
  if (isNaN(amount) && raw !== '') return

  const newAmount  = isNaN(amount) ? 0 : Math.max(0, amount)
  const existing   = getCellEntries(kind, title, month)
  const prevAmount = getAmount(kind, title, month)
  if (newAmount === prevAmount) return

  saving.value = true
  try {
    if (existing.length === 0 && newAmount === 0) return

    if (existing.length === 0) {
      const householdId = store.entries[0]?.householdId ?? store.accounts[0]?.householdId ?? 'household-main'
      const newEntry: FinanceEntry = {
        id: crypto.randomUUID(), householdId, ruleId: null, accountId: null, categoryId: null,
        title, description: '', amount: newAmount, kind,
        dueDate: `${month}-01`, competenceDate: `${month}-01`,
        installmentIndex: null, installmentTotal: null,
        status: 'pending', origin: 'manual', excludeFromCalc: false, metadata: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      await store.saveEntriesBatch({ upserts: [newEntry], deletes: [] })
      return
    }

    if (newAmount === 0) {
      await store.saveEntriesBatch({ upserts: [], deletes: existing.map(e => e.id) })
      return
    }

    if (existing.length === 1) {
      await store.saveEntriesBatch({ upserts: [{ ...existing[0]!, amount: newAmount }], deletes: [] })
      return
    }

    await store.saveEntriesBatch({
      upserts: [{ ...existing[0]!, amount: newAmount }],
      deletes: existing.slice(1).map(e => e.id),
    })
  } finally {
    saving.value = false
  }
}

// ─── tooltip ─────────────────────────────────────────────────────────────────

const tooltip = ref({ visible: false, text: '', x: 0, y: 0 })

const showTooltip = (text: string, e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  tooltip.value = { visible: true, text, x: rect.left + rect.width / 2, y: rect.top }
}
const hideTooltip = () => { tooltip.value.visible = false }

// ─── column menu (⋮) ─────────────────────────────────────────────────────────

const colMenu = ref<{ kind: EntryKind; col: string; x: number; y: number } | null>(null)

const openColMenu = (kind: EntryKind, col: string, e: MouseEvent) => {
  hideTooltip()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  colMenu.value = { kind, col, x: rect.left, y: rect.bottom + 4 }
}
const closeColMenu = () => { colMenu.value = null }

// ─── rename ───────────────────────────────────────────────────────────────────

const renameInputRef = ref<HTMLInputElement | null>(null)
const renameState = ref({ open: false, kind: 'expense' as EntryKind, oldTitle: '', newTitle: '' })

const startRename = () => {
  if (!colMenu.value) return
  renameState.value = { open: true, kind: colMenu.value.kind, oldTitle: colMenu.value.col, newTitle: colMenu.value.col }
  colMenu.value = null
  nextTick(() => { renameInputRef.value?.focus(); renameInputRef.value?.select() })
}

const confirmRename = async () => {
  const { kind, oldTitle, newTitle } = renameState.value
  const trimmed = newTitle.trim()
  if (!trimmed || trimmed === oldTitle) { renameState.value.open = false; return }
  const entries = store.entries.filter(e => e.kind === kind && e.title === oldTitle)
  await store.saveEntriesBatch({ upserts: entries.map(e => ({ ...e, title: trimmed })), deletes: [] })
  renameState.value.open = false
}

// ─── delete column ────────────────────────────────────────────────────────────

const deleteState = ref({ open: false, kind: 'expense' as EntryKind, title: '', count: 0 })

const startDelete = () => {
  if (!colMenu.value) return
  const { kind, col } = colMenu.value
  const count = store.entries.filter(e => e.kind === kind && e.title === col).length
  deleteState.value = { open: true, kind, title: col, count }
  colMenu.value = null
}

const confirmDelete = async () => {
  const { kind, title } = deleteState.value
  const entries = store.entries.filter(e => e.kind === kind && e.title === title)
  await store.saveEntriesBatch({ upserts: [], deletes: entries.map(e => e.id) })
  deleteState.value.open = false
}

// ─── add column ───────────────────────────────────────────────────────────────

const addTitleInputRef  = ref<HTMLInputElement | null>(null)
const addAmountInputRef = ref<HTMLInputElement | null>(null)
const addState = ref({ open: false, kind: 'expense' as EntryKind, title: '', amount: '' })

const openAdd = (kind: EntryKind) => {
  addState.value = { open: true, kind, title: '', amount: '' }
  nextTick(() => { addTitleInputRef.value?.focus() })
}

const focusAddAmount = () => { addAmountInputRef.value?.focus() }

const confirmAdd = async () => {
  const { kind, title, amount } = addState.value
  const trimmed = title.trim()
  if (!trimmed) return

  const amt = Math.max(0, parseFloat(amount.replace(',', '.')) || 0)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const householdId = store.entries[0]?.householdId ?? store.accounts[0]?.householdId ?? 'household-main'

  const newEntry: FinanceEntry = {
    id: crypto.randomUUID(), householdId, ruleId: null, accountId: null, categoryId: null,
    title: trimmed, description: '', amount: amt, kind,
    dueDate: `${currentMonth}-01`, competenceDate: `${currentMonth}-01`,
    installmentIndex: null, installmentTotal: null,
    status: 'pending', origin: 'manual', excludeFromCalc: false, metadata: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }

  await store.saveEntriesBatch({ upserts: [newEntry], deletes: [] })
  addState.value.open = false
}

// ─── style helpers ────────────────────────────────────────────────────────────

const BASE_CELL = {
  padding: '5px 10px',
  textAlign: 'right' as const,
  whiteSpace: 'nowrap' as const,
  borderRight: '1px solid var(--border)',
}

const stickyHead = () => ({
  ...BASE_CELL,
  position: 'sticky' as const,
  left: 0, zIndex: 3, top: 0,
  textAlign: 'left' as const,
  background: 'var(--surface2)',
  borderBottom: '2px solid var(--border)',
  padding: '8px 12px',
})

const headCell = (align: 'left' | 'right' = 'right') => ({
  ...BASE_CELL,
  position: 'sticky' as const,
  top: 0, zIndex: 2,
  textAlign: align,
  background: 'var(--surface2)',
  borderBottom: '2px solid var(--border)',
  padding: '0',
  fontWeight: '700',
  fontSize: '11px',
  color: 'var(--text2)',
  minWidth: '90px',
  maxWidth: '130px',
})

const addColHeadStyle = {
  ...BASE_CELL,
  position: 'sticky' as const,
  top: 0, zIndex: 2,
  background: 'var(--surface2)',
  borderBottom: '2px solid var(--border)',
  padding: '4px 8px',
  minWidth: '90px',
  borderRight: 'none',
}

const stickyCell = (even: boolean) => ({
  ...BASE_CELL,
  position: 'sticky' as const,
  left: 0, zIndex: 1,
  textAlign: 'left' as const,
  fontWeight: '700',
  fontSize: '12px',
  color: 'var(--text2)',
  background: even ? 'var(--surface)' : 'var(--surface2)',
  padding: '6px 12px',
})

const statusBg = (status: 'paid' | 'pending' | 'mixed' | null, kind: 'expense' | 'income') => {
  if (!status) return 'transparent'
  if (status === 'paid') return 'color-mix(in srgb, var(--success) 8%, transparent)'
  if (status === 'mixed') return 'color-mix(in srgb, var(--warning) 8%, transparent)'
  return kind === 'income'
    ? 'color-mix(in srgb, var(--warning) 8%, transparent)'
    : 'color-mix(in srgb, var(--danger) 8%, transparent)'
}

const dataCell = (amount: number, isEditing: boolean, status?: 'paid' | 'pending' | 'mixed' | null, kind?: 'expense' | 'income') => ({
  ...BASE_CELL,
  cursor: 'text',
  userSelect: 'none' as const,
  minWidth: '80px',
  maxWidth: '130px',
  padding: '4px 6px 4px 6px',
  color: amount > 0 ? 'var(--text)' : 'var(--border)',
  background: isEditing
    ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))'
    : (amount > 0 && status ? statusBg(status, kind ?? 'expense') : 'transparent'),
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
  width: '80px', border: 'none', outline: 'none',
  background: 'transparent', fontFamily: 'inherit',
  fontSize: '12px', fontWeight: '600',
  textAlign: 'right' as const,
  color: 'var(--text)', display: 'block', padding: '0',
})
</script>

<style scoped>
/* ── Cell content layout ─────────────────────────── */
.cell-content {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-height: 20px;
}
.cell-count {
  font-size: 8px;
  color: var(--text3);
  flex-shrink: 0;
}

/* ── Status dot ──────────────────────────────────── */
.status-dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: transform .12s, opacity .12s;
  opacity: 0.85;
}
.status-dot:hover { transform: scale(1.4); opacity: 1; }

.status-dot--paid      { background: var(--success); }
.status-dot--received  { background: var(--success); }
.status-dot--pending-expense { background: var(--danger); }
.status-dot--pending-income  { background: var(--warning); }
.status-dot--mixed     { background: var(--warning); }

/* ── Column header ───────────────────────────────── */
.col-head {
  display: flex;
  align-items: center;
  padding: 6px 4px 6px 10px;
  gap: 2px;
  height: 100%;
}
.col-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
  cursor: default;
}
.col-menu-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text3);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.12s, background 0.12s;
  font-family: inherit;
  line-height: 1;
}
th:hover .col-menu-btn {
  opacity: 1;
}
.col-menu-btn:hover {
  background: var(--surface);
  color: var(--primary);
}

/* ── Add column button ───────────────────────────── */
.add-col-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px dashed var(--border);
  border-radius: 6px;
  padding: 4px 8px;
  background: transparent;
  color: var(--text3);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: border-color 0.12s, color 0.12s, background 0.12s;
}
.add-col-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-dim);
}

/* ── Dropdown menu items ─────────────────────────── */
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text2);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.1s;
  text-align: left;
}
.menu-item:hover { background: var(--surface2); }
.menu-item-danger { color: var(--danger); }
.menu-item-danger:hover { background: var(--danger-light); }

/* ── Modal ───────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: oklch(0% 0 0 / 0.5);
  backdrop-filter: blur(4px);
}
.modal-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 16px 48px oklch(0% 0 0 / 0.25);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}
.modal-sub {
  font-size: 13px;
  color: var(--text3);
  line-height: 1.5;
}
.modal-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text3);
  margin-bottom: 6px;
}
.modal-input {
  width: 100%;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0 12px;
  height: 44px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
  -webkit-appearance: none;
}
.modal-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-dim);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.btn-cancel {
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0 16px;
  height: 40px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  cursor: pointer;
  font-family: inherit;
  transition: filter 0.12s;
}
.btn-cancel:hover { filter: brightness(0.95); }
.btn-save {
  background: var(--primary);
  border: none;
  border-radius: 10px;
  padding: 0 20px;
  height: 40px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: filter 0.12s;
}
.btn-save:hover { filter: brightness(1.1); }
.btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-delete {
  background: var(--danger);
  border: none;
  border-radius: 10px;
  padding: 0 20px;
  height: 40px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: filter 0.12s;
}
.btn-delete:hover { filter: brightness(1.1); }

/* ── Modal transition ────────────────────────────── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .modal-box, .modal-leave-active .modal-box { transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.95) translateY(6px); }
</style>
