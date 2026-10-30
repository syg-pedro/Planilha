import { describe, expect, it } from 'vitest'
import {
  buildSpreadsheet,
  entryDateFor,
  invertBatch,
  nextInstallments,
  parseSheetInput,
  planInstallments,
} from '../shared/spreadsheet'
import type { Account, FinanceEntry } from '../shared/types'

const card: Account = {
  id: 'ml', householdId: 'hh', name: 'ML', owner: 'Pedro', type: 'credit_card',
  limitTotal: 800, closingDay: 10, dueDay: 17, active: true,
}
function entry(id: string, overrides: Partial<FinanceEntry> = {}): FinanceEntry {
  return {
    id, householdId: 'hh', title: 'AP', description: '', accountId: null, categoryId: null, ruleId: null,
    amount: 1400, kind: 'expense', dueDate: '2026-06-03', competenceDate: '2026-06-03',
    installmentIndex: null, installmentTotal: null, status: 'pending', origin: 'manual',
    excludeFromCalc: false, metadata: null, createdAt: '', updatedAt: '', ...overrides,
  }
}

describe('parseSheetInput', () => {
  it('lê números no formato brasileiro e contas simples', () => {
    expect(parseSheetInput('1.400,00')).toBe(1400)
    expect(parseSheetInput('R$ 47,82')).toBe(47.82)
    expect(parseSheetInput('47.82')).toBe(47.82)
    expect(parseSheetInput('=106,09*2')).toBe(212.18)
    expect(parseSheetInput('=(50+10)/3')).toBe(20)
    expect(parseSheetInput('  ')).toBeNull()
  })
  it('recusa texto que não é número', () => {
    expect(parseSheetInput('abc')).toBeNaN()
    expect(parseSheetInput('=1/0')).toBeNaN()
    expect(parseSheetInput('=2+')).toBeNaN()
  })
})

describe('buildSpreadsheet', () => {
  it('separa colunas de despesa, faturas e receitas e calcula a sobra do mês', () => {
    const entries = [
      entry('ap'),
      entry('p1', { accountId: 'ml', title: 'Tênis', amount: 55.44, dueDate: '2026-06-17', competenceDate: '2026-06-17', installmentIndex: 1, installmentTotal: 9 }),
      entry('p2', { accountId: 'ml', title: 'Fone', amount: 50.65, dueDate: '2026-06-17', competenceDate: '2026-06-17' }),
      entry('sal', { title: 'Salário', kind: 'income', amount: 1995, dueDate: '2026-06-15', competenceDate: '2026-06-15' }),
    ]
    const sheet = buildSpreadsheet(entries, [card], ['2026-06', '2026-07'])
    expect(sheet.columns.map((column) => column.title)).toEqual(['AP', 'ML'])
    expect(sheet.columns[1]!.cells['2026-06']!.amount).toBe(106.09)
    expect(sheet.incomes.map((row) => row.title)).toEqual(['Salário'])
    expect(sheet.expenseByMonth['2026-06']).toBe(1506.09)
    expect(sheet.balanceByMonth['2026-06']).toBe(488.91)
    expect(sheet.balanceByMonth['2026-07']).toBe(0)
    expect(sheet.totalExpense).toBe(1506.09)
  })
})

describe('entryDateFor', () => {
  it('limita o dia ao último dia do mês', () => {
    expect(entryDateFor('2027-02', 31)).toBe('2027-02-28')
    expect(entryDateFor('2026-06', 3)).toBe('2026-06-03')
  })
})

describe('planInstallments', () => {
  it('cria uma parcela por mês a partir do mês da fatura', () => {
    let seq = 0
    const created = planInstallments(
      { householdId: 'hh', title: 'Bike', accountId: 'ml', categoryId: null, amount: 206, kind: 'expense' },
      '2026-12', 17, 3, () => `id${++seq}`, 'now',
    )
    expect(created.map((item) => [item.dueDate, item.installmentIndex, item.installmentTotal])).toEqual([
      ['2026-12-17', 1, 3], ['2027-01-17', 2, 3], ['2027-02-17', 3, 3],
    ])
    expect(created.every((item) => item.amount === 206 && item.status === 'pending')).toBe(true)
  })
})

describe('nextInstallments', () => {
  it('encontra as parcelas seguintes da mesma compra', () => {
    const parts = [1, 2, 3, 4].map((index) =>
      entry(`b${index}`, { accountId: 'ml', title: 'Bike', amount: index === 4 ? 100 : 206, installmentIndex: index, installmentTotal: 4 }))
    const others = [entry('x', { accountId: 'ml', title: 'Outra', installmentIndex: 2, installmentTotal: 4 })]
    expect(nextInstallments([...parts, ...others], parts[0]!).map((item) => item.id)).toEqual(['b2', 'b3', 'b4'])
    expect(nextInstallments([...parts, ...others], parts[0]!, 206).map((item) => item.id)).toEqual(['b2', 'b3'])
    expect(nextInstallments(parts, entry('solo'))).toEqual([])
  })
})

describe('invertBatch', () => {
  it('restaura editados, apaga criados e recria excluídos', () => {
    const previous = [entry('a', { amount: 10 }), entry('b', { amount: 20 })]
    const inverse = invertBatch(previous, {
      upserts: [{ id: 'a', amount: 99 }, { id: 'novo', amount: 5 }],
      deletes: ['b'],
    })
    expect(inverse.upserts).toEqual([previous[0], previous[1]])
    expect(inverse.deletes).toEqual(['novo'])
  })
})
