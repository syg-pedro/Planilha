import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return []
  return cookieHeader.split(';').map(c => {
    const idx = c.indexOf('=')
    if (idx < 0) return { name: c.trim(), value: '' }
    return { name: c.slice(0, idx).trim(), value: c.slice(idx + 1).trim() }
  }).filter(c => c.name)
}

export const useSupabaseClient = (): SupabaseClient | null => {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.public.supabaseAnonKey as string
  if (!url || !key) return null

  if (import.meta.server) {
    const cookieHeader = useRequestHeaders(['cookie']).cookie ?? ''
    return createServerClient(url, key, {
      cookies: {
        getAll() {
          return parseCookieHeader(cookieHeader)
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            try {
              const c = useCookie(name)
              ;(c as { value: string }).value = value
            } catch {
              // ignore when not in SSR context
            }
          })
        }
      }
    })
  }

  return createBrowserClient(url, key)
}
