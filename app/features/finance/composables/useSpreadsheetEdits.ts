import type { Ref } from 'vue'
import type { MatrixRow } from '#shared/matrix'
import { entryDateFor, newSheetEntry, parseSheetInput, type NewEntryBase } from '#shared/spreadsheet'
import type { EntryBatchRequest } from '#shared/types'
import { useFinanceStore } from '../stores/useFinanceStore'
import type { SheetAction, useSpreadsheetHistory } from './useSpreadsheetHistory'
import { isCardColumn, sheetMonthLabel, type SheetCell } from './useSpreadsheetModel'

type History = ReturnType<typeof useSpreadsheetHistory>
const EMPTY: EntryBatchRequest = { upserts: [], deletes: [] }
const merge = (batches: EntryBatchRequest[]): EntryBatchRequest => ({
  upserts: batches.flatMap((batch) => batch.upserts),
  deletes: batches.flatMap((batch) => batch.deletes),
})
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

/** Traduz cada edição da grade em lançamentos e contas, sempre pelo histórico (desfazer/refazer). */
export function useSpreadsheetEdits(months: Ref<string[]>, history: History) {
  const store = useFinanceStore()

  const baseFor = (row: MatrixRow, amount: number): NewEntryBase => ({
    householdId: store.settings.id,
    title: row.title,
    accountId: row.account?.id ?? null,
    categoryId: row.entries[0]?.categoryId ?? null,
    ruleId: row.entries[0]?.ruleId ?? null,
    amount,
    kind: row.kind,
  })
  const dayFor = (row: MatrixRow) => row.dueDays[0] ?? row.account?.dueDay ?? 1

  /** Plano para uma célula com no máximo um lançamento: cria, atualiza ou remove. */
  function planValue(row: MatrixRow, month: string, value: number | null): EntryBatchRequest {
    const current = row.cells[month]?.entries[0]
    if (!current) {
      if (value === null) return EMPTY
      const created = newSheetEntry(baseFor(row, value), month, dayFor(row), crypto.randomUUID(), new Date().toISOString())
      return { upserts: [created], deletes: [] }
    }
    if (value === null) return { upserts: [], deletes: [current.id] }
    return current.amount === value ? EMPTY : { upserts: [{ ...current, amount: value }], deletes: [] }
  }

  /** Meses seguintes que continuam a mesma sequência: mesmo valor de antes, ou vazios quando a célula era vazia. */
  function followers(row: MatrixRow, month: string, before: number | null) {
    const out: string[] = []
    for (const next of months.value.filter((item) => item > month)) {
      const cell = row.cells[next]
      const value = !cell?.entries.length ? null : cell.entries.length === 1 ? cell.amount : undefined
      if (value !== before) break
      out.push(next)
    }
    return out
  }

  function setValue(cell: SheetCell, value: number | null) {
    const row = cell.row!, month = cell.month!, before = cell.value as number | null
    const what = row.kind === 'income' ? 'Receita' : 'Lançamento'
    const label = value === null ? `${what} removido em ${cell.label}`
      : before === null ? `${what} criado em ${cell.label}` : `${what} atualizado em ${cell.label}`
    const next = before === value ? [] : followers(row, month, before)
    const actions: SheetAction[] = []
    if (next.length) {
      const until = sheetMonthLabel(next.at(-1)!)
      const verb = value === null ? 'Remover também' : before === null ? 'Repetir' : 'Aplicar também'
      actions.push({
        label: `${verb} nos próximos ${plural(next.length, 'mês', 'meses')} (até ${until})`,
        run: () => void history.saveEntries(merge(next.map((item) => planValue(row, item, value))), `${plural(next.length, 'mês atualizado', 'meses atualizados')} até ${until}`),
      })
    }
    return history.saveEntries(planValue(row, month, value), label, actions)
  }

  /** Várias células de uma vez (colar, limpar, preencher); células com lista de lançamentos ficam de fora. */
  function setMany(changes: { cell: SheetCell; value: number | null }[], label: string) {
    const batch = merge(changes.filter(({ cell }) => cell.editable && cell.kind === 'value')
      .map(({ cell, value }) => planValue(cell.row!, cell.month!, value)))
    return history.saveEntries(batch, label)
  }

  function togglePaid(cells: SheetCell[]) {
    const entries = cells.flatMap((cell) => cell.row?.cells[cell.month!]?.entries ?? [])
    if (!entries.length) return Promise.resolve(false)
    const allPaid = entries.every((entry) => entry.status === 'paid')
    return history.saveEntries(
      { upserts: entries.map((entry) => ({ ...entry, status: allPaid ? 'pending' : 'paid' })), deletes: [] },
      allPaid ? `${plural(entries.length, 'lançamento voltou', 'lançamentos voltaram')} para pendente` : `${plural(entries.length, 'lançamento marcado', 'lançamentos marcados')} como pago`,
    )
  }

  function setLimit(row: MatrixRow, text: string): string | null {
    const value = parseSheetInput(text)
    if (Number.isNaN(value) || (value !== null && value < 0)) return 'Informe um limite como 1.050,00, ou deixe vazio.'
    void history.saveAccount({ ...row.account!, limitTotal: value }, `Limite de ${row.title} atualizado`)
    return null
  }

  /** Cartão: dia de vencimento da conta. Outras colunas: muda o dia dos lançamentos pendentes do período. */
  function setDueDay(row: MatrixRow, text: string): string | null {
    const day = Number(text.match(/\d{1,2}/)?.[0])
    if (!Number.isInteger(day) || day < 1 || day > 31) return 'Informe um dia de 1 a 31, como "dia 10".'
    if (isCardColumn(row)) {
      void history.saveAccount({ ...row.account!, dueDay: day }, `Vencimento de ${row.title} atualizado`)
      return null
    }
    const pending = row.entries.filter((entry) => entry.status !== 'paid' && months.value.includes(entry.dueDate.slice(0, 7)))
    if (!pending.length) return 'Não há lançamentos pendentes nesta coluna para mudar o dia.'
    void history.saveEntries(
      { upserts: pending.map((entry) => ({ ...entry, dueDate: entryDateFor(entry.dueDate.slice(0, 7), day) })), deletes: [] },
      `Vencimento de ${plural(pending.length, 'lançamento', 'lançamentos')} de ${row.title} mudou para dia ${day}`,
    )
    return null
  }

  /** Cartão: renomeia a conta. Outras colunas: renomeia todos os lançamentos da coluna, em qualquer mês. */
  function rename(row: MatrixRow, title: string) {
    if (isCardColumn(row)) return history.saveAccount({ ...row.account!, name: title }, `Cartão renomeado para ${title}`)
    return history.saveEntries(
      { upserts: row.entries.map((entry) => ({ ...entry, title })), deletes: [] },
      `${row.title} renomeado para ${title}`,
    )
  }

  return { setValue, setMany, togglePaid, setLimit, setDueDay, rename }
}
