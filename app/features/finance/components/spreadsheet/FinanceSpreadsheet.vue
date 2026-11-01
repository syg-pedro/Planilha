<template>
  <section class="sheet" aria-label="Planilha editável">
    <div class="sheet__bar" role="toolbar" aria-label="Ações da planilha">
      <BaseButton variant="ghost" size="sm" title="Ctrl+Z" :disabled="!history.undoStack.value.length" @click="history.undo()">↶ Desfazer</BaseButton>
      <BaseButton variant="ghost" size="sm" title="Ctrl+Y" :disabled="!history.redoStack.value.length" @click="history.redo()">↷ Refazer</BaseButton>
      <span class="sheet__sep" aria-hidden="true" />
      <UDropdownMenu :items="addItems">
        <BaseButton variant="ghost" size="sm">+ Adicionar</BaseButton>
      </UDropdownMenu>
    </div>

    <div class="sheet__formula">
      <span class="sheet__ref">{{ current.label }}</span>
      <span class="sheet__fx" aria-hidden="true">fx</span>
      <input
        v-model="barText"
        class="sheet__bar-input"
        autocomplete="off"
        aria-label="Conteúdo da célula selecionada"
        :readonly="!barEditable"
        @focus="barTarget = { ...sel }"
        @keydown.enter.prevent="commitBar(true)"
        @keydown.esc.prevent="cancelBar"
        @blur="commitBar(false)"
      >
      <BaseButton variant="ghost" size="sm" :disabled="!payTargets.length" @click="togglePaid">{{ payLabel }}</BaseButton>
    </div>
    <p class="sheet__hint" aria-live="polite">{{ message || hint }}</p>

    <div
      ref="gridEl"
      class="sheet__grid"
      :class="{ 'is-multi': isMulti }"
      tabindex="0"
      aria-label="Planilha. Use as setas para navegar, Enter para editar e Ctrl+C / Ctrl+V para copiar e colar."
      @keydown="onKey"
      @pointerdown="onPointerDown"
      @pointerover="onPointerOver"
      @dblclick="onDoubleClick"
    >
      <table class="sheet__table" aria-label="Despesas por mês">
        <thead>
          <tr>
            <th scope="col" class="sheet__corner">Despesas</th>
            <th
              v-for="(column, index) in model.columns.value"
              :key="column.id"
              scope="col"
              class="sheet__head"
              :class="{ 'is-card': isCardColumn(column), 'is-hl': headLit('D', index + 1) }"
              :data-head="`D:${index + 1}`"
              :title="`${column.title} · duplo clique para renomear`"
            >
              {{ column.title }}<small v-if="isCardColumn(column)">cartão</small>
            </th>
            <th scope="col" class="sheet__head is-sum">Soma</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(line, r) in expenseCells" :key="r" :class="{ 'is-total': r === months.length }">
            <td
              v-for="(item, c) in line"
              :key="c"
              data-b="D"
              :data-r="r"
              :data-c="c"
              :class="cellClass('D', r, c, item)"
              :style="usageStyle(item)"
              :title="cellTitle(item)"
            >
              <input v-if="isEditing('D', r, c)" :ref="setCellInput" v-model="editing!.text" class="sheet__cell-input" autocomplete="off" inputmode="decimal" :aria-label="`Editar ${item.label}`" @blur="commitEdit(true)">
              <template v-else-if="item.kind === 'label' && item.month">{{ sheetMonthName(item.month) }}<span class="sheet__yr">/{{ item.month.slice(2, 4) }}</span><span v-if="item.month === todayMonth" class="sheet__today">hoje</span></template>
              <template v-else><span v-if="(item.count ?? 0) > 1" class="sheet__count">{{ item.count }}</span>{{ display(item) }}</template>
            </td>
          </tr>
        </tbody>
      </table>

      <table class="sheet__table sheet__table--income" aria-label="Receitas por mês">
        <thead>
          <tr>
            <th scope="col" class="sheet__corner">Receitas</th>
            <th v-for="(month, index) in months" :key="month" scope="col" class="sheet__head" :class="{ 'is-hl': headLit('R', index + 1) }" :data-head="`R:${index + 1}`">
              {{ sheetMonthName(month) }}<span class="sheet__yr">/{{ month.slice(2, 4) }}</span><span v-if="month === todayMonth" class="sheet__today">hoje</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(line, r) in incomeCells" :key="r" :class="{ 'is-total': r === model.incomes.value.length + 1 }">
            <td
              v-for="(item, c) in line"
              :key="c"
              data-b="R"
              :data-r="r"
              :data-c="c"
              :class="cellClass('R', r, c, item)"
              :title="cellTitle(item)"
            >
              <input v-if="isEditing('R', r, c)" :ref="setCellInput" v-model="editing!.text" class="sheet__cell-input" autocomplete="off" inputmode="decimal" :aria-label="`Editar ${item.label}`" @blur="commitEdit(true)">
              <template v-else><span v-if="(item.count ?? 0) > 1" class="sheet__count">{{ item.count }}</span>{{ display(item) }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="sheet__foot">
      <p class="sheet__status" aria-live="polite">{{ status }}</p>
      <span class="sheet__legend">
        <span><span class="sheet__count">3</span>célula com vários lançamentos</span>
        <span><span class="sheet__paid-mark">✓</span>pago</span>
        <span>Fundo cinza: calculado</span>
      </span>
    </div>

    <SpreadsheetCellEntries v-if="listRow && list" :row="listRow" :month="list.month" :save="history.saveEntries" @close="closeList" />
    <BaseModal :open="Boolean(namer)" :title="namerTitle" :max-width="420" @close="namer = null">
      <form v-if="namer" id="sheet-namer" novalidate @submit.prevent="submitNamer">
        <BaseInput v-model="namer.text" label="Nome" :error="namer.error" autofocus />
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="namer = null">Cancelar</BaseButton>
        <BaseButton type="submit" form="sheet-namer">Salvar</BaseButton>
      </template>
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRef, watch, type ComponentPublicInstance } from 'vue'
import { matrixCardCommitment, sumMoney, type MatrixRow } from '#shared/matrix'
import { parseSheetInput } from '#shared/spreadsheet'
import type { EntryKind, FinanceEntry, PeriodMode } from '#shared/types'
import { useFinanceStore } from '../../stores/useFinanceStore'
import { useCurrency } from '../../composables/useCurrency'
import { useSpreadsheetHistory } from '../../composables/useSpreadsheetHistory'
import { useSpreadsheetEdits } from '../../composables/useSpreadsheetEdits'
import { isCardColumn, sheetMonthName, useSpreadsheetModel, type SheetBlock, type SheetCell } from '../../composables/useSpreadsheetModel'
import SpreadsheetCellEntries from './SpreadsheetCellEntries.vue'

