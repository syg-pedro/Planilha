import { describe, expect, it } from 'vitest'
import { buildExpensePaymentCycles, computeKpis, sortExpenseColumnTitlesByDueDate } from '../shared/finance'
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

describe('buildExpensePaymentCycles', () => {
  it('separates pending expenses by due-date half and ends February on its last day', () => {
    const benefitAccount: Account = {
      ...accounts[0],
      id: 'benefit-1',
      type: 'benefit',
      limitTotal: null,
    }
    const cycleEntries = [
      { ...entries[1], id: 'first', accountId: null, amount: 100, dueDate: '2026-02-15', status: 'pending', excludeFromCalc: false },
      { ...entries[1], id: 'second', accountId: null, amount: 200, dueDate: '2026-02-28', status: 'review', excludeFromCalc: false },
      { ...entries[1], id: 'paid', accountId: null, amount: 300, dueDate: '2026-02-16', status: 'paid', excludeFromCalc: false },
      { ...entries[1], id: 'excluded', accountId: null, amount: 400, dueDate: '2026-02-20', status: 'pending', excludeFromCalc: true },
      { ...entries[1], id: 'benefit', accountId: benefitAccount.id, amount: 500, dueDate: '2026-02-10', status: 'pending', excludeFromCalc: false },
      { ...entries[1], id: 'next-month', accountId: null, amount: 600, dueDate: '2026-03-01', status: 'pending', excludeFromCalc: false },
    ]

    expect(buildExpensePaymentCycles(cycleEntries, [...accounts, benefitAccount], new Date('2026-02-10T12:00:00Z'))).toEqual([
      { id: 'first-half', startDay: 1, endDay: 15, pendingTotal: 100, pendingCount: 1, projectedBalanceImpact: -100 },
      { id: 'second-half', startDay: 16, endDay: 28, pendingTotal: 200, pendingCount: 1, projectedBalanceImpact: -200 },
    ])
  })
})

describe('sortExpenseColumnTitlesByDueDate', () => {
  it('sorts expense columns chronologically across a year change and ignores income', () => {
    const orderedTitles = sortExpenseColumnTitlesByDueDate([
      { ...entries[1], id: 'jan-next-year', title: 'Janeiro', dueDate: '2027-01-02' },
      { ...entries[1], id: 'december', title: 'Dezembro', dueDate: '2026-12-20' },
      { ...entries[0], id: 'income', title: 'Salário', dueDate: '2026-01-01', kind: 'income' },
    ])

    expect(orderedTitles).toEqual(['Dezembro', 'Janeiro'])
  })

  it('uses the earliest due date for a recurring expense column', () => {
    const orderedTitles = sortExpenseColumnTitlesByDueDate([
      { ...entries[1], id: 'rent-next-year', title: 'Aluguel', dueDate: '2027-01-05' },
      { ...entries[1], id: 'rent-current-year', title: 'Aluguel', dueDate: '2026-12-05' },
      { ...entries[1], id: 'utilities', title: 'Contas', dueDate: '2026-12-10' },
    ])

    expect(orderedTitles).toEqual(['Aluguel', 'Contas'])
  })
})
