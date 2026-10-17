<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
  <div ref="host" class="annual-scroll" :style="{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }">
    <table class="annual-table" :class="{ 'annual-table--month': months.length === 1 }">
      <caption class="sr-only">
        Planilha financeira.
        {{
          filtered ? 'Totais dos lançamentos filtrados.' : 'Totais do período.'
        }}
        Use as setas para navegar e Enter ou F2 para editar.
      </caption>
      <thead>
        <tr>
          <th class="annual-name" scope="col">Descrição / vencimento</th>
          <th v-if="metadata" scope="col" class="annual-limit">Limite</th>
          <th
            v-for="month in months"
            :key="month"
            scope="col"
            class="annual-month"
            :class="{ 'annual-current': month === todayMonth }"
          >
            <div class="annual-month-heading">
              <span>{{ shortMonth(month) }}</span
              ><button
                type="button"
                class="annual-menu-trigger"
                :aria-label="`Opções de ${shortMonth(month)}`"
                @click="$emit('monthOptions', month)"
              >
                ⋮
              </button>
            </div>
          </th>
          <th v-if="metadata" scope="col" class="annual-total">Período</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="group in groups" :key="group.id">
          <tr class="annual-group">
            <th class="annual-name" :colspan="metadata ? 2 : 1" scope="row">
              <button
                type="button"
                :aria-expanded="!collapsed.includes(group.id)"
                @click="$emit('collapse', group.id)"
              >
                {{ collapsed.includes(group.id) ? '▸' : '▾' }} {{ group.label }}
                <span>({{ group.rows.length }})</span>
              </button>
            </th>
            <td v-for="month in months" :key="month">
              {{ number(sumMoney(group.rows.map((row) => row.cells[month]!.amount))) }}
            </td>
            <td v-if="metadata" class="annual-total">
              {{ number(sumMoney(group.rows.map((row) => row.total))) }}
            </td>
          </tr>
          <template v-if="!collapsed.includes(group.id)">
            <tr
              v-for="row in group.rows"
              :key="row.id"
              :class="{
                'annual-excluded': row.group === 'excluded',
                'annual-saved': row.entries.some((entry) => highlighted.includes(entry.id))
              }"
            >
              <th class="annual-name" scope="row">
                <div class="annual-row-name">
                  <button
                    type="button"
                    class="annual-row-title"
                    :title="row.title"
                    @click="$emit('inspect', row)"
                  >
                    {{ row.title }}</button
                  ><button
                    type="button"
                    class="annual-menu-trigger"
                    :aria-label="`Ações de ${row.title}`"
                    @click="$emit('rowOptions', row)"
                  >
                    ⋮
                  </button>
                </div>
                <span class="annual-row-caption" :title="dueCaption(row)">{{ dueCaption(row) }}</span>
              </th>
              <td v-if="metadata" class="annual-limit">
                {{
                  row.group === 'cards' && row.account?.limitTotal != null
                    ? number(row.account.limitTotal)
                    : '—'
                }}
              </td>
              <td
                v-for="month in months"
                :key="month"
                class="annual-cell"
                :class="{
                  'annual-current': month === todayMonth,
                  'annual-cell--selected': selected.has(key(row, month)),
                  'annual-cell--active': active?.rowId === row.id && active?.month === month
                }"
                @pointerdown="$emit('dragStart', row, month, $event)"
                @pointerenter="$emit('dragMove', row, month, $event)"
              >
                <button
                  type="button"
                  class="annual-value"
                  :data-row="row.id"
                  :data-month="month"
                  :tabindex="isFocus(row, month) ? 0 : -1"
                  :aria-label="cellLabel(row, month)"
                  :aria-pressed="
                    selecting
                      ? selected.has(key(row, month))
                      : active?.rowId === row.id && active?.month === month
                  "
                  @focus="focus = { rowId: row.id, month }"
                  @click="$emit('cell', row, month, $event)"
                  @dblclick="$emit('edit', row, month)"
                  @keydown="keydown(row, month, $event)"
                >
                  <span v-if="selecting" class="annual-selection-mark" aria-hidden="true">{{
                    selected.has(key(row, month)) ? '☑' : '☐'
                  }}</span
                  ><span
                    v-if="row.cells[month]!.entries.length"
                    class="annual-status"
                    :class="`annual-status--${row.cells[month]!.status}`"
                    aria-hidden="true"
                    >{{ symbol(row.cells[month]!) }}</span
                  ><span>{{ row.cells[month]!.entries.length ? number(row.cells[month]!.amount) : '—' }}</span
                  ><sup v-if="row.cells[month]!.entries.length > 1">{{
                    row.cells[month]!.entries.length
                  }}</sup>
                </button>
              </td>
              <td v-if="metadata" class="annual-total">{{ number(row.total) }}</td>
            </tr>
          </template>
        </template>
        <tr v-if="!groups.length">
          <td :colspan="months.length + (metadata ? 3 : 1)" class="annual-empty">
            Nenhum lançamento encontrado. Ajuste os filtros ou crie seu primeiro lançamento.
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr
          v-for="(item, index) in totalRows"
          :key="item.key"
          :class="{ 'annual-net': item.key === 'net' }"
          :style="{ '--footer-offset': `${(2 - index) * 28}px` }"
        >
          <th class="annual-name" scope="row" :colspan="metadata ? 2 : 1">{{ item.label }}</th>
          <td v-for="month in months" :key="month">{{ number(summaries[month]?.[item.key] ?? 0) }}</td>
          <td v-if="metadata" class="annual-total">
            {{ number(sumMoney(Object.values(summaries).map((summary) => summary[item.key]))) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
  </UCard>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  sumMoney,
  type MatrixGroup,
  type MatrixMonthSummary,
  type MatrixRow,
  type MatrixValue
} from '#shared/matrix'
import { matrixCellKey } from '../composables/useMatrixSelection'
const props = defineProps<{
  groups: { id: MatrixGroup; label: string; rows: MatrixRow[] }[]
  months: string[]
  summaries: Record<string, MatrixMonthSummary>
  collapsed: MatrixGroup[]
  selected: Set<string>
  selecting: boolean
  active: { rowId: string; month: string } | null
  metadata: boolean
  todayMonth: string
  maxHeight: number | null
  filtered: boolean
  highlighted: string[]
}>()
const emit = defineEmits<{
  cell: [row: MatrixRow, month: string, event: MouseEvent]
  edit: [row: MatrixRow, month: string]
  inspect: [row: MatrixRow]
  rowOptions: [row: MatrixRow]
  monthOptions: [month: string]
  collapse: [id: MatrixGroup]
  dragStart: [row: MatrixRow, month: string, event: PointerEvent]
  dragMove: [row: MatrixRow, month: string, event: PointerEvent]
}>()
const host = ref<HTMLElement | null>(null),
  focus = ref<{ rowId: string; month: string } | null>(null)
const rows = computed(() =>
  props.groups.filter((group) => !props.collapsed.includes(group.id)).flatMap((group) => group.rows)
)
watch(
  [rows, () => props.months],
  () => {
    if (
      !rows.value.some((row) => row.id === focus.value?.rowId) ||
      !props.months.includes(focus.value?.month ?? '')
    )
      focus.value =
        rows.value[0] && props.months[0] ? { rowId: rows.value[0].id, month: props.months[0] } : null
  },
  { immediate: true }
)
const isFocus = (row: MatrixRow, month: string) =>
  focus.value?.rowId === row.id && focus.value?.month === month
const number = (amount: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
const shortMonth = (month: string) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(
    new Date(`${month}-01T12:00:00Z`)
  )
const key = (row: MatrixRow, month: string) => matrixCellKey({ kind: row.kind, title: row.id, month })
const dueCaption = (row: MatrixRow) => {
  const days = row.dueDays.length ? row.dueDays : row.account?.dueDay ? [row.account.dueDay] : []
  return `${row.account?.owner ? `${row.account.owner} · ` : ''}${days.length ? `${row.kind === 'income' ? 'Recebe' : 'Vence'} ${days.length === 1 ? 'dia' : 'dias'} ${days.join(' / ')}` : 'Sem vencimento'}`
}
const symbol = (value: MatrixValue) =>
  value.status === 'paid' ? '✓' : value.status === 'mixed' ? '◐' : value.status === 'review' ? '!' : '○'
const cellLabel = (row: MatrixRow, month: string) => {
  const value = row.cells[month]!
  return `${row.title}, ${shortMonth(month)}: ${value.entries.length ? `${number(value.amount)}, ${value.entries.length} lançamento(s), ${value.status === 'paid' ? 'quitado' : value.status === 'mixed' ? 'parcial' : value.status === 'review' ? 'em revisão' : 'pendente'}` : 'sem lançamento'}`
}
const totalRows = [
  { key: 'expense' as const, label: 'Despesas' },
  { key: 'income' as const, label: 'Receitas' },
  { key: 'net' as const, label: 'Sobra prevista' }
]
async function keydown(row: MatrixRow, month: string, event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === 'F2') {
    event.preventDefault()
    if (props.selecting) emit('cell', row, month, event as unknown as MouseEvent)
    else emit('edit', row, month)
    return
  }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  let ri = rows.value.findIndex((item) => item.id === row.id),
    mi = props.months.indexOf(month)
  if (event.key === 'ArrowLeft') mi--
  if (event.key === 'ArrowRight') mi++
  if (event.key === 'ArrowUp') ri--
  if (event.key === 'ArrowDown') ri++
  if (event.key === 'Home') {
    mi = 0
    if (event.ctrlKey) ri = 0
  }
  if (event.key === 'End') {
    mi = props.months.length - 1
    if (event.ctrlKey) ri = rows.value.length - 1
  }
  const nextRow = rows.value[ri],
    nextMonth = props.months[mi]
  if (!nextRow || !nextMonth) return
  focus.value = { rowId: nextRow.id, month: nextMonth }
  await nextTick()
  const target = [...(host.value?.querySelectorAll<HTMLButtonElement>('.annual-value') ?? [])].find(
    (button) => button.dataset.row === nextRow.id && button.dataset.month === nextMonth
  )
  target?.focus({ preventScroll: true })
  target?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
}
defineExpose({ host })
</script>
<style scoped src="../styles/finance-matrix.css"></style>
