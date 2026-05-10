import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

const schema = z.object({
  upserts: z.array(z.object({}).passthrough()).default([]),
  deletes: z.array(z.string()).default([])
})

export default defineEventHandler(async (event) => {
  await assertEditKey(event)
  const body   = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid rules batch payload' })
  }
  const repo  = getRepository()
  const rules = await repo.saveRules(parsed.data.upserts as any[], parsed.data.deletes)
  return { rules }
})
