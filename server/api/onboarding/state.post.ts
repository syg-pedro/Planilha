import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

const schema = z.object({
  onboarding: z.object({
    version: z.literal(1),
    status: z.enum(['new', 'active', 'dismissed', 'completed']),
    completedSteps: z.array(z.string().min(1).max(40)).max(20),
    updatedAt: z.string().datetime(),
  }),
})

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Estado de introdução inválido.' })
  }

  const settings = await getRepository(householdId).saveOnboarding(parsed.data.onboarding)
  return { settings }
})
