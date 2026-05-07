import { describe, expect, it } from 'vitest'
import { buildEntriesFromRule } from '../shared/rules'
import type { FinanceRule } from '../shared/types'

const rule: FinanceRule = {
  id: 'rule-1',
  householdId: 'household-main',
  title: 'Rule test',
  description: 'Rule test desc',
  accountId: null,
  categoryId: null,
  amount: 100,
  kind: 'expense',
  dueDay: 12,
  frequency: 'monthly',
  startsAt: '2026-01-01',
  endsAt: null,
  autoGenerate: true,
  metadata: null
}

describe('buildEntriesFromRule', () => {
  it('generates monthly entries respecting horizon', () => {
    const entries = buildEntriesFromRule({
      rule,
      householdId: 'household-main',
      startDate: new Date(Date.UTC(2026, 0, 1)),
      months: 6
    })

    expect(entries).toHaveLength(6)
    expect(entries[0].dueDate).toBe('2026-01-12')
    expect(entries[5].dueDate).toBe('2026-06-12')
  })
})
