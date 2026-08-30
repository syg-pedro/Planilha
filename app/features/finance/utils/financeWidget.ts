import { Capacitor, registerPlugin } from '@capacitor/core'
import type { Account, FinanceEntry, FinanceKpis } from '#shared/types'

interface FinanceWidgetSnapshot {
  balance: string
  balanceIsNegative: boolean
  income: string
  expense: string
  nextDue: string
  updated: string
}

interface FinanceWidgetPlugin {
  updateSnapshot(options: FinanceWidgetSnapshot): Promise<void>
}

interface SyncFinanceWidgetInput {
  kpis: FinanceKpis
  entries: FinanceEntry[]
  accounts: Account[]
  currency: string
}

const FinanceWidget = registerPlugin<FinanceWidgetPlugin>('FinanceWidget')

const clip = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, Math.max(0, maxLength - 1))}…` : value

const parseLocalDate = (date: string) => new Date(`${date}T00:00:00`)

export const syncFinanceWidgetSnapshot = async ({ kpis, entries, accounts, currency }: SyncFinanceWidgetInput) => {
  if (!process.client || !Capacitor.isNativePlatform()) {
    return
  }

  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency })
  const accountMap = new Map(accounts.map(account => [account.id, account.name]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const nextDue = entries
    .filter(entry => entry.kind === 'expense' && entry.status !== 'paid' && parseLocalDate(entry.dueDate) >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]

  const nextDueLabel = nextDue
    ? [
        clip(nextDue.title, 18),
        nextDue.accountId ? clip(accountMap.get(nextDue.accountId) ?? 'Sem conta', 14) : 'Sem conta',
        formatter.format(nextDue.amount),
      ].join(' · ')
    : 'Sem vencimentos pendentes'

  try {
    await FinanceWidget.updateSnapshot({
      balance: formatter.format(kpis.net),
      balanceIsNegative: kpis.net < 0,
      income: `↑ ${formatter.format(kpis.totalIncome)}`,
      expense: `↓ ${formatter.format(kpis.totalExpense)}`,
      nextDue: `Próximo: ${nextDueLabel}`,
      updated: `Atualizado ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    })
  } catch {
    // Não bloqueia o app caso o plugin ainda não exista no runtime instalado.
  }
}
