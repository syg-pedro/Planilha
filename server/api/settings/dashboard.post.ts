import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

const schema = z.object({
  periodMode: z.enum(['due_date', 'competence']),
  dashboardConfig: z.object({
    visibleWidgets: z.array(z.string()),
    sortMode: z.enum(['date_asc', 'date_desc', 'amount_desc']),
    defaultRange: z.enum(['month', 'quarter', 'year'])
  })
})

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid dashboard payload' })
  }

  const repo = getRepository(householdId)
  const settings = await repo.saveDashboard(parsed.data)
  return { settings }
})
