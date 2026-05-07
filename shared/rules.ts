import { addMonths, toIsoDate, withDay } from './date'
import { makeId } from './id'
import type { FinanceEntry, FinanceRule } from './types'

interface BuildRuleEntriesInput {
  rule: FinanceRule
  householdId: string
  startDate: Date
  months: number
}

export const buildEntriesFromRule = ({ rule, householdId, startDate, months }: BuildRuleEntriesInput): FinanceEntry[] => {
  if (!rule.autoGenerate || rule.frequency !== 'monthly' || !rule.dueDay) {
    return []
  }

  const entries: FinanceEntry[] = []
  for (let i = 0; i < months; i += 1) {
    const monthDate = addMonths(startDate, i)
    const dueDate = withDay(monthDate, rule.dueDay)
    const iso = toIsoDate(dueDate)
    entries.push({
      id: makeId('entry'),
      householdId,
      ruleId: rule.id,
      accountId: rule.accountId,
      categoryId: rule.categoryId,
      title: rule.title,
      description: rule.description,
      amount: rule.amount,
      kind: rule.kind,
      dueDate: iso,
      competenceDate: iso,
      installmentIndex: null,
      installmentTotal: null,
      status: 'pending',
      origin: 'auto',
      metadata: { generatedFromRule: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  return entries
}

export const buildEntriesFromRules = (rules: FinanceRule[], householdId: string, horizonMonths: number): FinanceEntry[] => {
  const start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
  return rules.flatMap((rule) =>
    buildEntriesFromRule({
      rule,
      householdId,
      startDate: start,
      months: horizonMonths
    })
  )
}
