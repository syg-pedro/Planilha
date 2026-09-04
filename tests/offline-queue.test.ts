import { expect, it, vi } from 'vitest'
import { useOfflineQueue } from '../app/features/finance/composables/useOfflineQueue'

const setup = () => {
  const data = new Map<string, string>()
  const queue = useOfflineQueue(() => ({ getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) } }))
  return { queue, data }
}
it('keeps failed and unattempted batches after a partial flush and reload', async () => {
  const { queue } = setup()
  queue.load('user-a:family-a')
  for (const id of ['1', '2', '3']) queue.enqueue({ upserts: [{ id, status: 'paid' }], deletes: [] })
  const send = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('offline'))
  await queue.flush(send)
  queue.load('user-a:family-a')
  expect(queue.queue.value.map(batch => batch.upserts[0]!.id)).toEqual(['2', '3'])
})
it('does not acknowledge an in-flight request into another family queue', async () => {
  const { queue } = setup()
  queue.load('a:a')
  queue.enqueue({ upserts: [{ id: 'a' }], deletes: [] })
  let finish!: () => void
  const first = queue.flush(() => new Promise<void>(resolve => { finish = resolve }))
  queue.load('b:b')
  queue.enqueue({ upserts: [{ id: 'b' }], deletes: [] })
  finish()
  await first
  expect(queue.queue.value[0]!.upserts[0]!.id).toBe('b')
  queue.load('a:a')
  expect(queue.queue.value[0]!.upserts[0]!.id).toBe('a')
})
it('does not overwrite corrupt local data or clear its error on flush', async () => {
  const { queue, data } = setup()
  data.set('finance-offline-queue:v2:a', 'invalid json')
  queue.load('a')
  expect(queue.syncError.value).toBeTruthy()
  await queue.flush(async () => {})
  expect(queue.syncError.value).toBeTruthy()
  expect(() => queue.enqueue({ upserts: [], deletes: [] })).toThrow()
  expect(data.get('finance-offline-queue:v2:a')).toBe('invalid json')
})
