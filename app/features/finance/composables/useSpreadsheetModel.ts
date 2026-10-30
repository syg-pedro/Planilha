import { computed, ref, type Ref } from 'vue'
import { matrixValue, type MatrixRow } from '#shared/matrix'
import { buildSpreadsheet } from '#shared/spreadsheet'
import type { EntryKind, FinanceEntry, PeriodMode } from '#shared/types'
import { useFinanceStore } from '../stores/useFinanceStore'

export type SheetBlock = 'D' | 'R'
export interface SheetCell {
  kind: 'label' | 'value' | 'calc' | 'limit' | 'due' | 'blank'
  /** Referência mostrada na barra de fórmula. */
  label: string
  value: number | string | null
  row?: MatrixRow
  month?: string
  formula?: string
  /** Edita direto na célula; células com vários lançamentos abrem a lista. */
  editable?: boolean
  opensList?: boolean
  count?: number
  status?: MatrixRow['cells'][string]['status']
  tone?: 'positive' | 'negative'
  strong?: boolean
}

const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const sheetMonthName = (month: string) => monthNames[Number(month.slice(5, 7)) - 1]!
export const sheetMonthLabel = (month: string) => `${sheetMonthName(month)}/${month.slice(2, 4)}`
export const isCardColumn = (row: MatrixRow) => row.group === 'cards' && Boolean(row.account)
export const columnDueLabel = (row: MatrixRow) => {
  const days = isCardColumn(row) ? (row.account!.dueDay ? [row.account!.dueDay] : []) : row.dueDays
  return days.length ? `dia ${days.map((day) => String(day).padStart(2, '0')).join(' / ')}` : ''
}

function draftRow(title: string, kind: EntryKind, months: string[]): MatrixRow {
  return {
    id: `draft:${kind}:${title}`, title, kind, group: kind === 'income' ? 'income' : 'expenses', account: null,
    entries: [], cells: Object.fromEntries(months.map((month) => [month, matrixValue([])])), total: 0, dueDays: [],
  }
}

/** Descreve cada célula das duas tabelas: despesas (meses × colunas) e receitas (linhas × meses). */
export function useSpreadsheetModel(entries: Ref<FinanceEntry[]>, months: Ref<string[]>, dateMode: Ref<PeriodMode>) {
  const store = useFinanceStore()
  // Colunas e linhas novas só existem aqui até receberem o primeiro valor.
  const drafts = ref<{ title: string; kind: EntryKind }[]>([])
  const sheet = computed(() => buildSpreadsheet(entries.value, store.accounts, months.value, dateMode.value))
  const withDrafts = (rows: MatrixRow[], kind: EntryKind) => [
    ...rows,
    ...drafts.value
      .filter((draft) => draft.kind === kind && !rows.some((row) => row.title === draft.title && !isCardColumn(row)))
      .map((draft) => draftRow(draft.title, kind, months.value)),
  ]
  const columns = computed(() => withDrafts(sheet.value.columns, 'expense'))
  const incomes = computed(() => withDrafts(sheet.value.incomes, 'income'))
  const dims = (block: SheetBlock) => block === 'D'
    ? { rows: months.value.length + 3, cols: columns.value.length + 2 }
    : { rows: incomes.value.length + 3, cols: months.value.length + 1 }

  function valueCell(row: MatrixRow, month: string, label: string): SheetCell {
    const cell = row.cells[month] ?? matrixValue([])
    const count = cell.entries.length
    const opensList = isCardColumn(row) || count > 1
    return {
      kind: 'value', row, month, label, value: count ? cell.amount : null, count, status: cell.status,
      editable: !opensList, opensList,
    }
  }

  function expenseCell(r: number, c: number): SheetCell {
    const list = months.value, cols = columns.value
    const month = list[r]
    const rowName = month ? sheetMonthLabel(month) : ['Total despesas', 'Limite cartão', 'Vence em'][r - list.length]!
    if (c === 0) return { kind: 'label', label: rowName, value: rowName, month, strong: r === list.length }
    if (c === cols.length + 1) {
      if (month) return { kind: 'calc', label: `Soma · ${rowName}`, value: sheet.value.expenseByMonth[month] ?? 0, formula: `= soma de todas as colunas em ${rowName}`, strong: true }
      if (r === list.length) return { kind: 'calc', label: 'Total geral', value: sheet.value.totalExpense, formula: '= soma de todas as despesas do período', strong: true }
      return { kind: 'blank', label: '', value: null }
    }
    const row = cols[c - 1]!
    if (month) return valueCell(row, month, `${row.title} · ${rowName}`)
    if (r === list.length) return { kind: 'calc', label: `${row.title} · total`, value: row.total, formula: `= soma de ${row.title} em todos os meses`, strong: true }
    if (r === list.length + 1) {
      const card = isCardColumn(row)
      return { kind: card ? 'limit' : 'blank', label: `${row.title} · limite`, value: card ? row.account!.limitTotal : null, row, editable: card }
    }
    return { kind: 'due', label: `${row.title} · vencimento`, value: columnDueLabel(row), row, editable: isCardColumn(row) || row.entries.length > 0 }
  }

  function incomeCell(r: number, c: number): SheetCell {
    const rows = incomes.value
    const rowName = r === 0 ? 'Total despesas' : r <= rows.length ? rows[r - 1]!.title : r === rows.length + 1 ? 'Total' : 'Sobra'
    if (c === 0) return { kind: 'label', label: rowName, value: rowName, row: rows[r - 1], strong: r === 0 || r > rows.length }
    const month = months.value[c - 1]!, monthLabel = sheetMonthLabel(month)
    if (r === 0) return { kind: 'calc', label: `Total despesas · ${monthLabel}`, value: sheet.value.expenseByMonth[month] ?? 0, formula: `= Soma de ${monthLabel} na tabela de despesas`, strong: true }
    if (r <= rows.length) return valueCell(rows[r - 1]!, month, `${rowName} · ${monthLabel}`)
    if (r === rows.length + 1) return { kind: 'calc', label: `Total · ${monthLabel}`, value: sheet.value.incomeByMonth[month] ?? 0, formula: `= soma das receitas de ${monthLabel}`, strong: true }
    const balance = sheet.value.balanceByMonth[month] ?? 0
    return { kind: 'calc', label: `Sobra · ${monthLabel}`, value: balance, formula: `= Total de receitas − Total despesas de ${monthLabel}`, strong: true, tone: balance < 0 ? 'negative' : 'positive' }
  }

  const cell = (block: SheetBlock, r: number, c: number): SheetCell => block === 'D' ? expenseCell(r, c) : incomeCell(r, c)
  const addDraft = (title: string, kind: EntryKind, replacing?: string) => {
    drafts.value = [
      ...drafts.value.filter((draft) => draft.kind !== kind || (draft.title !== title && draft.title !== replacing)),
      { title, kind },
    ]
  }

  return { sheet, columns, incomes, dims, cell, addDraft }
}
