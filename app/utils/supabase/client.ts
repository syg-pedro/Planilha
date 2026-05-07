import { createBrowserClient } from '@supabase/ssr'

export const createSupabaseBrowserClient = () => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseAnonKey

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase public config is missing. Check NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
