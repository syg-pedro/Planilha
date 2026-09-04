import { effectScope, nextTick, ref } from 'vue'
import { expect, it, vi } from 'vitest'
import { useEntryDraft } from '../app/features/finance/composables/useEntryDraft'
import { useMatrixModel } from '../app/features/finance/composables/useMatrixModel'
import { useMatrixEditing } from '../app/features/finance/composables/useMatrixEditing'
import type { FinanceEntry } from '../shared/types'

const entry = { id: 'entry', title: 'Aluguel', amount: 100, kind: 'expense', status: 'pending', dueDate: '2026-01-31', competenceDate: '2026-01-31' } as FinanceEntry
it('keeps recurrence IDs stable on retry, parses pt-BR and clamps month ends', () => {
  const scope = effectScope()
  const form = scope.run(() => useEntryDraft(() => entry, () => true, () => true))!
  form.draft.amount = '1.234,56'
  form.draft.recurrence = 3
  const payload = form.buildPayload()!
  expect(payload.map(e => e.dueDate)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
  expect(payload.every(e => e.amount === 1234.56)).toBe(true)
  expect(form.buildPayload()).toEqual(payload)
  form.draft.amount = '200,00'
  expect(form.buildPayload()!.map(entry => entry.id)).toEqual(payload.map(entry => entry.id))
  expect(form.dirty.value).toBe(true)
  scope.stop()
})
it('validates individual fields and resets a reopened form even for the same entry', async () => {
  const open = ref(true)
  const scope = effectScope()
  const form = scope.run(() => useEntryDraft(() => entry, () => open.value, () => true))!
  form.draft.dueDate = '2026-02-30'
  form.draft.recurrence = 1.5
  expect(form.buildPayload()).toBeNull()
  expect(Object.keys(form.errors.value)).toEqual(['dueDate', 'recurrence'])
  open.value = false; await nextTick()
  open.value = true; await nextTick()
  expect(form.draft.dueDate).toBe('2026-01-31')
  expect(form.errors.value).toEqual({})
  expect(form.dirty.value).toBe(false)
  scope.stop()
})
it('does not overwrite a dirty draft when the same record receives a server refresh', async () => {
  const current = ref(entry)
  const scope = effectScope()
  const form = scope.run(() => useEntryDraft(() => current.value, () => true, () => false))!
  form.draft.title = 'Rascunho'
  current.value = { ...entry, title: 'Servidor' }
  await nextTick()
  expect(form.draft.title).toBe('Rascunho')
  scope.stop()
})
it('keeps the matrix draft after a failed save, and never writes an aggregate', async () => {
  const entries = ref([entry])
  const save = vi.fn().mockRejectedValue(new Error('Sem conexão'))
  const edit = useMatrixEditing(useMatrixModel(() => entries.value), () => 'family', save, vi.fn())
  edit.startEdit('expense', 'Aluguel', '2026-01', { currentTarget: null } as unknown as MouseEvent)
  edit.editValue.value = '123,45'
  await edit.saveCell('expense', 'Aluguel', '2026-01')
  expect(edit.editValue.value).toBe('123,45')
  expect(edit.editingKey.value).not.toBeNull()
  expect(edit.editError.value).toBe('Sem conexão')
  entries.value = [entry, { ...entry, id: 'second' }]
  await edit.saveCell('expense', 'Aluguel', '2026-01')
  expect(save).toHaveBeenCalledTimes(1)
  expect(edit.editError.value).toContain('vários lançamentos')
})
