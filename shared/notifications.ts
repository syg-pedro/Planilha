import type { FinanceEntry } from './types'

const zonedTime = (date: string, time: string, timezone: string) => {
  const target = Date.parse(`${date}T${time}:00Z`)
  let candidate = target
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(candidate))
    const part = (type: string) => parts.find(p => p.type === type)!.value
    const actual = Date.parse(`${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}Z`)
    candidate += target - actual
  }
  return new Date(candidate)
}

export const upcomingNotifications = (entries: FinanceEntry[], days: number[], time: string, timezone: string, now = new Date()) => {
  const reminders = [...new Set([0, ...days.filter(day => Number.isInteger(day) && day >= 0 && day <= 90)])]
  return entries.filter(entry => entry.kind === 'expense' && entry.status !== 'paid').flatMap(entry => reminders.map(daysBefore => {
    const date = new Date(`${entry.dueDate}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() - daysBefore)
    const at = zonedTime(date.toISOString().slice(0, 10), time, timezone)
    return { entryId: entry.id, title: 'Vencimento próximo', body: `${entry.title} ${daysBefore ? `vence em ${daysBefore} dia(s)` : 'vence hoje'}`, at }
  })).filter(item => item.at > now && item.at.getTime() <= now.getTime() + 90 * 86400000)
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.entryId.localeCompare(b.entryId)).slice(0, 90)
}
