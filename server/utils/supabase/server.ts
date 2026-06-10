import { createServerClient } from '@supabase/ssr'
import { parseCookies, setCookie, type H3Event } from 'h3'
import WebSocket from 'ws'

export const createSupabaseServerClient = (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseKey = (config.public.supabaseAnonKey as string) || (config.supabaseServiceKey as string)

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase config is missing. Define SUPABASE_URL and a publishable/anon key.')
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    // Node < 22 não tem WebSocket nativo; o realtime-js precisa de um transporte explícito.
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
    cookies: {
      getAll() {
        const cookies = parseCookies(event)
        return Object.entries(cookies).map(([name, value]) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(event, name, value, options as Parameters<typeof setCookie>[3])
        })
      }
    }
  })
}
