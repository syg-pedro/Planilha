import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

const colorSchema = z.object({
  primary: z.string(),
  accent: z.string(),
  positive: z.string(),
  negative: z.string(),
  neutral: z.string(),
  background: z.string(),
  card: z.string()
})

const schema = z.object({
  themeMode: z.enum(['light', 'dark', 'eva', 'cyberpunk', 'arasaka', 'custom', 'system']),
  densityMode: z.enum(['compact', 'comfortable']),
  colorTokens: colorSchema
})

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid theme payload' })
  }

  const repo = getRepository(householdId)
  const settings = await repo.saveTheme(parsed.data)
  return { settings }
})
