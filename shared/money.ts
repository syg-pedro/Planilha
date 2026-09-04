/** Accept decimal input and Brazilian thousands separators, never a numeric prefix. */
export const parseMoney = (value: string | number): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null
  const text = value.trim().replace(/^R\$\s*/, '')
  if (!text) return null
  const brazilian = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)
  const decimal = /^\d+(?:\.\d{1,2})?$/.test(text)
  if (!brazilian && !decimal) return null
  const normalized = brazilian ? text.replace(/\./g, '').replace(',', '.') : text
  const amount = Number(normalized)
  return Number.isSafeInteger(Math.round(amount * 100)) ? Math.round(amount * 100) / 100 : null
}
