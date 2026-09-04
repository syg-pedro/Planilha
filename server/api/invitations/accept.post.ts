import { createError, defineEventHandler, readBody } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { requireSessionUser } from '../../utils/sessionUser'

const schema = z.object({
  token: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw createError({ statusCode: 501, statusMessage: 'Convites requerem Supabase configurado' })
  }

  const user = await requireSessionUser(event)

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Token inválido' })
  }

  const serviceClient = createClient(
    config.supabaseUrl as string,
    config.supabaseServiceKey as string,
    { auth: { persistSession: false } }
  )

  const { data: householdId, error } = await serviceClient.rpc('accept_household_invitation', {
    p_user_id: user.id, p_email: user.email, p_token: parsed.data.token,
  })
  if (error) throw createError({ statusCode: error.code === '42501' ? 403 : 400, statusMessage: 'Não foi possível aceitar este convite. Verifique o e-mail e a validade.' })
  return { householdId }
})
