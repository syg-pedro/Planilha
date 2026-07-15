import { createError, defineEventHandler, readBody } from 'h3'
import { assertEditKey } from '../../../utils/auth'
import { parseOnboardingImportPayload } from '../../../utils/onboarding'
import { getRepository } from '../../../utils/repo'

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  try {
    const payload = parseOnboardingImportPayload(await readBody(event))
    return await getRepository(householdId).previewOnboardingImport(payload)
  } catch (error) {
    if (error instanceof Error) {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }
    throw error
  }
})