const props = defineProps<{ entries: FinanceEntry[]; months: string[]; dateMode: PeriodMode; todayMonth: string }>()
// O mês da célula selecionada vira o mês do botão "Novo lançamento".
const emit = defineEmits<{ focusMonth: [month: string] }>()
const store = useFinanceStore()
const { format: fmt } = useCurrency()
const months = toRef(props, 'months')
const model = useSpreadsheetModel(toRef(props, 'entries'), months, toRef(props, 'dateMode'))
const history = useSpreadsheetHistory()
const edits = useSpreadsheetEdits(months, history)

const range = (count: number) => Array.from({ length: count }, (_, index) => index)
const expenseCells = computed(() => { const d = model.dims('D'); return range(d.rows).map((r) => range(d.cols).map((c) => model.cell('D', r, c))) })
const incomeCells = computed(() => { const d = model.dims('R'); return range(d.rows).map((r) => range(d.cols).map((c) => model.cell('R', r, c))) })
const cellAt = (b: SheetBlock, r: number, c: number) => (b === 'D' ? expenseCells.value : incomeCells.value)[r]?.[c] ?? model.cell(b, r, c)

// ---------- seleção ----------
interface Selection { b: SheetBlock; r: number; c: number; ar: number; ac: number }
const todayRow = Math.max(0, props.months.indexOf(props.todayMonth))
const sel = ref<Selection>({ b: 'D', r: todayRow, c: 1, ar: todayRow, ac: 1 })
const bounds = computed(() => ({
  r1: Math.min(sel.value.r, sel.value.ar), r2: Math.max(sel.value.r, sel.value.ar),
  c1: Math.min(sel.value.c, sel.value.ac), c2: Math.max(sel.value.c, sel.value.ac),
}))
const isMulti = computed(() => bounds.value.r1 !== bounds.value.r2 || bounds.value.c1 !== bounds.value.c2)
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const selectedCells = computed(() => {
  const { r1, r2, c1, c2 } = bounds.value
  return range(r2 - r1 + 1).flatMap((dr) => range(c2 - c1 + 1).map((dc) => cellAt(sel.value.b, r1 + dr, c1 + dc)))
})
const current = computed(() => cellAt(sel.value.b, sel.value.r, sel.value.c))
watch(() => current.value.month, (month) => { if (month) emit('focusMonth', month) })
watch(() => [model.dims('D'), model.dims('R')], () => {
  const d = model.dims(sel.value.b)
  sel.value = { ...sel.value, r: clamp(sel.value.r, 0, d.rows - 1), ar: clamp(sel.value.ar, 0, d.rows - 1), c: clamp(sel.value.c, 0, d.cols - 1), ac: clamp(sel.value.ac, 0, d.cols - 1) }
})

