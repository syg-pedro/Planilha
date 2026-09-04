import { computed } from 'vue'
import type { EntryKind, FinanceEntry } from '#shared/types'

export const useMatrixModel = (entries: () => FinanceEntry[]) => {
  const columnDueDayMap = computed(() => {
    const daysByColumn = new Map<string, Set<number>>()

    for (const entry of entries()) {
      const key = `${entry.kind}__${entry.title}`
      const days = daysByColumn.get(key) ?? new Set<number>()
      days.add(Number.parseInt(entry.dueDate.slice(8, 10), 10))
      daysByColumn.set(key, days)
    }

    const result = new Map<string, number>()
    for (const [key, days] of daysByColumn) {
      if (days.size === 1) {
        result.set(key, [...days][0]!)
      }
    }
    return result
  })

  const getColumnDueDay = (kind: EntryKind, title: string): number | null =>
    columnDueDayMap.value.get(`${kind}__${title}`) ?? null

  // ─── cell lookup maps ────────────────────────────────────────────────────────

  const amountMap = computed(() => {
    const map  = new Map<string, number>()
    const cnt  = new Map<string, number>()
    const ents = new Map<string, FinanceEntry[]>()
    for (const e of entries()) {
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
    for (const e of entries()) {
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

  return { getColumnDueDay, cellKey, getAmount, getCellCount, getCellEntries, getStatus }
}
