import { createSupabaseServerClient } from '../utils/supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseKey = config.public.supabaseAnonKey as string

  if (!supabaseUrl || !supabaseKey) {
    return
  }

  const supabase = createSupabaseServerClient(event)
  await supabase.auth.getUser().catch(() => null)
})
