import { createError, getHeader, getQuery, type H3Event } from 'h3'
import { createSupabaseServerClient } from './supabase/server'

export const extractEditKey = (event: H3Event): string | null => {
  const query = getQuery(event)
  const queryKey = typeof query.key === 'string' ? query.key : null
  if (queryKey) return queryKey
  const header = getHeader(event, 'x-edit-key')
  return header ?? null
}

export const assertEditKey = async (event: H3Event): Promise<void> => {
  const config = useRuntimeConfig(event)

  // When Supabase is configured, validate via session cookie first
  if (config.public.supabaseUrl && (config.public.supabaseAnonKey || config.supabaseServiceKey)) {
    try {
      const client = createSupabaseServerClient(event)
      const { data: { user } } = await client.auth.getUser()
      if (user) return
    } catch {
      // fall through to edit key
    }
  }

  // Fallback: edit key (local dev / in-memory mode)
  const expected = config.editKey as string
  const received = extractEditKey(event)
  if (!received || received !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
