import { createSupabaseServerClient } from '../utils/supabase/server'

export default defineEventHandler(async (event) => {
  if (import.meta.dev && process.env.NUXT_JAVA_LAB === '1') return
  const config = useRuntimeConfig(event)
  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseKey = config.public.supabaseAnonKey as string

  if (!supabaseUrl || !supabaseKey) {
    return
  }

  const supabase = createSupabaseServerClient(event)
  await supabase.auth.getUser().catch(() => null)
})
