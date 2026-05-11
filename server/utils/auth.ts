import { createError, getHeader, getQuery, type H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_COLORS, DEFAULT_DASHBOARD_CONFIG, DEFAULT_HOUSEHOLD_ID } from '../../shared/constants'
import { createSupabaseServerClient } from './supabase/server'

export const extractEditKey = (event: H3Event): string | null => {
  const query = getQuery(event)
  const queryKey = typeof query.key === 'string' ? query.key : null
  if (queryKey) return queryKey
  const header = getHeader(event, 'x-edit-key')
  return header ?? null
}

export const assertEditKey = async (event: H3Event): Promise<{ householdId: string }> => {
  const config = useRuntimeConfig(event)

  // When Supabase is configured, validate via session cookie first
  if (config.public.supabaseUrl && (config.public.supabaseAnonKey || config.supabaseServiceKey)) {
    try {
      const client = createSupabaseServerClient(event)
      const { data: { user } } = await client.auth.getUser()
      if (user) {
        // Look up the user's household using the service key (bypasses RLS)
        const serviceClient = createClient(
          config.supabaseUrl as string,
          config.supabaseServiceKey as string,
          { auth: { persistSession: false } }
        )
        const { data } = await serviceClient
          .from('household_members')
          .select('household_id')
          .eq('user_id', user.id)
          .single()

        if (data?.household_id) {
          return { householdId: data.household_id }
        }

        // User authenticated but no household yet (edge case) — create one
        const newHouseholdId = `hh-${crypto.randomUUID()}`
        await serviceClient.from('household_settings').insert({
          id: newHouseholdId,
          currency: 'BRL',
          timezone: 'America/Sao_Paulo',
          theme_mode: 'light',
          density_mode: 'compact',
          period_mode: 'due_date',
          horizon_months: 18,
          notification_days: [3, 1],
          color_tokens: DEFAULT_COLORS,
          dashboard_config: DEFAULT_DASHBOARD_CONFIG,
          updated_at: new Date().toISOString()
        })
        await serviceClient.from('household_members').insert({
          user_id: user.id,
          household_id: newHouseholdId,
          role: 'owner'
        })
        return { householdId: newHouseholdId }
      }
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
  return { householdId: DEFAULT_HOUSEHOLD_ID }
}
