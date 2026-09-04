import { ref, nextTick } from 'vue'
import { parseMoney } from '#shared/money'
import type { EntryKind, FinanceEntry, EntryBatchRequest } from '#shared/types'
import type { useMatrixModel } from './useMatrixModel'

export const useMatrixEditing = (model: ReturnType<typeof useMatrixModel>, household: () => string,
  saveBatch: (batch: EntryBatchRequest) => Promise<void>, selectMonth: (month: string) => void) => {
  const { cellKey, getAmount, getCellEntries } = model
  const editingKey = ref<string | null>(null)
  const editValue  = ref('')
  const saving     = ref(false)
  const editError = ref('')

  const startEdit = (kind: string, title: string, month: string, event: MouseEvent) => {
    if (saving.value) return
    const key = cellKey(kind, title, month)
    editError.value = ''
    editingKey.value = key
    const amount = getAmount(kind, title, month)
    editValue.value = amount > 0 ? String(amount).replace('.', ',') : ''
    const target = event.currentTarget as HTMLElement | null
    const host = target?.closest('.mcard-row') ?? target
    nextTick(() => {
      const input = host?.querySelector('input') as HTMLInputElement | null
      input?.focus()
      input?.select()
    })
  }

  const cancelEdit = () => { editingKey.value = null }

  const saveCell = async (kind: EntryKind, title: string, month: string) => {
    const key = cellKey(kind, title, month)
    if (editingKey.value !== key || saving.value) return

    const newAmount = parseMoney(editValue.value)
    if (newAmount === null) { editError.value = 'Informe um valor válido, por exemplo 1.234,56.'; return }
    const existing   = getCellEntries(kind, title, month)
    const prevAmount = getAmount(kind, title, month)
    if (newAmount === prevAmount) { editingKey.value = null; return }
    if (existing.length > 1) {
      selectMonth(month)
      editError.value = 'Esta célula soma vários lançamentos. Abra a Lista para editar cada item sem apagar seu histórico.'
      return
    }

    saving.value = true
    try {
      if (existing.length === 0 && newAmount === 0) return

      if (existing.length === 0) {
        const householdId = household()
        const newEntry: FinanceEntry = {
          id: crypto.randomUUID(), householdId, ruleId: null, accountId: null, categoryId: null,
          title, description: '', amount: newAmount, kind,
          dueDate: `${month}-01`, competenceDate: `${month}-01`,
          installmentIndex: null, installmentTotal: null,
          status: 'pending', origin: 'manual', excludeFromCalc: false, metadata: null,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        }
        await saveBatch({ upserts: [newEntry], deletes: [] })
        return
      }

      if (existing.length === 1) {
        await saveBatch({ upserts: [{ ...existing[0]!, amount: newAmount }], deletes: [] })
        return
      }


    } catch (error) {
      editError.value = error instanceof Error ? error.message : 'Não foi possível salvar. Seu valor foi preservado.'
    } finally {
      saving.value = false
      if (!editError.value) editingKey.value = null
    }
  }

  return { editingKey, editValue, saving, editError, startEdit, cancelEdit, saveCell }
}
