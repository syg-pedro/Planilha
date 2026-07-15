const numericSegments = (version: string) => version
  .trim()
  .replace(/^v/i, '')
  .split('.')
  .map((segment) => Number.parseInt(segment, 10) || 0)

/** Retorna true somente quando a versao candidata e mais nova que a atual. */
export const isVersionNewer = (candidate: string, current: string) => {
  const candidateSegments = numericSegments(candidate)
  const currentSegments = numericSegments(current)
  const length = Math.max(candidateSegments.length, currentSegments.length)

  for (let index = 0; index < length; index += 1) {
    const difference = (candidateSegments[index] || 0) - (currentSegments[index] || 0)
    if (difference !== 0) return difference > 0
  }

  return false
}
