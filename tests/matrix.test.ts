import { describe, expect, it } from 'vitest'
import {
  buildFinanceMatrix,
  matrixCardCommitment,
  matrixMonths,
  matrixValue,
  sumMoney,
} from '../shared/matrix'
import { computeKpis } from '../shared/finance'
import type { Account, FinanceEntry } from '../shared/types'

const card: Account = {
  id: 'card',
  householdId: 'hh',
  name: 'Cartão',
  owner: 'Pedro',
  type: 'credit_card',
  limitTotal: 1000,
  closingDay: 20,
  dueDay: 28,
  active: true,
}
function entry(id: string, overrides: Partial<FinanceEntry> = {}): FinanceEntry {
  return {
    id,
    householdId: 'hh',
    title: 'Mercado',
    description: '',
    accountId: null,
    categoryId: null,
    ruleId: null,
    amount: 10,
    kind: 'expense',
    status: 'pending',
    dueDate: '2026-10-28',
    competenceDate: '2026-09-30',
    installmentIndex: null,
    installmentTotal: null,
    excludeFromCalc: false,
    origin: 'manual',
    metadata: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('matriz financeira anual', () => {
  it('gera 12 meses consecutivos, atravessando o ano e incluindo meses sem registros', () => {
    const months = matrixMonths('2026-10')
    expect(months).toHaveLength(12)
    expect(months[0]).toBe('2026-10')
    expect(months.at(-1)).toBe('2027-09')
    expect(buildFinanceMatrix([], [], months).summaries['2027-01']!.expenseCount).toBe(0)
  })

  it('separa nomes iguais por conta e regra, preservando os registros originais', () => {
    const entries = [entry('a'), entry('b', { accountId: 'bank' }), entry('c', { ruleId: 'rule' })]
    const model = buildFinanceMatrix(entries, [], ['2026-10'])
    expect(model.rows).toHaveLength(3)
    expect(new Set(model.rows.map((row) => row.id)).size).toBe(3)
    expect(model.rows.flatMap((row) => row.cells['2026-10']!.entries)).toEqual(
      expect.arrayContaining(entries),
    )
  })

  it('agrupa compras e parcelas por cartão sem perder sua composição ou status parcial', () => {
    const entries = [
      entry('a', { accountId: card.id, amount: 0.1, status: 'paid' }),
      entry('b', {
        title: 'Bicicleta',
        accountId: card.id,
        amount: 0.2,
        installmentIndex: 3,
        installmentTotal: 12,
      }),
    ]
    const model = buildFinanceMatrix(entries, [card], ['2026-10'])
    expect(model.rows).toHaveLength(1)
    const cell = model.rows[0]!.cells['2026-10']!
    expect(cell).toMatchObject({ amount: 0.3, paid: 0.1, pending: 0.2, status: 'mixed' })
    expect(cell.entries[1]!.installmentIndex).toBe(3)
    expect(cell.entries[1]).toBe(entries[1])
  })

  it('aplica as mesmas exclusões dos indicadores e separa pagos de pendentes e revisão', () => {
    const benefit: Account = { ...card, id: 'benefit', type: 'benefit' }
    const entries = [
      entry('salary', { kind: 'income', amount: 2000, status: 'paid' }),
      entry('future-salary', { kind: 'income', amount: 500 }),
      entry('paid', { amount: 100, status: 'paid' }),
      entry('pending', { amount: 200 }),
      entry('review', { amount: 50, status: 'review' }),
      entry('excluded', { amount: 900, excludeFromCalc: true }),
      entry('benefit', { accountId: benefit.id, amount: 700, kind: 'income' }),
    ]
    const model = buildFinanceMatrix(entries, [benefit], ['2026-10'])
    const summary = model.summaries['2026-10']!
    const kpis = computeKpis(entries, [benefit])
    expect(summary).toMatchObject({
      income: 2500,
      expense: 350,
      net: 2150,
      paid: 100,
      received: 2000,
      pendingExpense: 250,
      pendingIncome: 500,
      settledNet: 1900,
      excluded: 1600,
    })
    expect(summary.income).toBe(kpis.totalIncome)
    expect(summary.expense).toBe(kpis.totalExpense)
    expect(summary.net).toBe(kpis.net)
    expect(model.rows.filter((row) => row.group === 'excluded')).toHaveLength(2)
  })

  it('respeita o período e a troca entre vencimento e competência', () => {
    const entries = [
      entry('october'),
      entry('outside', { dueDate: '2027-10-01', competenceDate: '2027-09-01', amount: 999 }),
    ]
    const due = buildFinanceMatrix(entries, [], ['2026-09', '2026-10'])
    const competence = buildFinanceMatrix(entries, [], ['2026-09', '2026-10'], 'competence')
    expect(due.summaries['2026-10']!.expense).toBe(10)
    expect(due.summaries['2026-09']!.expense).toBe(0)
    expect(competence.summaries['2026-09']!.expense).toBe(10)
    expect(competence.summaries['2026-10']!.expense).toBe(0)
    expect(due.rows[0]!.total).toBe(10)
  })

  it('distingue zero cadastrado, ausência de registro e revisão sem nenhum pagamento', () => {
    const zero = matrixValue([entry('zero', { amount: 0 })])
    expect(zero.entries).toHaveLength(1)
    expect(zero.amount).toBe(0)
    expect(matrixValue([]).status).toBeNull()
    expect(matrixValue([entry('pending'), entry('review', { status: 'review' })]).status).toBe('review')
  })

  it('mantém o limite de cartões sem registros no período e estima compromissos de todos os meses', () => {
    const entries = [
      entry('past', { accountId: card.id, amount: 100, dueDate: '2026-09-28' }),
      entry('future', { accountId: card.id, amount: 200, dueDate: '2027-12-28' }),
      entry('paid', { accountId: card.id, amount: 500, status: 'paid' }),
    ]
    expect(matrixCardCommitment(entries, card)).toEqual({ committed: 300, available: 700 })
    expect(matrixCardCommitment(entries, { ...card, limitTotal: null }).available).toBeNull()
    const row = buildFinanceMatrix(entries, [card], ['2027-01']).rows[0]!
    expect(row.account?.limitTotal).toBe(1000)
    expect(row.cells['2027-01']!.entries).toHaveLength(0)
  })

  it('soma em centavos sem acumular erro de ponto flutuante', () => {
    expect(sumMoney([0.1, 0.2, 99.99])).toBe(100.29)
    expect(sumMoney([0.3, -0.2])).toBe(0.1)
  })
})
