export const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10)

export const addMonths = (date: Date, months: number): Date => {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  next.setUTCMonth(next.getUTCMonth() + months)
  return next
}

export const withDay = (date: Date, day: number): Date => {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const maxDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, month, Math.max(1, Math.min(day, maxDay))))
}

export const monthKey = (dateIso: string): string => dateIso.slice(0, 7)

export const parseIsoDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`)
