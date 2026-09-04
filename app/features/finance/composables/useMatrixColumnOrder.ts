import { onMounted, ref, watch } from 'vue'
import type { EntryKind, FinanceEntry } from '#shared/types'

export const useMatrixColumnOrder = (entries: () => FinanceEntry[], identity: () => string) => {
  const columnOrder = ref<Record<EntryKind, string[]>>({ expense: [], income: [] })
  const ready = ref(false)
  const key = () => `finance-matrix-column-order:v2:${identity()}`
  const load = () => {
    columnOrder.value = { expense: [], income: [] }
    try {
      const saved = JSON.parse(localStorage.getItem(key()) ?? '{}')
      for (const kind of ['expense', 'income'] as const) {
        if (Array.isArray(saved[kind])) columnOrder.value[kind] = saved[kind].filter((value: unknown): value is string => typeof value === 'string')
      }
    } catch { /* An unavailable preference never prevents finance operations. */ }
  }
  onMounted(() => { ready.value = true; load() })
  watch(identity, () => { if (ready.value) load() })
  const buildColumns = (kind: EntryKind): string[] => {
    const titles = [...new Set(entries().filter(entry => entry.kind === kind).map(entry => entry.title))]
    const saved = [...new Set(columnOrder.value[kind].filter(title => titles.includes(title)))]
    return [...saved, ...titles.filter(title => !saved.includes(title))]
  }
  const saveColumnOrder = (kind: EntryKind, columns: string[]) => {
    columnOrder.value = { ...columnOrder.value, [kind]: columns }
    try { localStorage.setItem(key(), JSON.stringify(columnOrder.value)) }
    catch { /* Keep the chosen order for this session if storage is unavailable. */ }
  }
  return { columnOrder, buildColumns, saveColumnOrder }
}