const gridEl = ref<HTMLElement | null>(null)
const focusGrid = () => gridEl.value?.focus({ preventScroll: true })
const cellElement = (b: SheetBlock, r: number, c: number) => gridEl.value?.querySelector<HTMLElement>(`[data-b="${b}"][data-r="${r}"][data-c="${c}"]`)
function move(dr: number, dc: number, extend: boolean) {
  let { b, r, c } = sel.value
  r += dr
  c += dc
  if (!extend && b === 'D' && r >= model.dims('D').rows) { b = 'R'; r = 0; c = Math.min(c, model.dims('R').cols - 1) }
  else if (!extend && b === 'R' && r < 0) { b = 'D'; r = model.dims('D').rows - 1; c = Math.min(c, model.dims('D').cols - 1) }
  const d = model.dims(b)
  r = clamp(r, 0, d.rows - 1)
  c = clamp(c, 0, d.cols - 1)
  sel.value = extend ? { ...sel.value, r, c } : { b, r, c, ar: r, ac: c }
  nextTick(() => cellElement(sel.value.b, sel.value.r, sel.value.c)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
}
function selectColumn(b: SheetBlock, c: number) {
  const last = b === 'D' ? props.months.length - 1 : model.dims('R').rows - 1
  sel.value = { b, r: 0, c, ar: last, ac: c }
}
const inRange = (b: SheetBlock, r: number, c: number) =>
  b === sel.value.b && r >= bounds.value.r1 && r <= bounds.value.r2 && c >= bounds.value.c1 && c <= bounds.value.c2
const headLit = (b: SheetBlock, c: number) => b === sel.value.b && c >= bounds.value.c1 && c <= bounds.value.c2

// ---------- aparência ----------
const isNumeric = (item: SheetCell) => item.kind === 'value' || item.kind === 'calc' || item.kind === 'limit'
const display = (item: SheetCell) => typeof item.value === 'number' ? fmt(item.value) : (item.value ?? '')
const rawOf = (item: SheetCell) => typeof item.value === 'number'
  ? item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })
  : String(item.value ?? '')
