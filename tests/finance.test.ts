import { describe, expect, it } from 'vitest'
import { computeKpis } from '../shared/finance'
import type { Account, FinanceEntry } from '../shared/types'

const accounts: Account[] = [
  {
    id: 'card-1',
    householdId: 'household-main',
    name: 'Card',
    owner: 'Pedro',
    type: 'credit_card',
    limitTotal: 1000,
    closingDay: 10,
    dueDay: 20,
    active: true
  }
]

const entries: FinanceEntry[] = [
  {
    id: '1',
    householdId: 'household-main',
    ruleId: null,
    accountId: null,
    categoryId: null,
    title: 'Salario',
    description: '',
    amount: 2000,
    kind: 'income',
    dueDate: '2026-05-05',
    competenceDate: '2026-05-05',
    installmentIndex: null,
    installmentTotal: null,
    status: 'paid',
    origin: 'manual',
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    householdId: 'household-main',
    ruleId: null,
    accountId: 'card-1',
    categoryId: null,
    title: 'Compra',
    description: '',
    amount: 500,
    kind: 'expense',
    dueDate: '2026-05-10',
    competenceDate: '2026-05-10',
    installmentIndex: null,
    installmentTotal: null,
    status: 'pending',
    origin: 'manual',
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

describe('computeKpis', () => {
  it('calculates totals and card usage', () => {
    const kpis = computeKpis(entries, accounts)
    expect(kpis.totalIncome).toBe(2000)
    expect(kpis.totalExpense).toBe(500)
    expect(kpis.net).toBe(1500)
    expect(kpis.cardsUsedPercent).toBe(50)
  })
})
