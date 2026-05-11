import { createError, defineEventHandler, readBody } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createSupabaseServerClient } from '../../utils/supabase/server'

const schema = z.object({
  token: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw createError({ statusCode: 501, statusMessage: 'Convites requerem Supabase configurado' })
  }

  // Must be authenticated to accept invite
  const anonClient = createSupabaseServerClient(event)
  const { data: { user } } = await anonClient.auth.getUser()
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Faça login para aceitar o convite' })
  }

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

  const now = new Date().toISOString()

  const { data: invite, error: inviteError } = await serviceClient
    .from('household_invitations')
    .select('*')
    .eq('token', parsed.data.token)
    .is('accepted_at', null)
    .gt('expires_at', now)
    .single()

  if (inviteError || !invite) {
    throw createError({ statusCode: 404, statusMessage: 'Convite inválido ou expirado' })
  }

  if (invite.email !== user.email) {
    throw createError({ statusCode: 403, statusMessage: 'Este convite não é para o seu e-mail' })
  }

  // Move user to the invited household (overwrite existing membership)
  const { error: memberError } = await serviceClient
    .from('household_members')
    .upsert({ user_id: user.id, household_id: invite.household_id, role: invite.role })

  if (memberError) throw createError({ statusCode: 500, statusMessage: memberError.message })

  // Mark invite as accepted
  await serviceClient
    .from('household_invitations')
    .update({ accepted_at: now })
    .eq('id', invite.id)

  return { householdId: invite.household_id }
})