function cellClass(b: SheetBlock, r: number, c: number, item: SheetCell) {
  return [`k-${item.kind}`, {
    'is-label': c === 0,
    'is-num': isNumeric(item),
    'is-sel': inRange(b, r, c),
    'is-cur': b === sel.value.b && r === sel.value.r && c === sel.value.c,
    'is-paid': item.status === 'paid',
    'is-partial': item.status === 'mixed',
    'is-neg': typeof item.value === 'number' && item.value < 0,
    'is-strong': item.strong,
    'is-positive': item.tone === 'positive',
    'is-negative': item.tone === 'negative',
    'is-sum': b === 'D' && c === model.dims('D').cols - 1,
    'is-today': c === 0 && item.month === props.todayMonth,
  }]
}
const commitment = (row: MatrixRow) => matrixCardCommitment(store.entries, row.account!)
function usageStyle(item: SheetCell) {
  if (item.kind !== 'limit' || !item.value || !item.row?.account) return undefined
  const used = commitment(item.row).committed
  return { '--use': `${clamp(used / Number(item.value) * 100, 0, 100).toFixed(1)}%`, '--use-color': used > Number(item.value) ? 'var(--danger)' : 'var(--primary)' }
}
function cellTitle(item: SheetCell) {
  if (item.kind === 'limit' && item.value != null && item.row?.account) {
    const { committed, available } = commitment(item.row)
    return `Comprometido: ${fmt(committed)} · disponível: ${available == null ? '—' : fmt(available)}`
  }
  if (item.opensList) return `${item.count ? `${item.count} lançamento(s) · ` : ''}Enter ou duplo clique abre a lista`
  return undefined
}
const statusText = (item: SheetCell) => item.status === 'paid' ? 'pago' : item.status === 'mixed' ? 'parcialmente pago' : item.status === 'review' ? 'em revisão' : 'pendente'
const hint = computed(() => {
  const item = current.value
  if (item.kind === 'value') {
    if (item.opensList) return isCardColumn(item.row!)
      ? `Fatura com ${item.count ?? 0} lançamento(s) · ${item.count ? statusText(item) : 'vazia'}. Enter ou duplo clique abre a lista de compras.`
      : `${item.count} lançamentos neste mês · ${statusText(item)}. Enter abre a lista.`
    return item.value == null ? 'Vazio. Digite um valor para criar um lançamento neste mês.'
      : `Lançamento ${statusText(item)}. Editar aqui muda o mesmo lançamento em todo o app.`
  }
  if (item.kind === 'limit') {
    if (item.value == null) return `Sem limite cadastrado para ${item.row!.title}.`
    const { committed, available } = commitment(item.row!)
    return `Limite do cartão. Comprometido com lançamentos pendentes: ${fmt(committed)} · disponível: ${available == null ? '—' : fmt(available)}.`
  }
  if (item.kind === 'due') return isCardColumn(item.row!) ? 'Dia de vencimento do cartão.' : 'Dia de vencimento dos lançamentos pendentes desta coluna no período.'
  if (item.kind === 'calc') return 'Calculado automaticamente. Para mudar, edite as células que formam este valor.'
  if (item.kind === 'label' && item.row) return 'Enter ou duplo clique para renomear esta receita.'
  return ''
})
const status = computed(() => {
  const values = selectedCells.value.filter((item) => typeof item.value === 'number' && isNumeric(item)).map((item) => item.value as number)
  if (selectedCells.value.length < 2 || !values.length) return 'Arraste ou use Shift + setas para ver soma e média da seleção.'
  const sum = sumMoney(values)
  return `${selectedCells.value.length} células · Soma ${fmt(sum)} · Média ${fmt(sum / values.length)} · Mín ${fmt(Math.min(...values))} · Máx ${fmt(Math.max(...values))}`
})
const message = ref('')
let messageTimer: ReturnType<typeof setTimeout> | undefined
function flash(text: string) {
  message.value = text
  clearTimeout(messageTimer)
  messageTimer = setTimeout(() => { message.value = '' }, 5000)
}

// ---------- pago ----------
const payTargets = computed(() => selectedCells.value.filter((item) => item.kind === 'value' && (item.count ?? 0) > 0))
const payLabel = computed(() => payTargets.value.length && payTargets.value.every((item) => item.status === 'paid')
  ? 'Voltar para pendente' : payTargets.value.length > 1 ? `Marcar ${payTargets.value.length} como pagos` : 'Marcar como pago')
const togglePaid = () => { void edits.togglePaid(payTargets.value); focusGrid() }

// ---------- edição na célula ----------
const editing = ref<{ b: SheetBlock; r: number; c: number; text: string; typed: boolean } | null>(null)
let cellInput: HTMLInputElement | null = null
const setCellInput = (element: Element | ComponentPublicInstance | null) => { cellInput = element as HTMLInputElement | null }
const isEditing = (b: SheetBlock, r: number, c: number) => editing.value?.b === b && editing.value.r === r && editing.value.c === c

