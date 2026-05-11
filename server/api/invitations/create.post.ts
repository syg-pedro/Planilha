import { createError, defineEventHandler, readBody } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { assertEditKey } from '../../utils/auth'
import { makeId } from '../../../shared/id'

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'owner']).default('member')
})

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  const config = useRuntimeConfig(event)

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw createError({ statusCode: 501, statusMessage: 'Convites requerem Supabase configurado' })
  }

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail inválido' })
  }

  const client = createClient(
    config.supabaseUrl as string,
    config.supabaseServiceKey as string,
    { auth: { persistSession: false } }
  )

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await client.from('household_invitations').insert({
    id: makeId('inv'),
    household_id: householdId,
    email: parsed.data.email,
    token,
    role: parsed.data.role,
    expires_at: expiresAt
  })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { token, expiresAt }
})
