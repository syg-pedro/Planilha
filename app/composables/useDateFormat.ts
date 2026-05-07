const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const BR_DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/

const formatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC'
})

const pad2 = (value: number) => String(value).padStart(2, '0')

const isValidYmd = (year: number, month: number, day: number): boolean => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }

  const testDate = new Date(Date.UTC(year, month - 1, day))
  return (
    testDate.getUTCFullYear() === year &&
    testDate.getUTCMonth() === month - 1 &&
    testDate.getUTCDate() === day
  )
}

export const useDateFormat = () => {
  const parseIsoParts = (raw: string): { year: number; month: number; day: number } | null => {
    const parts = raw.split('-')
    if (parts.length !== 3) return null
    const year = Number(parts[0])
    const month = Number(parts[1])
    const day = Number(parts[2])
    if (!isValidYmd(year, month, day)) return null
    return { year, month, day }
  }

  const parseBrParts = (raw: string): { year: number; month: number; day: number } | null => {
    const parts = raw.split('/')
    if (parts.length !== 3) return null
    const day = Number(parts[0])
    const month = Number(parts[1])
    const year = Number(parts[2])
    if (!isValidYmd(year, month, day)) return null
    return { year, month, day }
  }

  const formatDate = (value: string | Date | null | undefined): string => {
    if (!value) return ''

    if (value instanceof Date) {
      return formatter.format(value)
    }

    const raw = value.trim()
    if (!raw) return ''

    if (BR_DATE_PATTERN.test(raw)) {
      return raw
    }

    if (ISO_DATE_PATTERN.test(raw)) {
      const parsed = parseIsoParts(raw)
      if (!parsed) return raw
      return `${pad2(parsed.day)}/${pad2(parsed.month)}/${parsed.year}`
    }

    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime())) {
      return formatter.format(parsed)
    }

    return raw
  }

  const toIsoDate = (value: string | null | undefined): string | null => {
    if (!value) return null
    const raw = value.trim()
    if (!raw) return null

    if (ISO_DATE_PATTERN.test(raw)) {
      const parsed = parseIsoParts(raw)
      if (!parsed) return null
      return `${parsed.year}-${pad2(parsed.month)}-${pad2(parsed.day)}`
    }

    if (BR_DATE_PATTERN.test(raw)) {
      const parsed = parseBrParts(raw)
      if (!parsed) return null
      return `${parsed.year}-${pad2(parsed.month)}-${pad2(parsed.day)}`
    }

    if (raw.includes('T') && ISO_DATE_PATTERN.test(raw.slice(0, 10))) {
      return raw.slice(0, 10)
    }

    return null
  }

  return {
    formatDate,
    toIsoDate
  }
}
