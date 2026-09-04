import { ref } from 'vue'
import { entryBatchSchema } from '#shared/batchSchemas'
import type { EntryBatchRequest } from '#shared/types'

/** One durable queue per identity; acknowledgements never clear another session. */
export const useOfflineQueue = (storage: () => Pick<Storage, 'getItem' | 'setItem'>) => {
  const queue = ref<EntryBatchRequest[]>([])
  const syncError = ref<string | null>(null)
  const syncing = ref(false)
  let scope: string | null = null
  let generation = 0
  let running: Promise<void> | null = null
  const write = (items: EntryBatchRequest[]) => {
    if (!scope) throw new Error('Aguarde a identificação da família antes de salvar.')
    storage().setItem(scope, JSON.stringify(items))
    queue.value = items
  }
  const reset = () => {
    generation++
    scope = null
    queue.value = []
    syncError.value = null
    syncing.value = false
    running = null
  }
  const load = (identity: string) => {
    reset()
    scope = `finance-offline-queue:v2:${identity}`
    const raw = storage().getItem(scope)
    if (!raw) return
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw new Error('Fila inválida')
      queue.value = parsed.map(item => entryBatchSchema.parse(item))
    } catch {
      scope = null // preserve the unreadable data; never silently overwrite it
      syncError.value = 'Não foi possível ler as alterações locais. Os dados foram preservados.'
    }
  }
  const enqueue = (batch: EntryBatchRequest) => {
    const checked = entryBatchSchema.parse(batch)
    write([...queue.value, checked])
  }
  const flush = (send: (batch: EntryBatchRequest) => Promise<void>) => {
    if (!scope) return Promise.resolve()
    if (running) return running
    const version = generation
    syncing.value = true
    syncError.value = null
    running = (async () => {
      while (version === generation && queue.value.length) {
        const batch = queue.value[0]!
        await send(batch)
        if (version !== generation) return
        write(queue.value.slice(1))
      }
    })().catch(error => {
      if (version === generation) syncError.value = error instanceof Error ? error.message : 'Falha ao sincronizar. Tente novamente.'
    }).finally(() => {
      if (version === generation) { syncing.value = false; running = null }
    })
    return running
  }
  const discard = () => { if (!syncing.value) { write([]); syncError.value = null } }
  return { queue, syncError, syncing, load, reset, enqueue, flush, discard }
}