function startEdit(initial?: string) {
  const item = current.value
  if (item.opensList) return openList(item)
  if (item.kind === 'label' && item.row) return openNamer(item.row.kind, item.row)
  if (!item.editable) return flash(item.kind === 'calc' ? 'Esta célula é calculada. Edite os valores que formam ela.' : 'Esta célula não é editável.')
  sel.value = { ...sel.value, ar: sel.value.r, ac: sel.value.c }
  editing.value = { b: sel.value.b, r: sel.value.r, c: sel.value.c, text: initial ?? rawOf(item), typed: initial !== undefined }
  nextTick(() => {
    if (!cellInput) return
    cellInput.focus()
    if (initial === undefined) cellInput.select()
  })
}
/** Retorna false quando o texto é inválido; a edição continua aberta para corrigir. */
function commitCell(item: SheetCell, text: string): boolean {
  if (text === rawOf(item)) return true
  let problem: string | null = null
  if (item.kind === 'value') {
    const value = parseSheetInput(text)
    if (Number.isNaN(value)) problem = 'Não entendi esse valor. Use 1.400,00, 1400 ou uma conta como =50+60.'
    else void edits.setValue(item, value)
  } else if (item.kind === 'limit') problem = edits.setLimit(item.row!, text)
  else if (item.kind === 'due') problem = edits.setDueDay(item.row!, text)
  if (problem) flash(problem)
  return !problem
}
function commitEdit(fromBlur = false): boolean {
  const state = editing.value
  if (!state) return true
  const ok = commitCell(cellAt(state.b, state.r, state.c), state.text)
  if (ok || fromBlur) editing.value = null
  if (fromBlur) return ok
  if (ok) focusGrid()
  else nextTick(() => cellInput?.focus())
  return ok
}
function onEditKey(event: KeyboardEvent) {
  const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
  if (event.key === 'Escape') { editing.value = null; focusGrid() }
  else if (event.key === 'Enter') { if (commitEdit()) move(event.shiftKey ? -1 : 1, 0, false) }
  else if (event.key === 'Tab') { if (commitEdit()) move(0, event.shiftKey ? -1 : 1, false) }
  else if (editing.value?.typed && arrows[event.key]) { if (commitEdit()) move(...arrows[event.key]!, false) }
  else return
  event.preventDefault()
}

// ---------- barra de fórmula ----------
const barText = ref('')
const barTarget = ref<Selection | null>(null)
const barEditable = computed(() => Boolean(current.value.editable) && ['value', 'limit', 'due'].includes(current.value.kind))
watch(current, (item) => {
  if (barTarget.value) return
  barText.value = item.kind === 'calc' ? item.formula ?? '' : item.opensList ? display(item) : rawOf(item)
}, { immediate: true })
function commitBar(andFocus: boolean) {
  const target = barTarget.value
  if (!target) return
  const item = cellAt(target.b, target.r, target.c)
  if (andFocus && item.opensList) return openList(item)
  if (!item.editable || commitCell(item, barText.value)) {
    barTarget.value = null
    if (andFocus) focusGrid()
  }
}
function cancelBar() {
  barTarget.value = null
  barText.value = rawOf(current.value)
  focusGrid()
}

// ---------- operações em intervalo ----------
function clearRange() {
  const editable = selectedCells.value.filter((item) => item.kind === 'value' && item.editable && item.value !== null)
  const skipped = selectedCells.value.filter((item) => item.opensList && item.count).length
  if (editable.length) void edits.setMany(editable.map((cell) => ({ cell, value: null })), `${editable.length === 1 ? 'Célula limpa' : `${editable.length} células limpas`}`)
  if (skipped) flash(`${skipped} célula(s) com lista de lançamentos ficaram como estavam. Abra a lista para excluir.`)
}
function fillDown() {
  let { r1 } = bounds.value
  const { r2, c1, c2 } = bounds.value
  if (r1 === r2) r1 -= 1
  if (r1 < 0) return
  const changes = range(c2 - c1 + 1).flatMap((dc) => {
    const source = cellAt(sel.value.b, r1, c1 + dc)
    if (source.kind !== 'value' || source.opensList) return []
    return range(r2 - r1).map((dr) => ({ cell: cellAt(sel.value.b, r1 + 1 + dr, c1 + dc), value: source.value as number | null }))
  })
  if (changes.length) void edits.setMany(changes, `Preenchido para baixo (${changes.length} célula(s))`)
}
function rangeText() {
  const { r1, r2, c1, c2 } = bounds.value
  return range(r2 - r1 + 1).map((dr) => range(c2 - c1 + 1).map((dc) => {
    const item = cellAt(sel.value.b, r1 + dr, c1 + dc)
    return item.kind === 'label' ? item.label : rawOf(item)
  }).join('\t')).join('\n')
}
function paste(text: string) {
  const grid = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((line) => line.split('\t'))
  const { r1, r2, c1, c2 } = bounds.value
  const single = grid.length === 1 && grid[0]!.length === 1
  const rows = single ? r2 - r1 + 1 : grid.length
  const cols = single ? c2 - c1 + 1 : Math.max(...grid.map((line) => line.length))
  const d = model.dims(sel.value.b)
  const changes: { cell: SheetCell; value: number | null }[] = []
  let skipped = 0
  for (const dr of range(rows)) for (const dc of range(cols)) {
    const r = r1 + dr, c = c1 + dc
    const raw = single ? grid[0]![0] : grid[dr]?.[dc]
    if (r >= d.rows || c >= d.cols || raw === undefined) continue
    const item = cellAt(sel.value.b, r, c), value = parseSheetInput(raw)
    if (item.kind !== 'value' || !item.editable || Number.isNaN(value)) skipped++
    else changes.push({ cell: item, value })
  }
  sel.value = { ...sel.value, r: r1, c: c1, ar: Math.min(r1 + rows - 1, d.rows - 1), ac: Math.min(c1 + cols - 1, d.cols - 1) }
  if (changes.length) void edits.setMany(changes, `${changes.length} célula(s) colada(s)`)
  if (skipped) flash(`${skipped} célula(s) ignorada(s): calculadas, com lista de lançamentos ou sem número.`)
}

