import { createError, getHeader, getQuery, H3Event } from 'h3'

export const extractEditKey = (event: H3Event): string | null => {
  const query = getQuery(event)
  const queryKey = typeof query.key === 'string' ? query.key : null
  if (queryKey) {
    return queryKey
  }

  const header = getHeader(event, 'x-edit-key')
  return header ?? null
}

export const assertEditKey = (event: H3Event): void => {
  const config = useRuntimeConfig(event)
  const expected = config.editKey as string
  const received = extractEditKey(event)

  if (!received || received !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid edit key' })
  }
}
