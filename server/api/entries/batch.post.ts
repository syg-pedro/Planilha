import { createError, defineEventHandler, readBody } from 'h3'
import { entryBatchSchema as schema } from '../../../shared/batchSchemas'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid entries batch payload' })
  }

  const repo = getRepository(householdId)
  const entries = await repo.saveEntriesBatch(parsed.data.upserts, parsed.data.deletes)
  return { entries }
})
