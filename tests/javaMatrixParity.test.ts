import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildFinanceMatrix, matrixCardCommitment, matrixMonths, sumMoney } from '../shared/matrix'
import type { MatrixMonthSummary } from '../shared/matrix'
import type { Account, FinanceEntry, PeriodMode } from '../shared/types'

interface MatrixFixture {
  name: string
  accounts: Account[]
  entries: FinanceEntry[]
  startMonth: string
  count: number
  periodMode: PeriodMode
  expected: ReturnType<typeof buildFinanceMatrix> & {
    months: string[]
    totals: Record<keyof MatrixMonthSummary, number>
    cardCommitments: Record<string, ReturnType<typeof matrixCardCommitment>>
  }
}

const fixtures: MatrixFixture[] = JSON.parse(readFileSync(new URL(
  '../backend-java/src/test/resources/parity/matrix-parity.json', import.meta.url), 'utf8'))

describe('contrato fictício da matriz TypeScript para Java', () => {
  it.each(fixtures)('$name', (fixture) => {
    const months = matrixMonths(fixture.startMonth, fixture.count)
    const matrix = buildFinanceMatrix(fixture.entries, fixture.accounts, months, fixture.periodMode)
    const fields = Object.keys(matrix.summaries[months[0]!]!) as (keyof MatrixMonthSummary)[]
    const totals = Object.fromEntries(fields.map(field => [
      field, sumMoney(months.map(month => matrix.summaries[month]![field]))
    ]))
    const cardCommitments = Object.fromEntries(fixture.accounts
      .filter(account => account.type === 'credit_card')
      .map(account => [account.id, matrixCardCommitment(fixture.entries, account)]))

    expect({ months, ...matrix, totals, cardCommitments }).toEqual(fixture.expected)
  })
})
