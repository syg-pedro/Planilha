import { createError, defineEventHandler, readBody } from 'h3'
import { ruleBatchSchema as schema } from '../../../shared/batchSchemas'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  const body   = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid rules batch payload' })
  }
  const repo  = getRepository(householdId)
  const rules = await repo.saveRules(parsed.data.upserts, parsed.data.deletes)
  return { rules }
})
