import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'
import { UI_COLOR_ALIASES, UI_ICON_SETS, UI_PRESET_IDS, UI_THEME_FONTS, UI_THEME_PALETTES } from '../../../shared/uiTheme'

const schema = z.object({
  periodMode: z.enum(['due_date', 'competence']),
  notificationTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  dashboardConfig: z.object({
    visibleWidgets: z.array(z.string()),
    sortMode: z.enum(['date_asc', 'date_desc', 'amount_desc']),
    defaultRange: z.enum(['month', 'quarter', 'year']),
    uiTheme: z.object({
      version: z.literal(1),
      preset: z.enum(UI_PRESET_IDS),
      colors: z.partialRecord(z.enum(UI_COLOR_ALIASES), z.string().refine(value => UI_THEME_PALETTES.includes(value))).optional(),
      font: z.enum(UI_THEME_FONTS).optional(),
      icons: z.enum(UI_ICON_SETS).optional(),
      radius: z.number().min(0).max(4).optional()
    }).optional()
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
