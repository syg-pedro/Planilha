import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildCashflowSeries, buildExpensePaymentCycles, computeKpis, excludeBenefitEntries } from '../shared/finance'
import type { Account, FinanceEntry, FinanceKpis, ExpensePaymentCycle } from '../shared/types'

interface ParityFixture {
  name: string
  now: string
  accounts: Account[]
  entries: FinanceEntry[]
  expected: {
    kpis: FinanceKpis
    paymentCycles: ExpensePaymentCycle[]
    dueCashflow: ReturnType<typeof buildCashflowSeries>
    competenceCashflow: ReturnType<typeof buildCashflowSeries>
  }
}
const fixtures: ParityFixture[] = JSON.parse(readFileSync(new URL(
  '../backend-java/src/test/resources/parity/finance-parity.json', import.meta.url), 'utf8'))

afterEach(() => vi.useRealTimers())
describe('contrato financeiro TypeScript para Java', () => {
  it.each(fixtures)('$name', (fixture) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(fixture.now))
    const cash = excludeBenefitEntries(fixture.entries, fixture.accounts)
    expect(computeKpis(fixture.entries, fixture.accounts)).toEqual(fixture.expected.kpis)
    expect(buildExpensePaymentCycles(fixture.entries, fixture.accounts)).toEqual(fixture.expected.paymentCycles)
    expect(buildCashflowSeries(cash, 'due_date')).toEqual(fixture.expected.dueCashflow)
    expect(buildCashflowSeries(cash, 'competence')).toEqual(fixture.expected.competenceCashflow)
  })
})
