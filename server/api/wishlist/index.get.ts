import { defineEventHandler } from 'h3'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  const repo = getRepository(householdId)
  const items = await repo.getWishItems()
  return { items }
})
