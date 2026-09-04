import { createError, defineEventHandler, readBody } from 'h3'
import { wishBatchSchema as schema } from '../../../shared/batchSchemas'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid wish batch payload' })
  const repo = getRepository(householdId)
  const items = await repo.saveWishItems(parsed.data.upserts, parsed.data.deletes)
  return { items }
})