// ---------- teclado e mouse ----------
function onKey(event: KeyboardEvent) {
  if (editing.value) return onEditKey(event)
  if (event.target !== gridEl.value) return
  const key = event.key
  if (event.ctrlKey || event.metaKey) {
    const lower = key.toLowerCase()
    if (lower === 'z' && event.shiftKey) history.redo()
    else if (lower === 'z') history.undo()
    else if (lower === 'y') history.redo()
    else if (lower === 'd') fillDown()
    else if (lower === 'a') { const d = model.dims(sel.value.b); sel.value = { ...sel.value, r: d.rows - 1, c: d.cols - 1, ar: 0, ac: 1 } }
    else return
    event.preventDefault()
    return
  }
  const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
  if (arrows[key]) move(...arrows[key]!, event.shiftKey)
  else if (key === 'Tab') move(0, event.shiftKey ? -1 : 1, false)
  else if (key === 'Enter' || key === 'F2') startEdit()
  else if (key === 'Delete' || key === 'Backspace') clearRange()
  else if (key === 'Escape') sel.value = { ...sel.value, ar: sel.value.r, ac: sel.value.c }
  else if (key.length === 1 && !event.altKey) startEdit(key)
  else return
  event.preventDefault()
}
let dragging = false
function onPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (target.closest('.sheet__cell-input')) return
  if (editing.value && !commitEdit(true)) return
  const head = target.closest<HTMLElement>('[data-head]')
  if (head) {
    const [b, c] = head.dataset.head!.split(':') as [SheetBlock, string]
    selectColumn(b, Number(c))
    event.preventDefault()
    focusGrid()
    return
  }
  const cell = target.closest<HTMLElement>('[data-b]')
  if (!cell) return
  const b = cell.dataset.b as SheetBlock, r = Number(cell.dataset.r), c = Number(cell.dataset.c)
  const same = sel.value.b === b && sel.value.r === r && sel.value.c === c && !isMulti.value
  sel.value = event.shiftKey && b === sel.value.b ? { ...sel.value, r, c } : { b, r, c, ar: r, ac: c }
  // Clicar de novo na célula já selecionada também define o mês do botão "Novo lançamento".
  const clickedMonth = cellAt(b, r, c).month
  if (clickedMonth) emit('focusMonth', clickedMonth)
  if (event.pointerType === 'mouse') {
    dragging = true
    event.preventDefault()
  }
  focusGrid()
  // No toque, o segundo toque na mesma célula abre a edição.
  if (event.pointerType !== 'mouse' && same) startEdit()
}
function onPointerOver(event: PointerEvent) {
  if (!dragging) return
  const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-b]')
  if (!cell || cell.dataset.b !== sel.value.b) return
  const r = Number(cell.dataset.r), c = Number(cell.dataset.c)
  if (r !== sel.value.r || c !== sel.value.c) sel.value = { ...sel.value, r, c }
}
const stopDrag = () => { dragging = false }
function onDoubleClick(event: MouseEvent) {
  const head = (event.target as HTMLElement).closest<HTMLElement>('[data-head^="D:"]')
  if (head) {
    const column = model.columns.value[Number(head.dataset.head!.slice(2)) - 1]
    if (column) openNamer('expense', column)
    return
  }
  if ((event.target as HTMLElement).closest('[data-b]') && !editing.value) startEdit()
}
function onClipboard(event: ClipboardEvent) {
  if (document.activeElement !== gridEl.value || !event.clipboardData) return
  event.preventDefault()
  if (event.type === 'paste') return paste(event.clipboardData.getData('text/plain'))
  event.clipboardData.setData('text/plain', rangeText())
  if (event.type === 'cut') clearRange()
  else flash('Copiado. Dá para colar aqui ou no Google Sheets.')
}
onMounted(() => {
  window.addEventListener('pointerup', stopDrag)
  for (const type of ['copy', 'cut', 'paste'] as const) document.addEventListener(type, onClipboard)
})
onBeforeUnmount(() => {
  clearTimeout(messageTimer)
  history.dispose()
  window.removeEventListener('pointerup', stopDrag)
  for (const type of ['copy', 'cut', 'paste'] as const) document.removeEventListener(type, onClipboard)
})

