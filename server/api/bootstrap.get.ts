import { defineEventHandler } from 'h3'
import { assertEditKey } from '../utils/auth'
import { getRepository } from '../utils/repo'

export default defineEventHandler(async (event) => {
  await assertEditKey(event)
  const repo = getRepository()
  return await repo.bootstrap()
})
