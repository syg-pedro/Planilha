import { computed, reactive, ref, watch } from 'vue'
import { parseMoney } from '#shared/money'
import { civilDate } from '#shared/period'
import type { FinanceEntry } from '#shared/types'

const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value

const shiftDate = (iso: string, offset: number) => {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number]
  const last = new Date(Date.UTC(year, month + offset, 0)).getUTCDate()
  return new Date(Date.UTC(year, month - 1 + offset, Math.min(day, last))).toISOString().slice(0, 10)
}

/** Local form state only. Persistence remains an explicit store action in the caller. */
export const useEntryDraft = (entry: () => FinanceEntry | null, open: () => boolean, allowRecurrence: () => boolean) => {
  const draft = reactive({ id: '', title: '', description: '', amount: '0', kind: 'expense' as FinanceEntry['kind'],
    status: 'pending' as FinanceEntry['status'], dueDate: '', competenceDate: '', accountId: '', categoryId: '',
    installmentIndex: null as number | null, installmentTotal: null as number | null, excludeFromCalc: false, recurrence: 1 })
  const errors = ref<Record<string, string>>({})
  const baseline = ref('')
  let payloadKey = ''
  let copyIds: string[] = []
  let previousPayload: Partial<FinanceEntry>[] | null = null
  const dirty = computed(() => JSON.stringify(draft) !== baseline.value)
  const isInstallment = computed(() => draft.installmentIndex != null || draft.installmentTotal != null)
  const reset = () => {
    const source = entry()
    const today = civilDate()
    Object.assign(draft, { id: source?.id ?? crypto.randomUUID(), title: source?.title ?? '', description: source?.description ?? '',
      amount: String(source?.amount ?? 0), kind: source?.kind ?? 'expense', status: source?.status ?? 'pending',
      dueDate: source?.dueDate ?? today, competenceDate: source?.competenceDate ?? today,
      accountId: source?.accountId ?? '', categoryId: source?.categoryId ?? '',
      installmentIndex: source?.installmentIndex ?? null, installmentTotal: source?.installmentTotal ?? null,
      excludeFromCalc: source?.excludeFromCalc ?? false, recurrence: 1 })
    baseline.value = JSON.stringify(draft)
    errors.value = {}
    payloadKey = ''; previousPayload = null; copyIds = []
  }
  watch([open, () => entry()?.id], ([visible]) => { if (visible) reset() }, { immediate: true })
  const buildPayload = (): Partial<FinanceEntry>[] | null => {
    const next: Record<string, string> = {}
    const amount = parseMoney(draft.amount)
    if (!draft.title.trim()) next.title = 'Informe a descrição.'
    if (amount === null) next.amount = 'Informe um valor válido, como 1.234,56.'
    if (!validDate(draft.dueDate)) next.dueDate = 'Informe um vencimento válido.'
    if (!validDate(draft.competenceDate)) next.competenceDate = 'Informe uma competência válida.'
    if (allowRecurrence() && (!Number.isInteger(draft.recurrence) || draft.recurrence < 1 || draft.recurrence > 120)) next.recurrence = 'Use de 1 a 120 meses inteiros.'
    if (isInstallment.value && (!Number.isInteger(draft.installmentIndex) || !Number.isInteger(draft.installmentTotal)
      || Number(draft.installmentIndex) < 1 || Number(draft.installmentTotal) < Number(draft.installmentIndex))) next.installmentIndex = 'Informe parcela e total válidos; a parcela não pode superar o total.'
    errors.value = next
    if (Object.keys(next).length) return null
    const key = JSON.stringify([draft, allowRecurrence()])
    if (key === payloadKey && previousPayload) return previousPayload
    payloadKey = key
    previousPayload = Array.from({ length: allowRecurrence() ? draft.recurrence : 1 }, (_, index) => ({
      id: index ? (copyIds[index] ??= crypto.randomUUID()) : draft.id, title: draft.title.trim(), description: draft.description,
      amount: amount!, kind: draft.kind, status: index ? 'pending' : draft.status,
      dueDate: shiftDate(draft.dueDate, index), competenceDate: shiftDate(draft.competenceDate, index),
      accountId: draft.accountId || null, categoryId: draft.categoryId || null,
      installmentIndex: draft.installmentIndex, installmentTotal: draft.installmentTotal, excludeFromCalc: draft.excludeFromCalc,
    }))
    return previousPayload
  }
  return { draft, errors, dirty, isInstallment, buildPayload }
}
