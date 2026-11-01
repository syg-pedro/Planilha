import { computed, onMounted, watch } from 'vue'
import { matrixCardCommitment } from '#shared/matrix'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'

export type AlertTone = 'danger' | 'warning' | 'info' | 'success'
export interface SmartAlert {
  id: string
  tone: AlertTone
  title: string
  body: string
  sub?: string
  entryId?: string
  navigateTo?: string
}

/** One source for the alert center, summary and navigation badge. */
export function useFinanceAlerts() {
  const store = useFinanceStore()
  const currency = useCurrency()
  const dismissedIds = useState<string[]>('finance-dismissed-alerts', () => [])
  const storageLoaded = useState('finance-dismissed-alerts-loaded', () => false)
  const fmt = (value: number) => currency.format(value)
  const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')
  const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`
  const percent = (value: number, digits = 0) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: digits })}%`
  // Ids carry the situation they describe, so a dismissed alert returns when the situation changes.
  const cents = (list: { amount: number }[]) => Math.round(list.reduce((sum, entry) => sum + entry.amount, 0) * 100)
  const toneRank: Record<AlertTone, number> = { danger: 0, warning: 1, info: 2, success: 3 }

  onMounted(() => {
    if (storageLoaded.value) return
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('ff-dismissed-alerts') ?? '[]')
      if (Array.isArray(saved)) dismissedIds.value = saved.filter((id): id is string => typeof id === 'string')
    } catch { /* Keep alerts available when browser storage is unavailable. */ }
    storageLoaded.value = true
  })
  watch(dismissedIds, (ids) => {
    if (!import.meta.client || !storageLoaded.value) return
    try { localStorage.setItem('ff-dismissed-alerts', JSON.stringify(ids)) } catch { /* Storage is optional. */ }
  }, { deep: true })

  const generatedAlerts = computed((): SmartAlert[] => {
    const alerts: SmartAlert[] = []
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: store.settings.timezone || 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date())
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? ''
    const today = `${part('year')}-${part('month')}-${part('day')}`
    const afterDays = (days: number) => {
      const date = new Date(`${today}T12:00:00Z`)
      date.setUTCDate(date.getUTCDate() + days)
      return date.toISOString().slice(0, 10)
    }
    const in3 = afterDays(3)
    const in7 = afterDays(7)
    const unpaid = store.entries.filter(entry => entry.kind === 'expense' && entry.status !== 'paid')
    const overdue = unpaid.filter(entry => entry.dueDate < today)
    if (overdue.length) alerts.push({ id: `overdue-${overdue.length}-${cents(overdue)}`, tone: 'danger',
      title: `${plural(overdue.length, 'lançamento vencido', 'lançamentos vencidos')}: ${fmt(cents(overdue) / 100)}`,
      body: 'Despesas com vencimento passado e sem pagamento confirmado.', navigateTo: 'planilha' })
    for (const entry of unpaid.filter(item => item.dueDate >= today && item.dueDate <= in3)) {
      const account = entry.accountId ? store.accountMap.get(entry.accountId) : null
      alerts.push({ id: `urgent-${entry.id}`, tone: 'danger', title: `${entry.title} vence em breve`,
        body: `${fmt(entry.amount)} — vencimento ${formatDate(entry.dueDate)}${account ? ` via ${account.name}` : ''}`, entryId: entry.id })
    }
    const upcoming = unpaid.filter(entry => entry.dueDate > in3 && entry.dueDate <= in7)
    if (upcoming.length) alerts.push({ id: `upcoming-week-${today}-${upcoming.length}`, tone: 'warning',
      title: `${plural(upcoming.length, 'vencimento', 'vencimentos')} nesta semana`,
      body: `Total de ${fmt(cents(upcoming) / 100)} vence nos próximos 7 dias.`, navigateTo: 'planilha' })

    const entries = store.allCashableEntries.filter(entry => entry.dueDate.startsWith(today.slice(0, 7)))
    const income = entries.filter(entry => entry.kind === 'income').reduce((sum, entry) => sum + entry.amount, 0)
    const expense = entries.filter(entry => entry.kind === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
    if (income > 0 && expense > income) alerts.push({ id: `savings-negative-${today.slice(0, 7)}`, tone: 'danger', title: 'Despesas superam receitas este mês',
      body: `Diferença de ${fmt(expense - income)}. Consulte os lançamentos do mês.`, navigateTo: 'planilha' })
    else if (income > 0 && (income - expense) / income < 0.1) alerts.push({ id: `savings-low-${today.slice(0, 7)}`, tone: 'warning',
      title: `Sobra prevista: ${percent(((income - expense) / income) * 100, 1)} da receita`,
      body: 'Confira as despesas e receitas previstas para este mês.', navigateTo: 'planilha' })

    for (const account of store.accounts.filter(item => item.type === 'credit_card' && item.active && item.limitTotal)) {
      const { committed, available } = matrixCardCommitment(store.entries, account)
      const used = (committed / account.limitTotal!) * 100
      if (available! < 0) alerts.push({ id: `card-over-${account.id}-${Math.round(committed * 100)}`, tone: 'danger',
        title: `${account.name} acima do limite`, body: `Passou ${fmt(-available!)} do limite de ${fmt(account.limitTotal!)}.`, navigateTo: 'cartoes' })
      else if (used >= 90) alerts.push({ id: `card-critical-${account.id}-${Math.floor(used)}`, tone: 'warning',
        title: `${account.name} com ${percent(used)} do limite usado`, body: `Restam ${fmt(available!)} disponíveis.`, navigateTo: 'cartoes' })
    }
    return alerts.sort((a, b) => toneRank[a.tone] - toneRank[b.tone])
  })
  const activeAlerts = computed(() => generatedAlerts.value.filter(alert => !dismissedIds.value.includes(alert.id)))
  const dismissedCount = computed(() => generatedAlerts.value.filter(alert => dismissedIds.value.includes(alert.id)).length)
  const count = computed(() => activeAlerts.value.length)
  const dismiss = (id: string) => { if (!dismissedIds.value.includes(id)) dismissedIds.value.push(id) }
  const dismissAll = () => { dismissedIds.value = generatedAlerts.value.map(alert => alert.id) }
  const restoreAll = () => { dismissedIds.value = [] }
  return { generatedAlerts, activeAlerts, dismissedCount, count, dismiss, dismissAll, restoreAll }
}
