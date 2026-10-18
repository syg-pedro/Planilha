import { describe, expect, it } from 'vitest'
import {
  createFinanceQuery,
  filterFinanceQuery,
  financeQueryMonths,
  parseFinanceQuery,
  serializeFinanceQuery,
  sortFinanceListEntries
} from '../shared/financeQuery'
import { buildFinanceMatrix } from '../shared/matrix'
import type { Account, FinanceEntry } from '../shared/types'

const bank: Account = {
  id: 'bank',
  householdId: 'hh',
  name: 'Conta família',
  owner: 'Maria',
  type: 'bank',
  limitTotal: null,
  dueDay: null,
  closingDay: null,
  active: true
}
const benefit: Account = { ...bank, id: 'benefit', name: 'Benefício', type: 'benefit' }
const entry = (id: string, changes: Partial<FinanceEntry> = {}): FinanceEntry => ({
  id,
  householdId: 'hh',
  ruleId: null,
  title: 'Mercado',
  description: '',
  accountId: bank.id,
  categoryId: null,
  amount: 0.1,
  kind: 'expense',
  dueDate: '2026-11-05',
  competenceDate: '2026-10-30',
  status: 'pending',
  installmentIndex: null,
  installmentTotal: null,
  origin: 'manual',
  excludeFromCalc: false,
  metadata: null,
  createdAt: '',
  updatedAt: '',
  ...changes
})

describe('consulta compartilhada da Planilha', () => {
  it('prioriza despesas em aberto, depois receitas pendentes e por último itens quitados, sem alterar os registros', () => {
    const records = [
      entry('paid-expense', { status: 'paid', dueDate: '2026-10-01' }),
      entry('pending-income', { kind: 'income', dueDate: '2026-10-01' }),
      entry('late-expense', { dueDate: '2026-10-25' }),
      entry('review-expense', { status: 'review', title: 'Revisar conta', dueDate: '2026-10-10' }),
      entry('paid-income', { kind: 'income', status: 'paid', dueDate: '2026-10-05' }),
      entry('early-expense', { title: 'Água', dueDate: '2026-10-10' })
    ]
    const originalIds = records.map(entry => entry.id)
    const sorted = sortFinanceListEntries(records)
    expect(sorted.map(entry => entry.id)).toEqual([
      'early-expense', 'review-expense', 'late-expense', 'pending-income', 'paid-expense', 'paid-income'
    ])
    expect(records.map(entry => entry.id)).toEqual(originalIds)
    expect(sorted[0]).toBe(records[5])
    expect(sortFinanceListEntries(records.map(record => record.id === 'early-expense' ? { ...record, status: 'paid' as const } : record)).map(entry => entry.id)).toEqual([
      'review-expense', 'late-expense', 'pending-income', 'paid-expense', 'paid-income', 'early-expense'
    ])
  })

  it('mantém a prioridade dos pendentes ao ordenar por competência em vez de vencimento', () => {
    const records = [
      entry('first-due', { dueDate: '2026-10-01', competenceDate: '2026-10-30' }),
      entry('first-competence', { dueDate: '2026-10-20', competenceDate: '2026-10-01' }),
      entry('paid', { status: 'paid', dueDate: '2026-10-01', competenceDate: '2026-10-01' })
    ]
    expect(sortFinanceListEntries(records).map(entry => entry.id)).toEqual(['first-due', 'first-competence', 'paid'])
    expect(sortFinanceListEntries(records, 'competence').map(entry => entry.id)).toEqual(['first-competence', 'first-due', 'paid'])
  })

  it('preserva registros e totais ao alternar Planilha e Lista, incluindo critérios e exclusões', () => {
    const records = [
      entry('first'),
      entry('paid', { amount: 0.2, status: 'paid' }),
      entry('excluded', { amount: 500, excludeFromCalc: true }),
      entry('benefit', { kind: 'income', amount: 600, accountId: benefit.id })
    ]
    const query = {
      ...createFinanceQuery('2026-10'),
      dateMode: 'competence' as const,
      range: 'month' as const,
      search: 'Mercado'
    }
    const matrix = filterFinanceQuery(records, [bank, benefit], query)
    const list = filterFinanceQuery(records, [bank, benefit], { ...query, presentation: 'list' })
    expect(list.map((entry) => entry.id)).toEqual(matrix.map((entry) => entry.id))
    expect(
      buildFinanceMatrix(list, [bank, benefit], financeQueryMonths(query), query.dateMode).summaries[
        '2026-10'
      ]
    ).toMatchObject({ expense: 0.3, income: 0, excluded: 1100, pendingExpense: 0.1 })
    expect(
      filterFinanceQuery(records, [bank, benefit], { ...query, status: 'paid' }).map((entry) => entry.id)
    ).toEqual(['paid'])
  })
  it('usa o mesmo período ao atravessar o ano e buscar pela conta ou responsável', () => {
    const query = {
      ...createFinanceQuery('2026-11'),
      range: 'quarter' as const,
      search: 'Maria',
      accountId: bank.id
    }
    expect(financeQueryMonths(query)).toEqual(['2026-11', '2026-12', '2027-01'])
    const records = [
      entry('nov'),
      entry('jan', { dueDate: '2027-01-01' }),
      entry('outside', { dueDate: '2027-02-01' }),
      entry('no-account', { accountId: null })
    ]
    expect(filterFinanceQuery(records, [bank], query).map((entry) => entry.id)).toEqual(['nov', 'jan'])
    expect(
      filterFinanceQuery(records, [bank], { ...query, search: '', accountId: 'none' }).map(
        (entry) => entry.id
      )
    ).toEqual(['no-account'])
  })
  it('restaura consulta completa da URL e rejeita parâmetros inválidos', () => {
    const query = {
      ...createFinanceQuery('2026-11'),
      range: 'quarter' as const,
      presentation: 'list' as const,
      status: 'review' as const,
      kind: 'income' as const,
      search: 'salário',
      accountId: 'bank'
    }
    expect(parseFinanceQuery(serializeFinanceQuery(query), createFinanceQuery('2026-10'))).toEqual(query)
    expect(
      parseFinanceQuery(
        { month: '2026-99', range: 'unlimited', date: 'invalid', status: 'invalid', q: ['x'] },
        query
      )
    ).toEqual(query)
    expect(parseFinanceQuery({ q: '', status: 'all', account: '' }, query)).toMatchObject({
      search: '',
      status: 'all',
      accountId: ''
    })
  })
})
