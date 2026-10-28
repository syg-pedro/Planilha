import { computed, onMounted, watch } from 'vue'
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
  const browserStorage = () => store.javaLab ? sessionStorage : localStorage
  const currency = useCurrency()
  const dismissedIds = useState<string[]>('finance-dismissed-alerts', () => [])
  const storageLoaded = useState('finance-dismissed-alerts-loaded', () => false)
  const fmt = (value: number) => currency.format(value)
  const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')

  onMounted(() => {
    if (storageLoaded.value) return
    try {
      const saved: unknown = JSON.parse(browserStorage().getItem(store.storageKey('ff-dismissed-alerts')) ?? '[]')
      if (Array.isArray(saved)) dismissedIds.value = saved.filter((id): id is string => typeof id === 'string')
    } catch { /* Keep alerts available when browser storage is unavailable. */ }
    storageLoaded.value = true
  })
  watch(dismissedIds, (ids) => {
    if (!import.meta.client || !storageLoaded.value) return
    try { browserStorage().setItem(store.storageKey('ff-dismissed-alerts'), JSON.stringify(ids)) } catch { /* Storage is optional. */ }
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
    for (const entry of unpaid.filter(item => item.dueDate >= today && item.dueDate <= in3)) {
      const account = entry.accountId ? store.accountMap.get(entry.accountId) : null
      alerts.push({ id: `urgent-${entry.id}`, tone: 'danger', title: `${entry.title} vence em breve`,
        body: `${fmt(entry.amount)} — vencimento ${formatDate(entry.dueDate)}${account ? ` via ${account.name}` : ''}`, entryId: entry.id })
    }
    const upcoming = unpaid.filter(entry => entry.dueDate > in3 && entry.dueDate <= in7)
    if (upcoming.length) alerts.push({ id: 'upcoming-week', tone: 'warning', title: `${upcoming.length} vencimento(s) esta semana`,
      body: `Total de ${fmt(upcoming.reduce((sum, entry) => sum + entry.amount, 0))} vence nos próximos 7 dias.`, navigateTo: 'planilha' })
    const overdue = unpaid.filter(entry => entry.dueDate < today)
    if (overdue.length) alerts.push({ id: 'overdue', tone: 'danger', title: `${overdue.length} lançamento(s) vencido(s)`,
      body: `${fmt(overdue.reduce((sum, entry) => sum + entry.amount, 0))} em despesas vencidas sem confirmação de pagamento.`, navigateTo: 'planilha' })

    const entries = store.allCashableEntries.filter(entry => entry.dueDate.startsWith(today.slice(0, 7)))
    const income = entries.filter(entry => entry.kind === 'income').reduce((sum, entry) => sum + entry.amount, 0)
    const expense = entries.filter(entry => entry.kind === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
    if (income > 0 && expense > income) alerts.push({ id: 'savings-negative', tone: 'danger', title: 'Despesas superam receitas este mês',
      body: `Diferença de ${fmt(expense - income)}. Consulte os lançamentos do mês.`, navigateTo: 'planilha' })
    else if (income > 0 && (income - expense) / income < 0.1) alerts.push({ id: 'savings-low', tone: 'warning',
      title: `Sobra prevista: ${(((income - expense) / income) * 100).toFixed(1)}%`,
      body: 'Confira as despesas e receitas previstas para este mês.', navigateTo: 'planilha' })

    const cardsUsedPercent = store.monthlyKpis.cardsUsedPercent
    if (cardsUsedPercent >= 90) alerts.push({ id: 'card-critical', tone: 'danger', title: `Limite do cartão em ${cardsUsedPercent.toFixed(0)}%`,
      body: 'Consulte os limites e as faturas dos cartões.', navigateTo: 'cartoes' })
    else if (cardsUsedPercent >= 70) alerts.push({ id: 'card-warn', tone: 'warning', title: `Uso do cartão em ${cardsUsedPercent.toFixed(0)}%`,
      body: 'Atenção ao limite disponível nos cartões de crédito.', navigateTo: 'cartoes' })
    return alerts
  })
  const activeAlerts = computed(() => generatedAlerts.value.filter(alert => !dismissedIds.value.includes(alert.id)))
  const dismissedCount = computed(() => generatedAlerts.value.filter(alert => dismissedIds.value.includes(alert.id)).length)
  const count = computed(() => activeAlerts.value.length)
  const dismiss = (id: string) => { if (!dismissedIds.value.includes(id)) dismissedIds.value.push(id) }
  const dismissAll = () => { dismissedIds.value = generatedAlerts.value.map(alert => alert.id) }
  const restoreAll = () => { dismissedIds.value = [] }
  return { generatedAlerts, activeAlerts, dismissedCount, count, dismiss, dismissAll, restoreAll }
}
