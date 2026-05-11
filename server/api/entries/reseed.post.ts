import { defineEventHandler, createError } from 'h3'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  const repo = getRepository(householdId)
  try {
    const count = await repo.reseedEntries()
    return { count }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 500, statusMessage: `Reseed falhou: ${message}` })
  }
})
