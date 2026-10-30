import { shallowRef } from 'vue'
import { invertBatch } from '#shared/spreadsheet'
import type { Account, EntryBatchRequest } from '#shared/types'
import { useFinanceStore } from '../stores/useFinanceStore'

interface Step {
  label: string
  apply: () => Promise<void>
  revert: () => Promise<void>
}
export interface SheetAction {
  label: string
  run: () => void
}

/** Salva as edições da Planilha em fila, com desfazer/refazer e aviso de cada alteração. */
export function useSpreadsheetHistory() {
  const store = useFinanceStore()
  const toast = useToast()
  const undoStack = shallowRef<Step[]>([])
  const redoStack = shallowRef<Step[]>([])
  const busy = shallowRef(false)
  let queue: Promise<unknown> = Promise.resolve()
  let toastId: string | number | undefined

  function notify(title: string, options: { undo?: boolean; actions?: SheetAction[]; failed?: boolean } = {}) {
    if (toastId !== undefined) toast.remove(toastId)
    const offline = store.offlineQueue.length > 0
    const actions = [
      ...(options.undo ? [{ label: 'Desfazer', run: () => void undo() }] : []),
      ...(options.actions ?? []),
    ]
    toastId = toast.add({
      title: offline && !options.failed ? `${title} · pendente de sincronização` : title,
      color: options.failed ? 'error' : offline ? 'warning' : 'success',
      icon: options.failed ? 'i-lucide-circle-alert' : offline ? 'i-lucide-cloud-off' : 'i-lucide-circle-check',
      duration: actions.length > 1 ? 12000 : 6500,
      class: 'planilha-toast',
      actions: actions.map((action) => ({
        label: action.label, color: 'neutral' as const, variant: 'outline' as const, onClick: action.run,
      })),
    }).id
  }

  // Edições rápidas entram em fila para que cada lote parta do estado salvo pelo anterior.
  function run(task: () => Promise<void>): Promise<boolean> {
    const result = queue.then(async () => {
      busy.value = true
      try {
        await task()
        return true
      } catch {
        notify('Não foi possível salvar. Confira a conexão e tente de novo.', { failed: true })
        return false
      } finally {
        busy.value = false
      }
    })
    queue = result
    return result
  }

  function record(step: Step, actions: SheetAction[] = []) {
    return run(async () => {
      await step.apply()
      undoStack.value = [...undoStack.value, step]
      redoStack.value = []
      notify(step.label, { undo: true, actions })
    })
  }

  function saveEntries(batch: EntryBatchRequest, label: string, actions: SheetAction[] = []) {
    if (!batch.upserts.length && !batch.deletes.length) return Promise.resolve(false)
    let inverse: EntryBatchRequest | null = null
    return record({
      label,
      apply: async () => {
        // O estado anterior é lido na hora de salvar, depois das edições que estavam na fila.
        if (!inverse) {
          const ids = new Set([...batch.upserts.map((entry) => entry.id), ...batch.deletes])
          inverse = invertBatch(store.entries.filter((entry) => ids.has(entry.id)).map((entry) => ({ ...entry })), batch)
        }
        await store.saveEntriesBatch(batch)
      },
      revert: () => store.saveEntriesBatch(inverse!),
    }, actions)
  }

  function saveAccount(next: Account, label: string) {
    const previous = store.accounts.find((account) => account.id === next.id)
    if (!previous) return Promise.resolve(false)
    const before = { ...previous }
    return record({ label, apply: () => store.saveAccount(next), revert: () => store.saveAccount(before) })
  }

  function undo() {
    return run(async () => {
      const step = undoStack.value.at(-1)
      if (!step) return
      await step.revert()
      undoStack.value = undoStack.value.slice(0, -1)
      redoStack.value = [...redoStack.value, step]
      notify(`Desfeito: ${step.label}`)
    })
  }

  function redo() {
    return run(async () => {
      const step = redoStack.value.at(-1)
      if (!step) return
      await step.apply()
      redoStack.value = redoStack.value.slice(0, -1)
      undoStack.value = [...undoStack.value, step]
      notify(`Refeito: ${step.label}`)
    })
  }

  const dispose = () => {
    if (toastId !== undefined) toast.remove(toastId)
  }

  return { busy, undoStack, redoStack, saveEntries, saveAccount, undo, redo, notify, dispose }
}
