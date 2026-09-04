import { describe, expect, it } from 'vitest'
import { applyFilters, computeKpis } from '../shared/finance'
import { parseMoney } from '../shared/money'
import { civilDate, entriesInPeriod, reportBounds } from '../shared/period'
import { entryBatchSchema } from '../shared/batchSchemas'
import { upcomingNotifications } from '../shared/notifications'
import type { FinanceEntry } from '../shared/types'

const now = new Date('2026-09-04T18:00:00Z')
const entry = { id: 'e1', kind: 'expense', amount: 100, status: 'pending', dueDate: '2026-09-04', competenceDate: '2026-08-31', accountId: null, categoryId: null } as FinanceEntry
describe('finance review regressions', () => {
  it('counts today until the end of the household day', () => {
    expect(computeKpis([entry], [], now).upcoming7Days).toBe(100)
    expect(civilDate(new Date('2026-10-01T01:00:00Z'))).toBe('2026-09-30')
  })
  it('does not include unassigned entries when filtering a specific account', () => {
    expect(applyFilters([entry], { range: 'month', periodMode: 'due_date', accountIds: ['a'], categoryIds: [] }, now)).toEqual([])
  })
  it('bounds historical reports and respects competence', () => {
    const bounds = reportBounds('quarter', now)
    expect(bounds).toEqual({ start: '2026-07-01', end: '2026-10-01' })
    expect(entriesInPeriod([entry, { ...entry, dueDate: '2027-01-01' }], bounds.start, bounds.end, 'due_date')).toHaveLength(1)
    expect(entriesInPeriod([entry], '2026-09-01', '2026-10-01', 'competence')).toHaveLength(0)
  })
  it.each([['1.234,56', 1234.56], ['1234,56', 1234.56], ['1234.56', 1234.56], ['0', 0], ['12abc', null], ['1,2,3', null], ['-3', null], ['Infinity', null]])('parses %s without silently truncating', (text, expected) => {
    expect(parseMoney(text as string)).toBe(expected)
  })
  it('rejects malformed runtime payloads and preserves partial patches', () => {
    expect(entryBatchSchema.safeParse({ upserts: [{ amount: -1 }] }).success).toBe(false)
    expect(entryBatchSchema.safeParse({ upserts: [{ dueDate: '2026-02-30' }] }).success).toBe(false)
    expect(entryBatchSchema.parse({ upserts: [{ id: 'entry', status: 'paid' }] }).upserts[0]).toEqual({ id: 'entry', status: 'paid' })
  })
  it('schedules today at the chosen local time and cancels paid entries', () => {
    const reminders = upcomingNotifications([entry], [3, 1], '18:00', 'America/Sao_Paulo', now)
    expect(reminders).toHaveLength(1)
    expect(reminders[0]!.at.toISOString()).toBe('2026-09-04T21:00:00.000Z')
    expect(upcomingNotifications([{ ...entry, status: 'paid' }], [3, 1], '18:00', 'America/Sao_Paulo', now)).toEqual([])
  })
})