// ---------- lista de lançamentos da célula ----------
const list = ref<{ rowId: string; month: string } | null>(null)
const listRow = computed(() => list.value
  ? [...model.columns.value, ...model.incomes.value].find((row) => row.id === list.value!.rowId) ?? null
  : null)
function openList(item: SheetCell) {
  if (item.row && item.month) list.value = { rowId: item.row.id, month: item.month }
}
function closeList() {
  list.value = null
  focusGrid()
}
watch(listRow, (row) => { if (list.value && !row) closeList() })

// ---------- nomes de colunas e receitas ----------
const addItems = [
  { label: 'Coluna de despesa', icon: 'i-lucide-columns-3', onSelect: () => openNamer('expense') },
  { label: 'Linha de receita', icon: 'i-lucide-rows-3', onSelect: () => openNamer('income') },
]
const namer = ref<{ kind: EntryKind; row?: MatrixRow; text: string; error: string } | null>(null)
const namerTitle = computed(() => namer.value?.row ? 'Renomear' : namer.value?.kind === 'income' ? 'Nova linha de receita' : 'Nova coluna de despesa')
function openNamer(kind: EntryKind, row?: MatrixRow) {
  namer.value = { kind, row, text: row?.title ?? '', error: '' }
}
function submitNamer() {
  const state = namer.value
  if (!state) return
  const title = state.text.trim()
  if (!title) {
    state.error = 'Informe um nome.'
    return
  }
  namer.value = null
  if (state.row && !state.row.id.startsWith('draft:')) {
    if (title !== state.row.title) void edits.rename(state.row, title)
    return
  }
  model.addDraft(title, state.kind, state.row?.title)
  nextTick(() => {
    if (state.kind === 'income') sel.value = { b: 'R', r: model.incomes.value.length, c: 1, ar: model.incomes.value.length, ac: 1 }
    else selectColumn('D', model.columns.value.findIndex((row) => row.title === title && !isCardColumn(row)) + 1)
    focusGrid()
    flash(`“${title}” criada. Digite um valor em qualquer mês para salvar.`)
  })
}
</script>

