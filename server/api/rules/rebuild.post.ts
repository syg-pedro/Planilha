import { defineEventHandler } from 'h3'
import { assertEditKey } from '../../utils/auth'
import { getRepository } from '../../utils/repo'

export default defineEventHandler(async (event) => {
  assertEditKey(event)
  const repo = getRepository()
  const generated = await repo.rebuildRules()
  return { generated }
})
