import { computed, ref, watch, type Ref } from 'vue'
import type { EntryKind } from '#shared/types'

export interface MatrixCell {
  kind: EntryKind
  title: string
  month: string
}

export const matrixCellKey = (cell: MatrixCell) => JSON.stringify([cell.kind, cell.title, cell.month])

export function useMatrixSelection(cells: Ref<MatrixCell[]>, getAmount: (cell: MatrixCell) => number) {
  const enabled = ref(false)
  const selected = ref(new Set<string>())
  const anchor = ref<MatrixCell | null>(null)
  const count = computed(() => selected.value.size)
  const sum = computed(() => cells.value.reduce((total, cell) =>
    total + (selected.value.has(matrixCellKey(cell)) ? Math.round(getAmount(cell) * 100) : 0), 0) / 100)

  function clear() {
    selected.value = new Set()
    anchor.value = null
  }

  function toggle(cell: MatrixCell) {
    const next = new Set(selected.value)
    const key = matrixCellKey(cell)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    selected.value = next
    anchor.value = cell
  }

  function range(from: MatrixCell, to: MatrixCell, base = new Set<string>()) {
    if (from.kind !== to.kind) return
    const group = cells.value.filter(cell => cell.kind === from.kind)
    const months = [...new Set(group.map(cell => cell.month))]
    const titles = [...new Set(group.map(cell => cell.title))]
    const rows = [months.indexOf(from.month), months.indexOf(to.month)]
    const cols = [titles.indexOf(from.title), titles.indexOf(to.title)]
    if ([...rows, ...cols].includes(-1)) return
    const next = new Set(base)
    for (const cell of group) {
      const row = months.indexOf(cell.month)
      const col = titles.indexOf(cell.title)
      if (row >= Math.min(...rows) && row <= Math.max(...rows)
        && col >= Math.min(...cols) && col <= Math.max(...cols)) next.add(matrixCellKey(cell))
    }
    selected.value = next
  }

  watch(cells, (visible) => {
    const keys = new Set(visible.map(matrixCellKey))
    selected.value = new Set([...selected.value].filter(key => keys.has(key)))
    if (anchor.value && !keys.has(matrixCellKey(anchor.value))) anchor.value = null
  })
  watch(enabled, clear)

  return { enabled, selected, anchor, count, sum, clear, toggle, range,
    isSelected: (cell: MatrixCell) => selected.value.has(matrixCellKey(cell)) }
}
