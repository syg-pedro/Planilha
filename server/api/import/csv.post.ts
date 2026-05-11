import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

const schema = z.object({
  csvText: z.string().min(1),
  accountId: z.string().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid CSV payload' })
  }

  const repo = getRepository(householdId)
  return await repo.importCsv(parsed.data.csvText, parsed.data.accountId ?? null)
})