<style scoped>
.sheet { display: grid; gap: var(--ds-space-3); min-width: 0; }
.sheet__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-2); }
.sheet__sep { width: 1px; height: 20px; background: var(--border-strong); }
.sheet__foot { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 16px; }
.sheet__legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-left: auto; font-size: 12px; color: var(--text3); align-items: center; }
.sheet__formula { display: grid; grid-template-columns: minmax(120px, 230px) auto 1fr auto; align-items: stretch; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface); overflow: hidden; }
.sheet__ref { padding: 6px 10px; font-size: 13px; font-weight: 600; color: var(--text); border-right: 1px solid var(--border); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sheet__fx { padding: 6px 10px; font-style: italic; color: var(--text3); border-right: 1px solid var(--border); }
.sheet__bar-input { min-width: 0; border: 0; padding: 6px 10px; font: inherit; font-size: 13px; font-variant-numeric: tabular-nums; color: var(--text); background: transparent; }
.sheet__bar-input:focus { outline: 2px solid var(--primary); outline-offset: -2px; }
.sheet__bar-input[readonly] { color: var(--text3); }
.sheet__hint, .sheet__status { margin: 0; min-height: 1.3em; font-size: 12px; color: var(--text3); font-variant-numeric: tabular-nums; }
.sheet__grid { position: relative; overflow: auto; max-height: min(72vh, 900px); border: 1px solid var(--border-strong); border-radius: var(--radius); background: var(--surface); outline: none; }
.sheet__grid:focus-visible { box-shadow: var(--ds-focus-ring); border-color: var(--primary); }
.sheet__table { border-collapse: separate; border-spacing: 0; font-size: 13px; font-variant-numeric: tabular-nums; }
.sheet__table--income { margin-top: var(--ds-space-8); border-top: 1px solid var(--border-strong); }
.sheet__table th, .sheet__table td { height: 30px; padding: 0 8px; white-space: nowrap; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); background-clip: padding-box; }
.sheet__table td { background: var(--surface); color: var(--text); cursor: cell; user-select: none; }
.sheet__table thead th { position: sticky; top: 0; z-index: 3; min-width: 112px; max-width: 140px; padding: 6px; white-space: normal; line-height: 1.2; text-align: center; font-weight: 600; color: var(--text); background: var(--surface2); }
.sheet__head { cursor: pointer; user-select: none; }
.sheet__head small { display: block; font-size: 11px; font-weight: 500; color: var(--text3); }
.sheet__head.is-card { box-shadow: inset 0 3px 0 var(--accent); }
.sheet__head.is-hl { box-shadow: inset 0 -2px 0 var(--primary); }
.sheet__head.is-card.is-hl { box-shadow: inset 0 3px 0 var(--accent), inset 0 -2px 0 var(--primary); }
.sheet__corner { left: 0; z-index: 4 !important; text-align: left !important; min-width: 140px !important; }
.sheet__table td.is-label { position: sticky; left: 0; z-index: 2; min-width: 140px; font-weight: 600; background: var(--bg2); }
.sheet__table td.is-num { min-width: 112px; text-align: right; }
.sheet__table td.k-due { min-width: 112px; text-align: center; color: var(--text2); }
.sheet__table td.k-calc, .sheet__table td.k-blank, .sheet__table td.is-sum { background: var(--bg2); }
/* A Soma do mês fica sempre visível, como a coluna congelada de uma planilha. */
.sheet__table td.is-sum, .sheet__head.is-sum { position: sticky; right: 0; z-index: 2; box-shadow: inset 1px 0 0 var(--border-strong); }
.sheet__head.is-sum { z-index: 4; }
.sheet__table td.is-strong { font-weight: 700; }
.sheet__table tr.is-total > * { border-top: 2px solid var(--border-strong); font-weight: 700; }
.sheet__table td.is-neg { color: var(--ds-text-danger); }
.sheet__table td.is-positive { color: var(--ds-text-success); background: var(--success-light); }
.sheet__table td.is-negative { color: var(--ds-text-danger); background: var(--danger-light); }
.sheet__table td.is-paid { color: var(--text3); }
.sheet__table td.is-paid::before { content: '✓'; margin-right: 6px; color: var(--ds-text-success); font-weight: 700; }
.sheet__table td.is-partial::before { content: '◐'; margin-right: 6px; color: var(--warning); }
.sheet__table td.k-limit[style] { background-image: linear-gradient(var(--use-color), var(--use-color)); background-size: var(--use) 3px; background-repeat: no-repeat; background-position: left bottom; }
.sheet__grid.is-multi td.is-sel { background-image: linear-gradient(var(--primary-dim), var(--primary-dim)); background-size: auto; }
.sheet__table td.is-cur { outline: 2px solid var(--primary); outline-offset: -2px; }
.sheet__table td.is-today { box-shadow: inset 3px 0 0 var(--primary); }
.sheet__yr { font-weight: 400; font-size: 0.85em; color: var(--text3); }
.sheet__today { margin-left: 6px; padding: 0 5px; border-radius: var(--radius-xs); font-size: 11px; font-weight: 600; color: var(--primary); background: var(--primary-dim); vertical-align: 1px; }
.sheet__count { display: inline-block; min-width: 18px; margin-right: 6px; padding: 0 5px; border-radius: var(--radius-xs); font-size: 11px; font-weight: 600; line-height: 16px; text-align: center; color: var(--primary); background: var(--primary-dim); }
.sheet__paid-mark { margin-right: 4px; color: var(--ds-text-success); font-weight: 700; }
.sheet__cell-input { width: 100%; min-width: 104px; height: 28px; padding: 0 6px; border: 0; font: inherit; font-variant-numeric: tabular-nums; text-align: right; color: var(--text); background: var(--surface); outline: 2px solid var(--primary); outline-offset: -2px; }
.sheet__table td:has(> .sheet__cell-input) { padding: 0; }
@media (max-width: 767px) {
  .sheet__formula { grid-template-columns: 1fr auto; }
  .sheet__ref { grid-column: 1 / -1; border-right: 0; border-bottom: 1px solid var(--border); }
  .sheet__fx { display: none; }
  .sheet__legend { margin-left: 0; }
}
</style>
