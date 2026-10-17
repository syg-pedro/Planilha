import { describe, expect, it } from 'vitest'
import { buildAnnualPlan, filterReportEntries, financialToday, nextMonthlyDueDate } from '../app/features/finance/components/screens/auxiliaryFinancialViews'
import type { Account, FinanceEntry } from '../shared/types'

const benefit = { id: 'benefit', householdId: 'hh', type: 'benefit', name: 'Benefício', owner: '', active: true, limitTotal: null, dueDay: null, closingDay: null } satisfies Account
const entry = (id: string, values: Partial<FinanceEntry> = {}): FinanceEntry => ({
  id, householdId: 'hh', title: id, description: '', amount: 0.1, kind: 'expense', accountId: null, categoryId: null, ruleId: null, dueDate: '2026-10-05', competenceDate: '2026-09-30', status: 'pending', installmentIndex: null, installmentTotal: null, origin: 'manual', excludeFromCalc: false, metadata: null, createdAt: '', updatedAt: '', ...values,
})

describe('planejamento e relatórios auxiliares', () => {
  it('usa a data do household na virada UTC e considera cobrança no próximo mês e no fim de fevereiro', () => {
    expect(financialToday('America/Sao_Paulo', new Date('2026-11-01T01:00:00Z'))).toBe('2026-10-31')
    expect(nextMonthlyDueDate(2, '2026-10-29')).toBe('2026-11-02')
    expect(nextMonthlyDueDate(31, '2026-02-28')).toBe('2026-02-28')
    expect(nextMonthlyDueDate(31, '2026-03-01')).toBe('2026-03-31')
    expect(nextMonthlyDueDate(32, '2026-10-29')).toBeNull()
  })
  it('usa as mesmas exclusões e valores em centavos e diferencia mês vazio de zero cadastrado', () => {
    const model = buildAnnualPlan([entry('a'), entry('b', { amount: 0.2 }), entry('zero', { amount: 0, dueDate: '2026-11-01' }), entry('benefit', { accountId: benefit.id, amount: 900 }), entry('excluded', { excludeFromCalc: true, amount: 500 })], [benefit], 2026, 'due_date', '2026-10')
    expect(model.rows[9]?.expense).toBe(0.3)
    expect(model.rows[10]).toMatchObject({ hasRecords: true, expense: 0 })
    expect(model.rows[8]?.hasRecords).toBe(false)
    expect(model.totals).toMatchObject({ totalExpense: 0.3, totalNet: -0.3, recordedMonths: 2, projectedExpense: 1.8 })
  })

  it('muda o mês dos registros por competência sem alterar valores e mantém o acumulado monetário', () => {
    const model = buildAnnualPlan([entry('salary', { kind: 'income', amount: 1 }), entry('a'), entry('b', { amount: 0.2 })], [], 2026, 'competence', '2026-10')
    expect(model.rows[8]).toMatchObject({ income: 1, expense: 0.3, net: 0.7, accumulated: 0.7 })
    expect(model.rows[9]).toMatchObject({ hasRecords: false, accumulated: 0.7 })
    expect(model.totals.projectedNet).toBe(8.4)
  })

  it('limita relatórios ao intervalo indicado, sem incluir futuro, e respeita competência e exclusões', () => {
    const records = [entry('previous', { dueDate: '2026-07-31', competenceDate: '2026-07-31' }), entry('start', { dueDate: '2026-08-01', competenceDate: '2026-08-01' }), entry('different-date', { dueDate: '2026-11-01', competenceDate: '2026-10-31' }), entry('future', { dueDate: '2027-01-01', competenceDate: '2027-01-01' }), entry('excluded', { excludeFromCalc: true }), entry('benefit', { accountId: benefit.id })]
    expect(filterReportEntries(records, [benefit], 'quarter', 'due_date', '2026-10').map(item => item.id)).toEqual(['start'])
    expect(filterReportEntries(records, [benefit], 'quarter', 'competence', '2026-10').map(item => item.id)).toEqual(['start', 'different-date'])
  })
})
