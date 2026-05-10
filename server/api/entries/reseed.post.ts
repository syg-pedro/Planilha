import { defineEventHandler } from 'h3'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

export default defineEventHandler(async (event) => {
  assertEditKey(event)
  const repo = getRepository()
  const count = await repo.reseedEntries()
  return { count }
})
