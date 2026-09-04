import { createError, getHeader, getQuery, type H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_HOUSEHOLD_ID } from '../../shared/constants'
import { requireSessionUser } from './sessionUser'

export const extractEditKey = (event: H3Event): string | null => {
  const query = getQuery(event)
  const queryKey = typeof query.key === 'string' ? query.key : null
  if (queryKey) return queryKey
  const header = getHeader(event, 'x-edit-key')
  return header ?? null
}

export const assertEditKey = async (event: H3Event): Promise<{ householdId: string }> => {
  const config = useRuntimeConfig(event)
  const isSupabaseEnabled = Boolean(
    config.public.supabaseUrl && (config.public.supabaseAnonKey || config.supabaseServiceKey)
  )

  if (isSupabaseEnabled) {
    const user = await requireSessionUser(event)
    const serviceClient = createClient(config.supabaseUrl as string, config.supabaseServiceKey as string, { auth: { persistSession: false } })
    const { data, error } = await serviceClient.from('household_members').select('household_id').eq('user_id', user.id).maybeSingle()
    if (error) throw createError({ statusCode: 503, statusMessage: 'Não foi possível consultar sua família. Tente novamente.' })
    if (!data) throw createError({ statusCode: 409, statusMessage: 'Sua família ainda não foi configurada. Entre novamente.' })
    return { householdId: data.household_id }
  }

  // Fallback: edit key apenas no modo local / in-memory.
  const expected = config.editKey as string
  const received = extractEditKey(event)
  if (!received || received !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return { householdId: DEFAULT_HOUSEHOLD_ID }
}
