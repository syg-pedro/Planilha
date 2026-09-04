import { createError, getHeader, type H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './supabase/server'

export const requireSessionUser = async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const token = getHeader(event, 'authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const client = token
    ? createClient(config.supabaseUrl as string, config.supabaseServiceKey as string, { auth: { persistSession: false } })
    : createSupabaseServerClient(event)
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) throw createError({ statusCode: 401, statusMessage: 'Faça login para continuar' })
  return user
}
